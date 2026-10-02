'use client';

import React, { useState, useEffect } from 'react';
import { X, Mic, Video, Volume2, Sparkles, Sliders, Check } from 'lucide-react';
import { MediaDeviceInfoList } from '@/lib/webrtc/webrtc-manager';
import { AudioVisualizer } from './AudioVisualizer';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MediaDeviceInfoList;
  selectedAudioInput?: string;
  selectedVideoInput?: string;
  selectedAudioOutput?: string;
  onSelectAudioInput: (deviceId: string) => void;
  onSelectVideoInput: (deviceId: string) => void;
  onSelectAudioOutput: (deviceId: string) => void;
  micLevel?: number;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  devices,
  selectedAudioInput,
  selectedVideoInput,
  selectedAudioOutput,
  onSelectAudioInput,
  onSelectVideoInput,
  onSelectAudioOutput,
  micLevel = 0,
}: DeviceSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'general'>('audio');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-dark-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center space-x-2.5">
            <Sliders className="h-5 w-5 text-mivo-400" />
            <h3 className="text-base font-bold text-white">Audio & Video Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-dark-bg/40 px-6">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-2 border-b-2 py-3 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'audio'
                ? 'border-mivo-500 text-mivo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 border-b-2 py-3 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'video'
                ? 'border-mivo-500 text-mivo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Video</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 border-b-2 py-3 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'general'
                ? 'border-mivo-500 text-mivo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Enhancements</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'audio' && (
            <>
              {/* Microphone Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Microphone Input</label>
                <select
                  value={selectedAudioInput}
                  onChange={(e) => onSelectAudioInput(e.target.value)}
                  className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                >
                  {devices.audioInputs.length === 0 ? (
                    <option value="">Default System Microphone</option>
                  ) : (
                    devices.audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone (${d.deviceId.substring(0, 5)})`}
                      </option>
                    ))
                  )}
                </select>
                <div className="flex items-center space-x-3 pt-1">
                  <span className="text-[11px] text-slate-400">Mic Level:</span>
                  <div className="flex-1 bg-dark-bg h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-75"
                      style={{ width: `${Math.min(100, micLevel)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Output */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Speaker / Headphones</label>
                <select
                  value={selectedAudioOutput}
                  onChange={(e) => onSelectAudioOutput(e.target.value)}
                  className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                >
                  {devices.audioOutputs.length === 0 ? (
                    <option value="">Default System Speakers</option>
                  ) : (
                    devices.audioOutputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Speaker (${d.deviceId.substring(0, 5)})`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Advanced Audio Toggles */}
              <div className="pt-2 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">AI Background Noise Suppression</span>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Acoustic Echo Cancellation</span>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                    className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                  />
                </label>
              </div>
            </>
          )}

          {activeTab === 'video' && (
            <>
              {/* Camera Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Camera Device</label>
                <select
                  value={selectedVideoInput}
                  onChange={(e) => onSelectVideoInput(e.target.value)}
                  className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                >
                  {devices.videoInputs.length === 0 ? (
                    <option value="">Integrated WebCam</option>
                  ) : (
                    devices.videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera (${d.deviceId.substring(0, 5)})`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Video Toggles */}
              <div className="pt-2 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Enable High Definition (1080p HD)</span>
                  <input
                    type="checkbox"
                    checked={hdVideo}
                    onChange={(e) => setHdVideo(e.target.checked)}
                    className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Mirror My Video Preview</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded text-mivo-600 focus:ring-mivo-500"
                  />
                </label>
              </div>
            </>
          )}

          {activeTab === 'general' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="rounded-xl border border-mivo-500/20 bg-mivo-500/10 p-4">
                <p className="font-semibold text-mivo-300">Mivo AI Meeting Intelligence</p>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                  Real-time speech-to-text, speaker attribution, automated summaries, and action items capture are enabled.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-dark-bg/60 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 rounded-xl bg-mivo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
          >
            <Check className="h-4 w-4" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
