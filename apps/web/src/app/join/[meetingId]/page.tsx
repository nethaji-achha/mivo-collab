'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  AlertCircle,
  Play,
  ArrowLeft,
  Sliders,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { WebRTCManager, MediaDeviceInfoList } from '@/lib/webrtc/webrtc-manager';
import { AudioVisualizer } from '@/components/meeting/AudioVisualizer';
import { DeviceSettingsModal } from '@/components/meeting/DeviceSettingsModal';

export default function PreJoinPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.meetingId as string;
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfoList>({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [meetingDetails, setMeetingDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.name);
    } else if (!displayName) {
      setDisplayName(`Guest_${Math.floor(1000 + Math.random() * 9000)}`);
    }

    // Load meeting details
    api.getMeetingById(meetingId).then((res) => {
      if (res.success && res.data) {
        setMeetingDetails(res.data);
      }
    });

    // Initialize WebRTC media preview
    const rtc = new WebRTCManager();
    rtcRef.current = rtc;

    rtc.onAudioLevel((level) => {
      if (!isAudioMuted) {
        setMicLevel(level);
      } else {
        setMicLevel(0);
      }
    });

    rtc
      .startLocalMedia({ audio: true, video: true })
      .then(async (stream) => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        const devList = await rtc.getMediaDevices();
        setDevices(devList);
        if (devList.audioInputs[0]) setSelectedAudioInput(devList.audioInputs[0].deviceId);
        if (devList.videoInputs[0]) setSelectedVideoInput(devList.videoInputs[0].deviceId);
        if (devList.audioOutputs[0]) setSelectedAudioOutput(devList.audioOutputs[0].deviceId);
      })
      .catch((err) => {
        console.warn('Device permission warning:', err);
        setPermissionError('Camera or Microphone access was denied. You can still join using text & listen.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      rtc.cleanup();
    };
  }, [meetingId, user]);

  const toggleMic = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (rtcRef.current) {
      rtcRef.current.toggleAudio(!nextState);
    }
  };

  const toggleVideo = () => {
    const nextState = !isVideoMuted;
    setIsVideoMuted(nextState);
    if (rtcRef.current) {
      rtcRef.current.toggleVideo(!nextState);
    }
  };

  const handleJoin = () => {
    // Store pre-join preferences into session storage for room consumption
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mivo_displayName', displayName.trim() || 'Anonymous Collab');
      sessionStorage.setItem('mivo_initialAudio', (!isAudioMuted).toString());
      sessionStorage.setItem('mivo_initialVideo', (!isVideoMuted).toString());
    }
    router.push(`/meetings/${meetingId}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Live Video Preview Canvas */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-dark-card border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Live Video Element */}
            {!isVideoMuted ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-tr from-mivo-600 to-amber-500 p-0.5 shadow-xl">
                  <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-dark-bg p-3">
                    <img src="/logo.png" alt="Mivo Collab" className="h-full w-full object-contain rounded-xl" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                  <VideoOff className="h-3.5 w-3.5" /> Camera is off
                </span>
              </div>
            )}

            {/* Audio Indicator Overlay */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 rounded-xl bg-dark-bg/80 px-3 py-1.5 backdrop-blur-md border border-white/10">
              {isAudioMuted ? (
                <span className="flex items-center gap-1.5 text-xs text-rose-400">
                  <MicOff className="h-3.5 w-3.5" /> Muted
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  <AudioVisualizer level={micLevel} barCount={4} />
                </div>
              )}
            </div>

            {/* In-Preview Quick Toggles */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-2">
              <button
                onClick={toggleMic}
                className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md transition-all ${
                  isAudioMuted
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-dark-bg/80 text-white border border-white/10 hover:bg-dark-bg'
                }`}
                title={isAudioMuted ? 'Unmute' : 'Mute'}
              >
                {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-md transition-all ${
                  isVideoMuted
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-dark-bg/80 text-white border border-white/10 hover:bg-dark-bg'
                }`}
                title={isVideoMuted ? 'Start Video' : 'Stop Video'}
              >
                {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-bg/80 text-slate-300 border border-white/10 hover:text-white backdrop-blur-md transition-all"
                title="Device Settings"
              >
                <Sliders className="h-4 w-4" />
              </button>
            </div>
          </div>

          {permissionError && (
            <div className="flex items-center space-x-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>

        {/* Right Col: Meeting Info & Join Box */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-dark-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
          <div>
            <span className="rounded bg-mivo-500/20 px-2 py-0.5 text-[10px] font-bold text-mivo-300 uppercase tracking-wider">
              Ready to Join
            </span>
            <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white tracking-tight">
              {meetingDetails?.title || 'Mivo Collab Room'}
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-mono">ID: {meetingId}</p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300">Your Display Name</label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-400 bg-dark-bg/50 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span>Microphone:</span>
                <span className={isAudioMuted ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
                  {isAudioMuted ? 'Muted' : 'Enabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Camera:</span>
                <span className={isVideoMuted ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
                  {isVideoMuted ? 'Disabled' : 'HD 1080p'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>SFU Media Server:</span>
                <span className="text-cyan-400 font-medium">Optimal (24ms)</span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={!displayName.trim()}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 via-mivo-500 to-cyan-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-mivo-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <Play className="h-4 w-4" />
              <span>Join Meeting Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        devices={devices}
        selectedAudioInput={selectedAudioInput}
        selectedVideoInput={selectedVideoInput}
        selectedAudioOutput={selectedAudioOutput}
        onSelectAudioInput={(id) => {
          setSelectedAudioInput(id);
          rtcRef.current?.switchMicrophone(id);
        }}
        onSelectVideoInput={(id) => {
          setSelectedVideoInput(id);
          rtcRef.current?.switchCamera(id);
        }}
        onSelectAudioOutput={(id) => setSelectedAudioOutput(id)}
        micLevel={micLevel}
      />
    </div>
  );
}
