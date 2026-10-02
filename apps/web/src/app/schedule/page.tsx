'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarPlus,
  Calendar,
  Clock,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { format, addHours } from 'date-fns';

export default function ScheduleMeetingPage() {
  const router = useRouter();

  const tomorrow = new Date(Date.now() + 86400000);
  const defaultDate = format(tomorrow, 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('15:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [participantEmails, setParticipantEmails] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdMeeting, setCreatedMeeting] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a meeting title');
      return;
    }

    const participants = participantEmails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));

    setIsLoading(true);
    try {
      const res = await api.scheduleMeeting({
        title,
        description: description || undefined,
        date,
        startTime,
        endTime,
        recurrence,
        participants,
        waitingRoom,
        muteOnEntry,
        recordingEnabled,
      });

      if (res.success && res.data) {
        setCreatedMeeting(res.data);
      } else {
        setError(res.error?.message || 'Failed to schedule meeting');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdMeeting) return;
    const url = `${window.location.origin}/join/${createdMeeting.publicMeetingId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarPlus className="h-6 w-6 text-mivo-600" />
          <span>Schedule a Meeting</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Create structured online meetings, invite participants, and configure waiting room settings.
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {createdMeeting ? (
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center space-y-4 animate-in fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Meeting Successfully Scheduled!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Your meeting &quot;{createdMeeting.title}&quot; is set for {date} at {startTime}.
          </p>

          {/* Shareable Link Box */}
          <div className="mx-auto max-w-lg rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
            <span className="text-xs font-mono text-mivo-700 truncate px-2 font-semibold">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdMeeting.publicMeetingId}`}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1 rounded-xl bg-mivo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shrink-0 shadow-sm"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              Back to Dashboard
            </Link>
            <Link
              href={`/join/${createdMeeting.publicMeetingId}`}
              className="rounded-xl bg-mivo-600 hover:bg-mivo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-mivo-600/20 transition-all"
            >
              Enter Meeting Lobby →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">General Information</h3>
            <div>
              <label className="text-xs font-semibold text-slate-700">Meeting Topic / Title</label>
              <input
                type="text"
                required
                placeholder="e.g. SFU Sprint Sync & Architecture Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-mivo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Meeting agenda, discussion topics, and preparation notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-mivo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Date & Timing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-mivo-600" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-mivo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-mivo-600" />
                  <span>Start Time</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-mivo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-mivo-600" />
                  <span>End Time</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-mivo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Recurrence</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-mivo-500 focus:outline-none"
              >
                <option value="none">One-time meeting (No recurrence)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Invites & Permissions */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Participants & Permissions</h3>
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-mivo-600" />
                <span>Invite Participants by Email (comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="sarah@hyperdevs.io, liam@hyperdevs.io"
                value={participantEmails}
                onChange={(e) => setParticipantEmails(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-mivo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Waiting Room (Lobby)</p>
                  <p className="text-[11px] text-slate-500">Participants require host approval to enter.</p>
                </div>
                <input
                  type="checkbox"
                  checked={waitingRoom}
                  onChange={(e) => setWaitingRoom(e.target.checked)}
                  className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Mute Participants on Entry</p>
                  <p className="text-[11px] text-slate-500">Microphones will automatically be muted when joining.</p>
                </div>
                <input
                  type="checkbox"
                  checked={muteOnEntry}
                  onChange={(e) => setMuteOnEntry(e.target.checked)}
                  className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-800">AI Real-time Transcription</p>
                  <p className="text-[11px] text-slate-500">Generate automated transcript and action items summary.</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-xl bg-mivo-600 hover:bg-mivo-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-mivo-600/20 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Scheduling...' : 'Schedule Meeting'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
