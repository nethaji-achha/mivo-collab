'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Layers,
  Video,
  Bot,
  Layout,
  Smartphone,
  ShieldCheck,
  Cpu,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { CreateProductRequest, CompanyProduct } from '@mivo/types';
import { api } from '@/lib/api';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: CompanyProduct) => void;
}

const ICONS = [
  { name: 'Video', icon: Video, label: 'Video & Media' },
  { name: 'Bot', icon: Bot, label: 'AI Copilot' },
  { name: 'Layout', icon: Layout, label: 'Canvas / Whiteboard' },
  { name: 'Smartphone', icon: Smartphone, label: 'Mobile App' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Security' },
  { name: 'Cpu', icon: Cpu, label: 'Platform / API' },
  { name: 'Layers', icon: Layers, label: 'Product Suite' },
  { name: 'Sparkles', icon: Sparkles, label: 'Innovation' },
];

const COLORS = [
  { label: 'Cyan / Blue', value: 'from-cyan-500 to-blue-600' },
  { label: 'Violet / Purple', value: 'from-violet-500 to-purple-600' },
  { label: 'Emerald / Teal', value: 'from-emerald-500 to-teal-600' },
  { label: 'Amber / Orange', value: 'from-amber-500 to-orange-600' },
  { label: 'Rose / Pink', value: 'from-rose-500 to-pink-600' },
  { label: 'Indigo / Violet', value: 'from-indigo-600 to-violet-600' },
];

export function CreateProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: CreateProductModalProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Layers');
  const [selectedColor, setSelectedColor] = useState('from-cyan-500 to-blue-600');
  const [targetLaunchDate, setTargetLaunchDate] = useState('');
  const [initialSquadName, setInitialSquadName] = useState('Core Squad');
  const [initialLeadName, setInitialLeadName] = useState('Alex Rivera');
  const [initialLeadRole, setInitialLeadRole] = useState('Product Lead');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a product name');
      return;
    }

    setIsSubmitting(true);

    const payload: CreateProductRequest = {
      name: name.trim(),
      tagline: tagline.trim() || 'Next-generation collaboration feature',
      description: description.trim() || 'Comprehensive product development initiative.',
      iconName: selectedIcon,
      colorScheme: selectedColor,
      targetLaunchDate: targetLaunchDate || undefined,
      initialTeams: [
        {
          name: initialSquadName.trim() || 'Core Squad',
          description: 'Primary cross-functional engineering and design team.',
          leadName: initialLeadName.trim() || 'Alex Rivera',
          leadRole: initialLeadRole.trim() || 'Product Lead',
          color: selectedColor,
        },
      ],
    };

    try {
      const res = await api.createProduct(payload);
      if (res.success && res.data) {
        onProductCreated(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-dark-card p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Company Product</h3>
              <p className="text-xs text-slate-400">
                Setup a new product workspace with its own dedicated team and 15-stage lifecycle.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Mivo AI Studio, Spatial Canvas, Analytics Cloud"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
              required
            />
          </div>

          {/* Tagline */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tagline / Mission</label>
            <input
              type="text"
              placeholder="e.g. Intelligent real-time transcription and semantic action items"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the product objectives, target audience, and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Product Icon</label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'border-mivo-500 bg-mivo-500/20 text-mivo-300 ring-1 ring-mivo-500/40'
                        : 'border-white/10 bg-dark-bg text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="text-[10px] font-semibold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Scheme Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Theme Gradient</label>
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setSelectedColor(col.value)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedColor === col.value
                      ? 'border-white/40 ring-1 ring-white/30 bg-dark-bg'
                      : 'border-white/10 bg-dark-bg/60'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${col.value}`} />
                  <span className="text-[11px] text-slate-300 font-semibold">{col.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Launch Date & Initial Squad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Launch Date</label>
              <input
                type="date"
                value={targetLaunchDate}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Initial Squad Name</label>
              <input
                type="text"
                value={initialSquadName}
                onChange={(e) => setInitialSquadName(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating Product...' : 'Initialize Product Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
