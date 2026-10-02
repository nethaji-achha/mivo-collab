'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { AddProductMemberRequest, CompanyProduct, ProductRole } from '@mivo/types';
import { api } from '@/lib/api';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CompanyProduct;
  onMemberAdded: (updatedProduct: CompanyProduct) => void;
}

const ROLES: { value: ProductRole; label: string }[] = [
  { value: 'product_lead', label: 'Product Lead / VP' },
  { value: 'tech_lead', label: 'Tech Lead / Architect' },
  { value: 'designer', label: 'Lead Product Designer' },
  { value: 'engineer', label: 'Senior Software Engineer' },
  { value: 'devops_lead', label: 'DevOps & SRE Specialist' },
  { value: 'qa_specialist', label: 'QA & Security Engineer' },
  { value: 'growth_pm', label: 'Growth & GTM Manager' },
];

export function AddMemberModal({
  isOpen,
  onClose,
  product,
  onMemberAdded,
}: AddMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProductRole>('engineer');
  const [title, setTitle] = useState('');
  const [assignedTeamId, setAssignedTeamId] = useState<string>(
    product.teams && product.teams[0] ? product.teams[0].id : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    const payload: AddProductMemberRequest = {
      name: name.trim(),
      email: email.trim(),
      role,
      title: title.trim() || 'Core Contributor',
      assignedTeamId: assignedTeamId || undefined,
    };

    try {
      const res = await api.addProductMember(product.id, payload);
      if (res.success && res.data) {
        onMemberAdded(res.data);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to add member');
      }
    } catch (err: any) {
      setError(err.message || 'Error adding member');
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Member to {product.name}</h3>
              <p className="text-xs text-slate-400">Add colleague to product workspace and squads</p>
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
            <label className="text-xs font-semibold text-slate-300">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Liam Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. liam@hyperdevs.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Product Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ProductRole)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Dev"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              />
            </div>
          </div>

          {product.teams && product.teams.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Assign to Squad</label>
              <select
                value={assignedTeamId}
                onChange={(e) => setAssignedTeamId(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-mivo-500"
              >
                <option value="">General Product Team</option>
                {product.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isSubmitting ? 'Assigning Member...' : 'Add to Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
