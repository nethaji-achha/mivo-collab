'use client';

import React, { useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, MoreVertical, Shield, UserX, Lock, Unlock, VolumeX } from 'lucide-react';
import { PeerMediaState } from '@mivo/types';

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  participants: PeerMediaState[];
  isHost: boolean;
  currentUserId?: string;
  onMuteParticipant: (peerId: string) => void;
  onMuteAll: () => void;
  onRemoveParticipant: (peerId: string) => void;
  onToggleLock: (locked: boolean) => void;
  isLocked?: boolean;
}

export function ParticipantsPanel({
  isOpen,
  onClose,
  participants,
  isHost,
  currentUserId,
  onMuteParticipant,
  onMuteAll,
  onRemoveParticipant,
  onToggleLock,
  isLocked = false,
}: ParticipantsPanelProps) {
  const [activeMenuPeerId, setActiveMenuPeerId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-dark-bg/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div>
          <h3 className="text-sm font-bold text-white">Participants ({participants.length})</h3>
          <p className="text-[11px] text-slate-400">Manage room members and permissions</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Host Controls Bar */}
      {isHost && (
        <div className="border-b border-white/10 bg-dark-card/50 p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={onMuteAll}
              className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg bg-rose-600/20 border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-600/30 transition-all"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Mute All</span>
            </button>
            <button
              onClick={() => onToggleLock(!isLocked)}
              className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isLocked
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              <span>{isLocked ? 'Room Locked' : 'Lock Room'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {participants.map((p) => {
          const isMe = p.peerId === currentUserId;
          return (
            <div
              key={p.peerId}
              className="flex items-center justify-between rounded-xl bg-dark-card/40 border border-white/5 p-2.5 hover:bg-dark-card/70 transition-colors relative"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={
                      p.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.displayName)}`
                    }
                    alt={p.displayName}
                    className="h-9 w-9 rounded-xl object-cover border border-white/10"
                  />
                  {p.isSpeaking && p.audioEnabled && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {p.displayName}
                    </span>
                    {isMe && <span className="text-[10px] text-slate-400">(You)</span>}
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    {p.role === 'host' ? (
                      <span className="text-[10px] font-medium text-mivo-400">Host</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Participant</span>
                    )}
                    <span className="text-[10px] text-slate-600">•</span>
                    <span
                      className={`text-[9px] font-medium uppercase ${
                        p.connectionQuality === 'connected'
                          ? 'text-emerald-400'
                          : p.connectionQuality === 'poor'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {p.connectionQuality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Icons & Action Menu */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${
                      p.audioEnabled ? 'text-slate-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {p.audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${
                      p.videoEnabled ? 'text-slate-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {p.videoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {isHost && !isMe && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuPeerId(activeMenuPeerId === p.peerId ? null : p.peerId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>

                    {activeMenuPeerId === p.peerId && (
                      <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-white/10 bg-dark-card p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in">
                        {p.audioEnabled && (
                          <button
                            onClick={() => {
                              onMuteParticipant(p.peerId);
                              setActiveMenuPeerId(null);
                            }}
                            className="flex w-full items-center px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                          >
                            <MicOff className="mr-2 h-3.5 w-3.5 text-rose-400" />
                            Mute audio
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onRemoveParticipant(p.peerId);
                            setActiveMenuPeerId(null);
                          }}
                          className="flex w-full items-center px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <UserX className="mr-2 h-3.5 w-3.5" />
                          Remove from room
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
