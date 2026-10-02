'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Video,
  Bell,
  Search,
  Plus,
  Calendar,
  LogOut,
  User,
  Shield,
  CreditCard,
  Settings,
  ChevronDown,
  Check,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { NotificationItem } from '@mivo/types';
import { Logo } from './Logo';

export function Header() {
  const { user, logout, primaryOrg } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [quickJoinId, setQuickJoinId] = useState('');

  // Hide header inside active meeting room full-screen view
  const isInsideMeetingRoom = pathname.startsWith('/meetings/') && !pathname.endsWith('/lobby');

  useEffect(() => {
    if (user) {
      api.getNotifications().then((res) => {
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      });
    }
  }, [user]);

  if (isInsideMeetingRoom) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickJoinId.trim()) return;
    const cleanId = quickJoinId.trim().replace(/^https?:\/\/[^/]+\/join\//, '');
    router.push(`/join/${cleanId}`);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-6">
          <Logo href={user ? '/dashboard' : '/'} size="md" />

          {/* Quick Join Input (Logged in or landing) */}
          <form onSubmit={handleQuickJoin} className="hidden md:flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter meeting ID or link..."
              value={quickJoinId}
              onChange={(e) => setQuickJoinId(e.target.value)}
              className="h-9 w-64 rounded-xl bg-slate-100/80 border border-slate-200 pl-9 pr-14 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-mivo-500 focus:outline-none focus:ring-1 focus:ring-mivo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!quickJoinId.trim()}
              className="absolute right-1.5 h-6 px-2 text-[10px] font-semibold text-white bg-mivo-600 hover:bg-mivo-500 disabled:opacity-40 rounded-lg transition-all"
            >
              Join
            </button>
          </form>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            <>
              {/* Quick Actions */}
              <Link
                href="/chat"
                className={`inline-flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  pathname.startsWith('/chat') || pathname.startsWith('/messages')
                    ? 'border-mivo-300 bg-mivo-50 text-mivo-700 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-mivo-600" />
                <span>Team Chat</span>
              </Link>

              <Link
                href="/schedule"
                className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <Calendar className="h-3.5 w-3.5 text-mivo-600" />
                <span>Schedule</span>
              </Link>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    setShowProfileMenu(false);
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-mivo-500 text-[9px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-mivo-600 hover:text-mivo-700 transition-colors font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">No new notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl p-2.5 text-xs transition-colors ${
                              n.read ? 'bg-transparent text-slate-500' : 'bg-mivo-50/70 border border-mivo-100 text-slate-800'
                            }`}
                          >
                            <div className="font-semibold text-slate-900 flex items-center justify-between">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-slate-400">Just now</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                            {n.data?.meetingId && (
                              <Link
                                href={`/join/${n.data.meetingId}`}
                                className="mt-2 inline-block rounded-lg bg-mivo-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-mivo-500 transition-all"
                              >
                                Join Meeting →
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotifs(false)}
                        className="text-[11px] text-mivo-600 hover:text-mivo-700 font-medium transition-colors"
                      >
                        View all notification center →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifs(false);
                  }}
                  className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 hover:bg-slate-50 transition-all"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="h-6 w-6 rounded-lg object-cover border border-slate-200"
                  />
                  <span className="text-xs font-semibold text-slate-800 hidden sm:inline">{user.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      {primaryOrg && (
                        <div className="mt-1.5 inline-flex items-center rounded-lg bg-mivo-50 border border-mivo-200 px-1.5 py-0.5 text-[10px] font-semibold text-mivo-700">
                          {primaryOrg.name} ({primaryOrg.plan.toUpperCase()})
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <Zap className="mr-2 h-3.5 w-3.5 text-mivo-600" />
                        Dashboard
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <MessageSquare className="mr-2 h-3.5 w-3.5 text-mivo-600" />
                        Team & Office Chat
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        Profile Settings
                      </Link>
                      <Link
                        href="/organization/billing"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <CreditCard className="mr-2 h-3.5 w-3.5 text-mivo-600" />
                        Subscription & Billing
                      </Link>
                      <Link
                        href="/admin/audit-logs"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <Shield className="mr-2 h-3.5 w-3.5 text-amber-500" />
                        Security & Audit Logs
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
                        Preferences
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await logout();
                          router.push('/login');
                        }}
                        className="flex w-full items-center px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="mr-2 h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-mivo-600 hover:bg-mivo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 transition-all"
              >
                Start for Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
