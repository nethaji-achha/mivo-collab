'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Globe, Shield, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || '');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.updateProfile({
        name,
        avatarUrl: avatarUrl || null,
        timezone,
      });

      if (res.success) {
        await refreshUser();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        setError(res.error?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-mivo-400" />
          <span>Profile & Account</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage your personal identity, avatar, and account preferences.
        </p>
      </div>

      {isSaved && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-dark-card p-6 sm:p-8 space-y-6">
          {/* Avatar Header */}
          <div className="flex items-center space-x-4">
            <img
              src={
                avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Alex')}`
              }
              alt="Avatar"
              className="h-20 w-20 rounded-2xl object-cover border-2 border-white/10"
            />
            <div>
              <h3 className="text-base font-bold text-white">{name || 'User'}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="mt-1.5 inline-block rounded bg-mivo-600/20 text-mivo-300 border border-mivo-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1 w-full rounded-xl bg-dark-bg/50 border border-white/5 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Avatar Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-xl bg-mivo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-mivo-500 disabled:opacity-50 transition-all shadow-lg shadow-mivo-600/20"
            >
              <span>{isLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
