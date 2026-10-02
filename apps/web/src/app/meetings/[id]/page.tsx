'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Wifi,
  Shield,
  Radio,
  Pin,
  ScreenShare,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getSignalingSocket } from '@/lib/socket';
import { WebRTCManager, MediaDeviceInfoList } from '@/lib/webrtc/webrtc-manager';
import { PeerMediaState, ChatMessage, ConnectionQualityStatus, Poll } from '@mivo/types';
import { VideoTile } from '@/components/meeting/VideoTile';
import { ControlBar } from '@/components/meeting/ControlBar';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantsPanel } from '@/components/meeting/ParticipantsPanel';
import { DeviceSettingsModal } from '@/components/meeting/DeviceSettingsModal';
import { PollsPanel } from '@/components/meeting/PollsPanel';

export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user } = useAuth();

  // Meeting State
  const [meetingTitle, setMeetingTitle] = useState('Mivo Collab Room');
  const [isHost, setIsHost] = useState(false);
  const [localPeerId, setLocalPeerId] = useState<string>('');
  const [participants, setParticipants] = useState<PeerMediaState[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [activeScreenSharer, setActiveScreenSharer] = useState<string | null>(null);
  const [isRoomLocked, setIsRoomLocked] = useState(false);

  // Local Controls State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [pollsOpen, setPollsOpen] = useState(false);
  const [activePollNotice, setActivePollNotice] = useState<string | null>(null);
  const [activePollCount, setActivePollCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionQualityStatus>('connected');
  const [showSettings, setShowSettings] = useState(false);

  // Devices
  const [devices, setDevices] = useState<MediaDeviceInfoList>({ audioInputs: [], videoInputs: [], audioOutputs: [] });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [micLevel, setMicLevel] = useState(0);

  // Streams & WebRTC Manager Reference
  const rtcRef = useRef<WebRTCManager | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 1. Read pre-join preferences from session storage
    let initialAudio = true;
    let initialVideo = true;
    let displayName = user?.name || 'Anonymous User';

    if (typeof window !== 'undefined') {
      const storedName = sessionStorage.getItem('mivo_displayName');
      const storedAudio = sessionStorage.getItem('mivo_initialAudio');
      const storedVideo = sessionStorage.getItem('mivo_initialVideo');

      if (storedName) displayName = storedName;
      if (storedAudio !== null) initialAudio = storedAudio === 'true';
      if (storedVideo !== null) initialVideo = storedVideo === 'true';
    }

    setIsAudioMuted(!initialAudio);
    setIsVideoMuted(!initialVideo);

    // 2. Initialize WebRTC Manager & local hardware stream
    const rtc = new WebRTCManager();
    rtcRef.current = rtc;

    rtc.onAudioLevel((level, isSpeaking) => {
      setMicLevel(level);
      const socket = getSignalingSocket();
      socket.emit('media:speaking', { isSpeaking, audioLevel: level });
    });

    rtc
      .startLocalMedia({ audio: initialAudio, video: initialVideo })
      .then(async (stream) => {
        setLocalStream(stream);
        const devList = await rtc.getMediaDevices();
        setDevices(devList);
      })
      .catch((err) => console.warn('RTC media error:', err));

    // 3. Connect to Signaling Server
    const socket = getSignalingSocket();

    socket.emit('room:join', {
      publicMeetingId: meetingId,
      displayName,
      avatarUrl: user?.avatarUrl || undefined,
      userId: user?.id,
      initialAudio,
      initialVideo,
    });

    // Handle room joined confirmation
    socket.on('room:joined', (data) => {
      setLocalPeerId(data.peerId);
      setIsHost(data.isHost);
      setMeetingTitle(data.room.title || 'Mivo Collab Room');

      // Local participant representation
      const me: PeerMediaState = {
        peerId: data.peerId,
        userId: user?.id,
        displayName,
        avatarUrl: user?.avatarUrl || undefined,
        role: data.isHost ? 'host' : 'participant',
        audioEnabled: initialAudio,
        videoEnabled: initialVideo,
        screenShareEnabled: false,
        handRaised: false,
        isSpeaking: false,
        audioLevel: 0,
        connectionQuality: 'connected',
      };

      setParticipants([me, ...data.existingParticipants]);
    });

    // Other participant joined
    socket.on('participant:joined', (newPeer) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.peerId === newPeer.peerId)) return prev;
        return [...prev, newPeer];
      });
    });

    // Participant left
    socket.on('participant:left', ({ peerId }) => {
      setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
      if (activeScreenSharer === peerId) {
        setActiveScreenSharer(null);
      }
    });

    // Participant updated (audio, video, speaking, reactions)
    socket.on('participant:updated', (update) => {
      setParticipants((prev) =>
        prev.map((p) => (p.peerId === update.peerId ? { ...p, ...update } : p))
      );
    });

    // Screen sharing started / stopped
    socket.on('screen:started', ({ peerId }) => {
      setActiveScreenSharer(peerId);
    });
    socket.on('screen:stopped', () => {
      setActiveScreenSharer(null);
    });

    // Chat message received
    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setUnreadChatCount((prev) => prev + 1);
    });

    // Host action notification
    socket.on('host:action', (action) => {
      if (action.action === 'room_locked') {
        setIsRoomLocked(true);
      }
    });

    // Meeting ended by host
    socket.on('meeting:ended', ({ reason }) => {
      alert(reason || 'The meeting has ended.');
      router.push('/meetings');
    });

    // Real-time Poll Started Notification
    socket.on('poll:started', (data: { poll: Poll }) => {
      setActivePollCount((prev) => prev + 1);
      setActivePollNotice(data.poll.question);
    });

    socket.on('poll:closed', () => {
      setActivePollCount((prev) => Math.max(0, prev - 1));
    });

    socket.on('poll:reopened', (data: { poll: Poll }) => {
      setActivePollCount((prev) => prev + 1);
      setActivePollNotice(data.poll.question);
    });

    socket.on('poll:deleted', () => {
      setActivePollCount((prev) => Math.max(0, prev - 1));
    });

    // Load initial room messages and active polls from DB API
    api.getMeetingMessages(meetingId).then((res) => {
      if (res.success && res.data) {
        setMessages(res.data);
      }
    });

    api.getMeetingPolls(meetingId).then((res) => {
      if (res.success && res.data) {
        const livePolls = res.data.filter((p) => p.status === 'active');
        setActivePollCount(livePolls.length);
        const unvoted = livePolls.find((p) => !p.userResponded);
        if (unvoted) {
          setActivePollNotice(unvoted.question);
        }
      }
    });

    return () => {
      socket.emit('room:leave');
      socket.off('room:joined');
      socket.off('participant:joined');
      socket.off('participant:left');
      socket.off('participant:updated');
      socket.off('screen:started');
      socket.off('screen:stopped');
      socket.off('chat:message');
      socket.off('host:action');
      socket.off('meeting:ended');
      socket.off('poll:started');
      socket.off('poll:closed');
      socket.off('poll:reopened');
      socket.off('poll:deleted');
      rtc.cleanup();
    };
  }, [meetingId, user]);

  // Handle local Screen Share Stream Attachment
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // Toggle Mic
  const handleToggleMic = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (rtcRef.current) {
      rtcRef.current.toggleAudio(!nextState);
    }
    const socket = getSignalingSocket();
    socket.emit('media:state-change', { audioEnabled: !nextState });
  };

  // Toggle Video
  const handleToggleVideo = () => {
    const nextState = !isVideoMuted;
    setIsVideoMuted(nextState);
    if (rtcRef.current) {
      rtcRef.current.toggleVideo(!nextState);
    }
    const socket = getSignalingSocket();
    socket.emit('media:state-change', { videoEnabled: !nextState });
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    const socket = getSignalingSocket();
    if (!isScreenSharing) {
      try {
        if (rtcRef.current) {
          const sStream = await rtcRef.current.startScreenShare();
          setScreenStream(sStream);
          setIsScreenSharing(true);
          setActiveScreenSharer(localPeerId);
          socket.emit('media:state-change', { screenShareEnabled: true });
        }
      } catch (err) {
        console.warn('Screen share error:', err);
      }
    } else {
      if (rtcRef.current) {
        rtcRef.current.stopScreenShare();
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      setActiveScreenSharer(null);
      socket.emit('media:state-change', { screenShareEnabled: false });
    }
  };

  // Toggle Hand Raise
  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    const socket = getSignalingSocket();
    socket.emit('media:state-change', { handRaised: nextState });
  };

  // Send Chat Message
  const handleSendMessage = (content: string, recipientId?: string) => {
    const socket = getSignalingSocket();
    socket.emit('chat:send', { content, recipientId });
    api.sendMeetingMessage(meetingId, {
      content,
      recipientId,
      senderId: localPeerId,
      senderName: user?.name || 'You',
    });
  };

  // Host Actions
  const handleMuteParticipant = (peerId: string) => {
    const socket = getSignalingSocket();
    socket.emit('host:mute-participant', { targetPeerId: peerId });
  };

  const handleMuteAll = () => {
    const socket = getSignalingSocket();
    socket.emit('host:mute-all');
  };

  const handleRemoveParticipant = (peerId: string) => {
    const socket = getSignalingSocket();
    socket.emit('host:remove-participant', { targetPeerId: peerId });
  };

  const handleToggleLock = (locked: boolean) => {
    setIsRoomLocked(locked);
    const socket = getSignalingSocket();
    socket.emit('host:toggle-lock', { locked });
  };

  const handleLeaveMeeting = () => {
    router.push('/dashboard');
  };

  const handleEndMeeting = async () => {
    const socket = getSignalingSocket();
    socket.emit('host:end-meeting');
    await api.endMeeting(meetingId);
    router.push('/meetings');
  };

  // Calculate Grid Layout Classes
  const getGridColsClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1 max-w-3xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  };

  const pinnedParticipant = participants.find((p) => p.peerId === pinnedPeerId);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-dark-bg select-none">
      {/* Top Meeting Info Strip */}
      <div className="absolute top-4 left-4 z-30 flex items-center space-x-3 rounded-2xl bg-dark-bg/80 border border-white/10 px-3.5 py-2 backdrop-blur-xl shadow-xl">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
          <img src="/logo.png" alt="Mivo Collab" className="h-full w-full object-contain rounded-md" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-white leading-tight">{meetingTitle}</h2>
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <span className="font-mono text-mivo-300">{meetingId}</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Encrypted (DTLS-SRTP)</span>
          </div>
        </div>
      </div>

      {/* Main Media Stage Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-24 overflow-y-auto">
        {/* If Screen Sharing is active OR a participant is pinned */}
        {isScreenSharing || activeScreenSharer || pinnedParticipant ? (
          <div className="flex flex-col lg:flex-row h-full w-full max-w-7xl gap-4 items-center justify-center">
            {/* Main Stage Spotlight (Screen Share or Pinned Speaker) */}
            <div className="relative flex-1 h-full w-full rounded-3xl overflow-hidden bg-dark-card border border-white/10 shadow-2xl flex items-center justify-center">
              {isScreenSharing ? (
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain bg-black"
                />
              ) : pinnedParticipant ? (
                <VideoTile
                  participant={pinnedParticipant}
                  stream={pinnedParticipant.peerId === localPeerId ? localStream : null}
                  isLocal={pinnedParticipant.peerId === localPeerId}
                  isPinned={true}
                  onTogglePin={() => setPinnedPeerId(null)}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ScreenShare className="h-10 w-10 text-mivo-400 animate-pulse" />
                  <p className="mt-2 text-xs font-medium">Viewing presentation stream</p>
                </div>
              )}
            </div>

            {/* Side participant thumbnail strip */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-64 w-full shrink-0">
              {participants.map((p) => (
                <div key={p.peerId} className="h-36 w-48 lg:w-full shrink-0">
                  <VideoTile
                    participant={p}
                    stream={p.peerId === localPeerId ? localStream : null}
                    isLocal={p.peerId === localPeerId}
                    isPinned={pinnedPeerId === p.peerId}
                    onTogglePin={() => setPinnedPeerId(pinnedPeerId === p.peerId ? null : p.peerId)}
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Dynamic Responsive Video Grid */
          <div className={`grid gap-4 w-full mx-auto ${getGridColsClass(participants.length)}`}>
            {participants.map((p) => (
              <div key={p.peerId} className="aspect-video w-full min-h-[220px]">
                <VideoTile
                  participant={p}
                  stream={p.peerId === localPeerId ? localStream : null}
                  isLocal={p.peerId === localPeerId}
                  isPinned={pinnedPeerId === p.peerId}
                  onTogglePin={() => setPinnedPeerId(p.peerId)}
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Active Poll Notice Banner for Participants */}
      {activePollNotice && !pollsOpen && (
        <div className="fixed top-20 right-6 z-40 max-w-sm rounded-2xl border border-mivo-500/40 bg-dark-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30 shrink-0">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mivo-400">
                  New Live Poll
                </span>
                <button
                  onClick={() => setActivePollNotice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-bold text-white line-clamp-2">{activePollNotice}</p>
              <button
                onClick={() => {
                  setPollsOpen(true);
                  setActivePollNotice(null);
                  setChatOpen(false);
                  setParticipantsOpen(false);
                }}
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                <span>Vote Now</span> →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Control Toolbar */}
      <ControlBar
        isMuted={isAudioMuted}
        isVideoOff={isVideoMuted}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        pollsOpen={pollsOpen}
        unreadChatCount={unreadChatCount}
        participantCount={participants.length}
        activePollCount={activePollCount}
        isHost={isHost}
        meetingId={meetingId}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onToggleChat={() => {
          setChatOpen(!chatOpen);
          if (!chatOpen) setUnreadChatCount(0);
          setParticipantsOpen(false);
          setPollsOpen(false);
        }}
        onToggleParticipants={() => {
          setParticipantsOpen(!participantsOpen);
          setChatOpen(false);
          setPollsOpen(false);
        }}
        onTogglePolls={() => {
          setPollsOpen(!pollsOpen);
          setChatOpen(false);
          setParticipantsOpen(false);
          setActivePollNotice(null);
        }}
        onOpenSettings={() => setShowSettings(true)}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeeting={handleEndMeeting}
      />

      {/* Chat Side Drawer */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        participants={participants}
        currentUserId={localPeerId}
        onSendMessage={handleSendMessage}
      />

      {/* Participants Side Drawer */}
      <ParticipantsPanel
        isOpen={participantsOpen}
        onClose={() => setParticipantsOpen(false)}
        participants={participants}
        isHost={isHost}
        currentUserId={localPeerId}
        onMuteParticipant={handleMuteParticipant}
        onMuteAll={handleMuteAll}
        onRemoveParticipant={handleRemoveParticipant}
        onToggleLock={handleToggleLock}
        isLocked={isRoomLocked}
      />

      {/* Host-Controlled Polling Panel */}
      <PollsPanel
        isOpen={pollsOpen}
        onClose={() => setPollsOpen(false)}
        meetingId={meetingId}
        isHost={isHost}
        peerId={localPeerId}
        displayName={user?.name || 'Participant'}
        participantCount={participants.length}
      />

      {/* Settings Modal */}
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
