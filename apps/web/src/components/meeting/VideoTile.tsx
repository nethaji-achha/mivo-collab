'use client';

import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, VideoOff, Pin, Hand, Wifi } from 'lucide-react';
import { PeerMediaState } from '@mivo/types';
import { AudioVisualizer } from './AudioVisualizer';

interface VideoTileProps {
  participant: PeerMediaState;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export function VideoTile({
  participant,
  stream,
  isLocal = false,
  isPinned = false,
  onTogglePin,
  className = '',
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, participant.videoEnabled]);

  const hasActiveVideo = participant.videoEnabled && stream;

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl bg-dark-card border transition-all duration-200 flex items-center justify-center ${
        participant.isSpeaking
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/50'
          : isPinned
          ? 'border-mivo-500 shadow-lg shadow-mivo-500/20'
          : 'border-white/10 hover:border-white/20'
      } ${className}`}
    >
      {/* Video Element */}
      {hasActiveVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local audio feedback
          className={`h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Video Off Avatar Placeholder */
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="relative">
            <img
              src={
                participant.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(participant.displayName)}`
              }
              alt={participant.displayName}
              className={`h-20 w-20 rounded-2xl object-cover border-2 transition-all ${
                participant.isSpeaking
                  ? 'border-emerald-400 shadow-lg shadow-emerald-400/30 ring-4 ring-emerald-500/30 scale-105'
                  : 'border-white/10'
              }`}
            />
            {!participant.audioEnabled && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow">
                <MicOff className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-white truncate max-w-[180px]">
            {participant.displayName} {isLocal && '(You)'}
          </p>
          <span className="mt-1 flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
            <VideoOff className="h-3 w-3" /> Camera off
          </span>
        </div>
      )}

      {/* Top Left Indicators (Host Tag, Pin, Hand Raise) */}
      <div className="absolute top-3 left-3 flex items-center space-x-1.5 z-10">
        {participant.role === 'host' && (
          <span className="rounded-md bg-mivo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-md">
            Host
          </span>
        )}
        {participant.handRaised && (
          <span className="flex items-center space-x-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-bounce">
            <Hand className="h-3 w-3" />
            <span>Hand Raised</span>
          </span>
        )}
      </div>

      {/* Top Right Action (Pin/Spotlight) */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg bg-dark-bg/80 text-slate-300 hover:text-white border border-white/10 transition-all z-10"
          title={isPinned ? 'Unpin' : 'Pin to spotlight'}
        >
          <Pin className={`h-3.5 w-3.5 ${isPinned ? 'text-mivo-400 fill-mivo-400' : ''}`} />
        </button>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center space-x-2 rounded-lg bg-dark-bg/80 px-2.5 py-1 backdrop-blur-md border border-white/5">
          <span className="text-xs font-medium text-white truncate max-w-[140px]">
            {participant.displayName} {isLocal && '(You)'}
          </span>
          {participant.isSpeaking && participant.audioEnabled && (
            <AudioVisualizer level={participant.audioLevel || 50} barCount={4} />
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-md border border-white/5 ${
              participant.audioEnabled ? 'bg-dark-bg/80 text-slate-300' : 'bg-rose-500/80 text-white'
            }`}
          >
            {participant.audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>
    </div>
  );
}
