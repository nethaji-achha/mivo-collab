'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  CalendarPlus,
  ArrowRight,
  Clock,
  Users,
  Copy,
  Check,
  Zap,
  Play,
  Sparkles,
  TrendingUp,
  Building,
  ShieldCheck,
  Search,
  MessageSquare,
  Coffee,
  Hash,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Meeting } from '@mivo/types';
import { format } from 'date-fns';
import { ProductLifecyclePipeline } from '@/components/lifecycle/ProductLifecyclePipeline';

export default function DashboardPage() {
  const router = useRouter();
  const { user, primaryOrg } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [instantLoading, setInstantLoading] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await api.getMeetings();
      if (res.success && res.data) {
        setMeetings(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInstant = async () => {
    setInstantLoading(true);
    try {
      const res = await api.createMeeting({
        title: `${user?.name || 'My'}'s Instant Meeting`,
        type: 'instant',
      });
      if (res.success && res.data) {
        router.push(`/join/${res.data.publicMeetingId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInstantLoading(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    const cleanId = joinId.trim().replace(/^https?:\/\/[^/]+\/join\//, '');
    router.push(`/join/${cleanId}`);
  };

  const handleCopyLink = (meetingId: string) => {
    const url = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled' || m.status === 'live');
  const pastMeetings = meetings.filter((m) => m.status === 'ended');

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'Alex'}!
          </h1>
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-2">
            <span>{primaryOrg ? `${primaryOrg.name} Workspace` : 'Personal Workspace'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-mivo-400 font-medium capitalize">{primaryOrg?.plan || 'Free'} Plan</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/schedule"
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all"
          >
            <CalendarPlus className="h-4 w-4 text-mivo-400" />
            <span>Schedule Meeting</span>
          </Link>
          <button
            onClick={handleStartInstant}
            disabled={instantLoading}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>{instantLoading ? 'Starting...' : 'Start Instant Meeting'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Start Instant */}
        <div
          onClick={handleStartInstant}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-mivo-500/30 bg-gradient-to-br from-mivo-900/40 via-dark-card to-dark-card p-5 shadow-xl hover:border-mivo-500 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mivo-600 text-white shadow-lg shadow-mivo-600/30 group-hover:scale-110 transition-transform">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-white">Instant Meeting</h3>
            <p className="mt-1 text-xs text-slate-400">
              Generate room URL and start collaborating immediately.
            </p>
          </div>
          <div className="mt-3.5 flex items-center text-xs font-semibold text-mivo-400 group-hover:text-mivo-300">
            <span>Launch Room</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </div>

        {/* Card 2: Team & Office Chat */}
        <Link
          href="/chat"
          className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-dark-card to-dark-card p-5 shadow-xl hover:border-cyan-400 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="mt-3.5 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white">Team & Office Chat</h3>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">Live</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Chat in channels, direct message colleagues & 1-click calls.
            </p>
          </div>
          <div className="mt-3.5 flex items-center text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
            <span>Open Office Chat</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </Link>

        {/* Card 3: Schedule Meeting */}
        <Link
          href="/schedule"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-dark-card p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-white">Schedule Call</h3>
            <p className="mt-1 text-xs text-slate-400">
              Set calendar date, duration, recurring syncs & invites.
            </p>
          </div>
          <div className="mt-3.5 flex items-center text-xs font-semibold text-purple-400 group-hover:text-purple-300">
            <span>Open Scheduler</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </Link>

        {/* Card 4: Join via ID / Link */}
        <div className="rounded-2xl border border-white/10 bg-dark-card p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 border border-white/10">
              <Play className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 text-sm sm:text-base font-bold text-white">Join with ID</h3>
            <p className="mt-1 text-xs text-slate-400">
              Paste meeting link or room passcode.
            </p>
          </div>
          <form onSubmit={handleJoin} className="mt-3 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="e.g. mivo-collab-hq"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              className="flex-1 min-w-0 rounded-xl bg-dark-bg border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!joinId.trim()}
              className="rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-40 transition-all shrink-0"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Teamwork Lifecycle Pipeline */}
      <ProductLifecyclePipeline />

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-dark-card/60 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming Calls</p>
          <p className="mt-1 text-2xl font-bold text-white">{upcomingMeetings.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-dark-card/60 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Hosted</p>
          <p className="mt-1 text-2xl font-bold text-white">14</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-dark-card/60 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Minutes</p>
          <p className="mt-1 text-2xl font-bold text-white">480 mins</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-dark-card/60 p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">SFU Server Status</p>
          <p className="mt-1 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Operational
          </p>
        </div>
      </div>

      {/* Upcoming Meetings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Upcoming & Live Meetings</h2>
          <Link href="/meetings" className="text-xs text-mivo-400 hover:text-mivo-300">
            View history →
          </Link>
        </div>

        {upcomingMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            <p className="text-xs">No upcoming meetings scheduled.</p>
            <Link
              href="/schedule"
              className="mt-3 inline-block rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
            >
              Schedule Your First Meeting
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-dark-card p-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">{mtg.title}</h3>
                      {mtg.status === 'live' && (
                        <span className="flex items-center space-x-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{mtg.description || 'Mivo Collab Room'}</p>
                    <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {mtg.scheduledStartTime
                          ? format(new Date(mtg.scheduledStartTime), 'MMM dd, yyyy • HH:mm')
                          : 'Instant Session'}
                      </span>
                      <span>•</span>
                      <span>Host: {mtg.hostName}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{mtg.publicMeetingId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink(mtg.publicMeetingId)}
                    className="flex h-9 items-center space-x-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-300 hover:bg-white/10 transition-all"
                    title="Copy Invitation Link"
                  >
                    {copiedId === mtg.publicMeetingId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedId === mtg.publicMeetingId ? 'Copied' : 'Share'}</span>
                  </button>

                  <Link
                    href={`/join/${mtg.publicMeetingId}`}
                    className="flex h-9 items-center space-x-1.5 rounded-xl bg-mivo-600 px-4 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Join Room</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
