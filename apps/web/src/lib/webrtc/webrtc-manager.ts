import { ICE_SERVERS_CONFIG } from '@mivo/config';

export interface MediaDeviceInfoList {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}

export type TrackCallback = (track: MediaStreamTrack, stream: MediaStream, peerId: string) => void;
export type IceCandidateCallback = (candidate: RTCIceCandidate, peerId: string) => void;
export type ConnectionStateCallback = (state: RTCPeerConnectionState, peerId: string) => void;

export class WebRTCManager {
  public localStream: MediaStream | null = null;
  public screenStream: MediaStream | null = null;
  public audioContext: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public peerConnections: Map<string, RTCPeerConnection> = new Map();

  private audioLevelCallback?: (level: number, isSpeaking: boolean) => void;
  private animationFrameId?: number;

  /**
   * Enumerate connected hardware devices
   */
  public async getMediaDevices(): Promise<MediaDeviceInfoList> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch (err) {
      console.warn('[WebRTCManager] Failed to enumerate devices:', err);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  /**
   * Request user media with crystal-clear audio settings and fallback
   */
  public async startLocalMedia(
    constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
    }
  ): Promise<MediaStream> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        this.localStream = this.createSyntheticStream();
      }
    } catch (err: any) {
      console.warn('[WebRTCManager] Real hardware access denied/unavailable, creating fallback stream:', err.message);
      this.localStream = this.createSyntheticStream();
    }

    this.setupAudioAnalyser(this.localStream);
    return this.localStream;
  }

  /**
   * Start 60fps HD screen sharing with system audio capture
   */
  public async startScreenShare(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported by your browser');
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 },
        } as any,
        audio: true,
      });

      // Handle user stopping screen share via native browser bar
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Replace video track on active peer connections with screen share
      const screenVideoTrack = this.screenStream.getVideoTracks()[0];
      if (screenVideoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        });
      }

      return this.screenStream;
    } catch (err: any) {
      console.warn('[WebRTCManager] Screen share request cancelled or failed:', err.message);
      throw err;
    }
  }

  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Restore camera track to peer connections
    if (this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      if (cameraTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }
    }
  }

  public toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  public toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  public async switchCamera(deviceId: string) {
    if (!this.localStream) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      const oldTrack = this.localStream.getVideoTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);

      // Update peer connections
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(newTrack);
      });
    } catch (err) {
      console.warn('[WebRTCManager] Failed to switch camera:', err);
    }
  }

  public async switchMicrophone(deviceId: string) {
    if (!this.localStream) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });
      const newTrack = newStream.getAudioTracks()[0];
      const oldTrack = this.localStream.getAudioTracks()[0];

      if (oldTrack) {
        this.localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      this.localStream.addTrack(newTrack);
      this.setupAudioAnalyser(this.localStream);

      // Update peer connections
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
        if (sender) sender.replaceTrack(newTrack);
      });
    } catch (err) {
      console.warn('[WebRTCManager] Failed to switch microphone:', err);
    }
  }

  public onAudioLevel(callback: (level: number, isSpeaking: boolean) => void) {
    this.audioLevelCallback = callback;
  }

  private setupAudioAnalyser(stream: MediaStream) {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const source = this.audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 255) * 100));
        const isSpeaking = normalized > 15;

        if (this.audioLevelCallback) {
          this.audioLevelCallback(normalized, isSpeaking);
        }

        this.animationFrameId = requestAnimationFrame(checkAudioLevel);
      };

      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = requestAnimationFrame(checkAudioLevel);
    } catch (err) {
      console.warn('[WebRTCManager] Audio analyser setup failed:', err);
    }
  }

  /**
   * Fallback stream containing animated video canvas and synthesized audio node
   */
  public createSyntheticStream(): MediaStream {
    const stream = new MediaStream();

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        let hue = 210;
        const draw = () => {
          hue = (hue + 0.5) % 360;
          ctx.fillStyle = `hsl(${hue}, 45%, 12%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw subtle grid
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          // Header
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Mivo Collab HD Stream', canvas.width / 2, canvas.height / 2 - 20);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText('WebRTC Media Channel Active', canvas.width / 2, canvas.height / 2 + 15);

          requestAnimationFrame(draw);
        };
        draw();
      }

      if (canvas.captureStream) {
        const videoTrack = canvas.captureStream(30).getVideoTracks()[0];
        if (videoTrack) stream.addTrack(videoTrack);
      }
    }

    // Create synthetic silent audio track using Web Audio API
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const actx = new AudioCtx();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          gain.gain.value = 0.0001; // inaudible
          osc.connect(gain);
          const dst = actx.createMediaStreamDestination();
          gain.connect(dst);
          osc.start();
          const audioTrack = dst.stream.getAudioTracks()[0];
          if (audioTrack) stream.addTrack(audioTrack);
        }
      } catch (e) {
        console.warn('Could not generate synthetic audio track', e);
      }
    }

    return stream;
  }

  /**
   * Create RTCPeerConnection for a remote peer and bind tracks & ICE candidates
   */
  public createPeerConnection(
    peerId: string,
    onTrack: TrackCallback,
    onIceCandidate: IceCandidateCallback,
    onConnectionStateChange?: ConnectionStateCallback
  ): RTCPeerConnection {
    // Reuse existing connection if present
    if (this.peerConnections.has(peerId)) {
      const existing = this.peerConnections.get(peerId)!;
      if (existing.connectionState !== 'closed' && existing.connectionState !== 'failed') {
        return existing;
      }
      existing.close();
      this.peerConnections.delete(peerId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS_CONFIG);

    pc.ontrack = (event) => {
      console.log(`📡 [WebRTC] Received remote track (${event.track.kind}) from peer: ${peerId}`);
      onTrack(event.track, event.streams[0] || new MediaStream([event.track]), peerId);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate, peerId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`🔌 [WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (onConnectionStateChange) {
        onConnectionStateChange(pc.connectionState, peerId);
      }
    };

    // Add local media tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  /**
   * Create SDP Offer for remote peer
   */
  public async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error(`PeerConnection not found for ${peerId}`);

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle incoming SDP Offer and produce SDP Answer
   */
  public async handleOffer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error(`PeerConnection not found for ${peerId}`);

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle incoming SDP Answer
   */
  public async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  public async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn(`[WebRTC] Failed to add ICE candidate for ${peerId}:`, err);
    }
  }

  public closePeer(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  public cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
