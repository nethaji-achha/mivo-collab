'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Video,
  Clock,
  Calendar,
  Sparkles,
  FileText,
  Search,
  Filter,
  Play,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Meeting } from '@mivo/types';
import { format } from 'date-fns';

export default function MeetingsHistoryPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'live' | 'ended' | 'scheduled'>('all');
  const [selectedMeetingForAI, setSelectedMeetingForAI] = useState<Meeting | null>(null);

  useEffect(() => {
    api.getMeetings().then((res) => {
      if (res.success && res.data) {
        setMeetings(res.data);
      }
    });
  }, []);

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.publicMeetingId.toLowerCase().includes(search.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && m.status === filterType;
  });

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-mivo-600" />
            <span>Meeting History & Recordings</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Review past calls, inspect attendee engagement, and read AI meeting summaries.
          </p>
        </div>

        <Link
          href="/schedule"
          className="inline-flex items-center space-x-1.5 rounded-xl bg-mivo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-md shadow-mivo-600/20"
        >
          <Calendar className="h-4 w-4" />
          <span>Schedule New</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search meetings by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-mivo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {(['all', 'live', 'scheduled', 'ended'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                filterType === type
                  ? 'bg-mivo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {filteredMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-slate-500">
            <p className="text-xs font-medium">No meetings matched your query.</p>
          </div>
        ) : (
          filteredMeetings.map((mtg) => (
            <div
              key={mtg.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-mivo-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mivo-50 text-mivo-600 border border-mivo-200">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">{mtg.title}</h3>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                        mtg.status === 'live'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : mtg.status === 'scheduled'
                          ? 'bg-teal-50 text-teal-600 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {mtg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {mtg.description || 'Standard collaboration session'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {mtg.actualStartTime
                        ? format(new Date(mtg.actualStartTime), 'MMM dd, yyyy • HH:mm')
                        : mtg.scheduledStartTime
                        ? format(new Date(mtg.scheduledStartTime), 'MMM dd, yyyy • HH:mm')
                        : 'Instant'}
                    </span>
                    <span>•</span>
                    <span>Duration: {mtg.durationSeconds ? `${Math.floor(mtg.durationSeconds / 60)} mins` : 'Active / Pending'}</span>
                    <span>•</span>
                    <span>Host: {mtg.hostName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{mtg.publicMeetingId}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setSelectedMeetingForAI(mtg)}
                  className="flex items-center space-x-1.5 rounded-xl border border-mivo-200 bg-mivo-50 px-3 py-2 text-xs font-semibold text-mivo-700 hover:bg-mivo-100 transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-mivo-600" />
                  <span>AI Summary</span>
                </button>

                {mtg.status !== 'ended' ? (
                  <Link
                    href={`/join/${mtg.publicMeetingId}`}
                    className="flex items-center space-x-1.5 rounded-xl bg-mivo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Join Room</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-medium text-slate-400"
                  >
                    Ended
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Summary Modal */}
      {selectedMeetingForAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mivo-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Meeting Intelligence</h3>
                  <p className="text-[11px] text-slate-500">{selectedMeetingForAI.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeetingForAI(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            {/* AI Summary Content */}
            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <p className="font-semibold text-white uppercase tracking-wider text-[10px] text-mivo-400">
                  Key Takeaways
                </p>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-slate-300 leading-relaxed">
                  <li>Reviewed selective forwarding unit (SFU) performance and verified sub-50ms audio latency.</li>
                  <li>Finalized responsive video tile grid layout supporting mobile and multi-participant screens.</li>
                  <li>Confirmed DTLS-SRTP security compliance and server-side authorization models.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white uppercase tracking-wider text-[10px] text-cyan-400">
                  Action Items
                </p>
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-start space-x-2 bg-dark-bg p-2.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Sarah Chen: Deploy Coturn relay fallback cluster</p>
                      <p className="text-[10px] text-slate-400">Target: Sprint 26</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 bg-dark-bg p-2.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-white">Alex Rivera: Verify WebRTC getDisplayMedia tab sharing</p>
                      <p className="text-[10px] text-slate-400">Target: Tomorrow</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMeetingForAI(null)}
                className="rounded-xl bg-mivo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
