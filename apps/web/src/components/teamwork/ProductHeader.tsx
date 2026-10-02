'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Video,
  Check,
  Users,
  Calendar,
  Layers,
  Flame,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Plus,
} from 'lucide-react';
import { CompanyProduct } from '@mivo/types';
import { getProductIcon } from './ProductSwitcher';

interface ProductHeaderProps {
  product: CompanyProduct;
  onAdvanceStage: () => void;
  onOpenAddMember: () => void;
  onOpenAddSquad: () => void;
}

export function ProductHeader({
  product,
  onAdvanceStage,
  onOpenAddMember,
  onOpenAddSquad,
}: ProductHeaderProps) {
  const router = useRouter();

  const completedCount = product.stages.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / 15) * 100);
  const activeStage = product.stages.find((s) => s.status === 'in-progress') || product.stages[0];

  const handleLaunchProductMeeting = () => {
    const slug = `${product.id}-${Date.now().toString(36)}`;
    router.push(`/meetings/${slug}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-mivo-500/25 bg-gradient-to-br from-dark-card via-dark-card/95 to-mivo-950/40 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-mivo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className={`p-2 rounded-xl bg-gradient-to-br ${
                product.colorScheme || 'from-mivo-500 to-cyan-500'
              } text-white shadow-md`}
            >
              {getProductIcon(product.iconName, 'w-5 h-5')}
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-mivo-500/20 text-mivo-300 border border-mivo-500/30">
              Product Workspace
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {product.teams?.length || 1} Active Squads • {product.members?.length || 1} Team Members
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {product.name}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-mivo-300">{product.tagline}</p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {product.description}
          </p>

          {product.targetLaunchDate && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Target Launch Milestone: {product.targetLaunchDate}</span>
            </div>
          )}
        </div>

        {/* Right Metrics & Quick Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          {/* Key Metric Panel */}
          <div className="flex items-center gap-4 bg-dark-bg/80 border border-white/10 rounded-2xl p-4 shadow-lg w-full sm:w-auto">
            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Overall Progress
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">{progressPercent}%</span>
                <span className="text-[11px] text-slate-400">({completedCount}/15 Done)</span>
              </div>
            </div>

            <div className="h-9 w-[1px] bg-white/10" />

            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Phase Focus
              </div>
              <div className="text-xs font-bold text-mivo-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-mivo-400 animate-pulse" />
                #{activeStage.id} {activeStage.name}
              </div>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLaunchProductMeeting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:from-mivo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-mivo-600/25 transition-all"
              title="Launch video meeting room for this product squad"
            >
              <Video className="w-4 h-4" />
              <span>Launch Squad Sync</span>
            </button>

            {activeStage && activeStage.id < 15 && (
              <button
                onClick={onAdvanceStage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                title="Advance to next stage gate"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Stage #{activeStage.id}</span>
              </button>
            )}

            <button
              onClick={onOpenAddSquad}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              title="Add new squad to product"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAddMember}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              title="Assign team member to product"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center gap-3">
        <div className="flex-1 h-2 bg-dark-surface rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-mivo-500 to-cyan-400 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-400">
          Stage {activeStage.id} of 15
        </span>
      </div>
    </div>
  );
}
