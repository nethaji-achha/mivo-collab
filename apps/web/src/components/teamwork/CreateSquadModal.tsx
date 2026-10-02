'use client';

import React, { useState } from 'react';
import { X, Users, Plus, AlertCircle } from 'lucide-react';
import { CreateProductTeamRequest, CompanyProduct } from '@mivo/types';
import { api } from '@/lib/api';

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CompanyProduct;
  onSquadCreated: (updatedProduct: CompanyProduct) => void;
}

const SQUAD_COLORS = [
  { label: 'Cyan / Blue', value: 'from-cyan-500 to-blue-600' },
  { label: 'Emerald / Teal', value: 'from-emerald-500 to-teal-600' },
  { label: 'Violet / Purple', value: 'from-violet-500 to-purple-600' },
  { label: 'Amber / Orange', value: 'from-amber-500 to-orange-600' },
  { label: 'Rose / Pink', value: 'from-rose-500 to-pink-600' },
];

export function CreateSquadModal({
  isOpen,
  onClose,
  product,
  onSquadCreated,
}: CreateSquadModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadRole, setLeadRole] = useState('Tech Lead');
  const [currentSprint, setCurrentSprint] = useState('Sprint 1: Architecture & Prototyping');
  const [color, setColor] = useState('from-cyan-500 to-blue-600');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !leadName.trim()) {
      setError('Squad name and Lead name are required');
      return;
    }

    setIsSubmitting(true);
    const payload: CreateProductTeamRequest = {
      name: name.trim(),
      description: description.trim() || 'Cross-functional engineering and design team pod.',
      leadName: leadName.trim(),
      leadRole: leadRole.trim(),
      currentSprint: currentSprint.trim(),
      color,
    };

    try {
      const res = await api.addProductTeam(product.id, payload);
      if (res.success && res.data) {
        onSquadCreated(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to create squad');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating squad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Product Squad</h3>
              <p className="text-xs text-slate-400">Add a sub-team pod under {product.name}</p>
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Squad Name *</label>
            <input
              type="text"
              placeholder="e.g. Media SFU Squad, Mobile Core Pod, Growth Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              placeholder="Squad focus and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Squad Lead Name *</label>
              <input
                type="text"
                placeholder="e.g. Marcus Brody"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Lead Role</label>
              <input
                type="text"
                placeholder="e.g. Tech Lead"
                value={leadRole}
                onChange={(e) => setLeadRole(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Current Sprint Focus</label>
            <input
              type="text"
              placeholder="e.g. Sprint 24: Adaptive Bitrate & Noise Shield"
              value={currentSprint}
              onChange={(e) => setCurrentSprint(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Squad Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {SQUAD_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setColor(col.value)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all ${
                    color === col.value
                      ? 'border-white/40 ring-1 ring-white/30 bg-dark-bg'
                      : 'border-white/10 bg-dark-bg/60'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${col.value}`} />
                  <span className="text-[10px] text-slate-300 font-semibold truncate">{col.label}</span>
                </button>
              ))}
            </div>
          </div>

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
              {isSubmitting ? 'Creating Squad...' : 'Add Squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
