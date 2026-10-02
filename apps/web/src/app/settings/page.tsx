'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Mic, Video, Bell, Shield, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [defaultMicMuted, setDefaultMicMuted] = useState(false);
  const [defaultCamMuted, setDefaultCamMuted] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setDefaultMicMuted(user.preferences.defaultMicMuted ?? false);
      setDefaultCamMuted(user.preferences.defaultCamMuted ?? false);
      setNoiseSuppression(user.preferences.noiseSuppression ?? true);
      setEchoCancellation(user.preferences.echoCancellation ?? true);
      setHdVideo(user.preferences.hdVideo ?? true);
      setEmailNotifications(user.preferences.emailNotifications ?? true);
    }
  }, [user]);

  const handleSave = async () => {
    const res = await api.updateProfile({
      preferences: {
        defaultMicMuted,
        defaultCamMuted,
        noiseSuppression,
        echoCancellation,
        hdVideo,
        emailNotifications,
      },
    });

    if (res.success) {
      await refreshUser();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-mivo-400" />
          <span>Application Preferences</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Configure default media settings, noise reduction filters, and security behaviors.
        </p>
      </div>

      {isSaved && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Audio/Video Defaults */}
        <div className="rounded-3xl border border-white/10 bg-dark-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mic className="h-4 w-4 text-mivo-400" />
            <span>Audio & Video Defaults</span>
          </h3>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Join with Microphone Muted</p>
                <p className="text-[11px] text-slate-400">Always mute your microphone when entering any meeting.</p>
              </div>
              <input
                type="checkbox"
                checked={defaultMicMuted}
                onChange={(e) => setDefaultMicMuted(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Join with Camera Disabled</p>
                <p className="text-[11px] text-slate-400">Always start with video feed turned off.</p>
              </div>
              <input
                type="checkbox"
                checked={defaultCamMuted}
                onChange={(e) => setDefaultCamMuted(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">AI Background Noise Suppression</p>
                <p className="text-[11px] text-slate-400">Filter out keyboard clicks, fan hum, and ambient office noise.</p>
              </div>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Acoustic Echo Cancellation (AEC)</p>
                <p className="text-[11px] text-slate-400">Prevent audio feedback when using laptop speakers.</p>
              </div>
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Full HD Video (1080p / 60 FPS)</p>
                <p className="text-[11px] text-slate-400">Send high resolution video streams when network bandwidth allows.</p>
              </div>
              <input
                type="checkbox"
                checked={hdVideo}
                onChange={(e) => setHdVideo(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl border border-white/10 bg-dark-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-400" />
            <span>Email & System Alerts</span>
          </h3>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-white">Meeting Invitation Emails</p>
                <p className="text-[11px] text-slate-400">Receive calendar invites with direct join links.</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 rounded-xl bg-mivo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
          >
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
