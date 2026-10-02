'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Sparkles,
  Shield,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { NotificationItem } from '@mivo/types';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await api.getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
  };

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifs = notifications.filter((n) => (filter === 'all' ? true : !n.read));

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-mivo-600" />
            <span>Notification Center</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time meeting invites, reminders, and organization alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <CheckCheck className="h-4 w-4 text-mivo-600" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-mivo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-mivo-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-slate-500">
            <p className="text-xs font-medium">No notifications to display.</p>
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-slate-50/60 border-slate-200 text-slate-500'
                  : 'bg-white border-mivo-200 shadow-md shadow-mivo-500/5 text-slate-900 ring-1 ring-mivo-500/10'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    n.type === 'meeting_invite'
                      ? 'bg-mivo-50 text-mivo-600 border border-mivo-200'
                      : 'bg-teal-50 text-teal-600 border border-teal-200'
                  }`}
                >
                  {n.type === 'meeting_invite' ? <Calendar className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-mivo-500" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {format(new Date(n.createdAt), 'MMM dd, yyyy • HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {n.data?.meetingId && (
                  <Link
                    href={`/join/${n.data.meetingId}`}
                    className="flex items-center space-x-1 rounded-xl bg-mivo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-sm"
                  >
                    <span>Join</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all"
                    title="Mark read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
