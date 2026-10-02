'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  Hand,
  Settings,
  PhoneOff,
  ChevronUp,
  Smile,
  Shield,
  Copy,
  Check,
  BarChart3,
} from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  chatOpen: boolean;
  participantsOpen: boolean;
  pollsOpen: boolean;
  unreadChatCount: number;
  participantCount: number;
  activePollCount?: number;
  isHost: boolean;
  meetingId: string;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onTogglePolls: () => void;
  onOpenSettings: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
}

export function ControlBar({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  chatOpen,
  participantsOpen,
  pollsOpen,
  unreadChatCount,
  participantCount,
  activePollCount = 0,
  isHost,
  meetingId,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleChat,
  onToggleParticipants,
  onTogglePolls,
  onOpenSettings,
  onLeaveMeeting,
  onEndMeeting,
}: ControlBarProps) {
  const [showEndModal, setShowEndModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const emojis = ['👍', '👏', '🎉', '❤️', '🚀', '🔥'];

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 sm:space-x-3 rounded-2xl border border-white/10 bg-dark-bg/90 p-2 sm:p-2.5 shadow-2xl backdrop-blur-2xl">
        {/* Mic Toggle */}
        <div className="flex items-center">
          <button
            onClick={onToggleMic}
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
            title={isMuted ? 'Unmute microphone (Alt+A)' : 'Mute microphone (Alt+A)'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>

        {/* Video Toggle */}
        <div className="flex items-center">
          <button
            onClick={onToggleVideo}
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
              isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
            title={isVideoOff ? 'Turn camera on (Alt+V)' : 'Turn camera off (Alt+V)'}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
        </div>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
            isScreenSharing
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}
          title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          <ScreenShare className="h-5 w-5" />
        </button>

        {/* Raise Hand & Reactions */}
        <div className="relative">
          <button
            onClick={onToggleHandRaise}
            className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
              isHandRaised
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
            title="Raise hand or react"
          >
            <Hand className="h-5 w-5" />
          </button>
        </div>

        <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
            chatOpen
              ? 'bg-mivo-600/30 text-mivo-300 border border-mivo-500/40'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}
          title="Meeting Chat"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadChatCount > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-mivo-500 text-[10px] font-bold text-white shadow">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Drawer Toggle */}
        <button
          onClick={onToggleParticipants}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
            participantsOpen
              ? 'bg-mivo-600/30 text-mivo-300 border border-mivo-500/40'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}
          title="Participants"
        >
          <Users className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-200 border border-white/10">
            {participantCount}
          </span>
        </button>

        {/* Polls Drawer Toggle */}
        <button
          onClick={onTogglePolls}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl font-medium transition-all ${
            pollsOpen
              ? 'bg-mivo-600/30 text-mivo-300 border border-mivo-500/40'
              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
          }`}
          title="Meeting Polls"
        >
          <BarChart3 className="h-5 w-5" />
          {activePollCount > 0 && !pollsOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-dark-bg animate-pulse shadow">
              {activePollCount}
            </span>
          )}
        </button>

        {/* Copy Invite Link */}
        <button
          onClick={handleCopyLink}
          className="hidden md:flex h-11 px-3 items-center space-x-1.5 rounded-xl bg-white/5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
          title="Copy meeting invitation link"
        >
          {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
        </button>

        {/* Settings Modal Trigger */}
        <button
          onClick={onOpenSettings}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
          title="Audio & Video Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Leave / End Meeting Button */}
        <button
          onClick={() => {
            if (isHost && onEndMeeting) {
              setShowEndModal(true);
            } else {
              onLeaveMeeting();
            }
          }}
          className="flex h-11 items-center space-x-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 transition-all"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Host End Meeting Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Leave or End Meeting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              As host, you can leave the room while keeping it open for others, or end the meeting for all participants.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowEndModal(false);
                  if (onEndMeeting) onEndMeeting();
                }}
                className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
              >
                End Meeting for Everyone
              </button>
              <button
                onClick={() => {
                  setShowEndModal(false);
                  onLeaveMeeting();
                }}
                className="w-full rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition-all"
              >
                Just Leave Room
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
