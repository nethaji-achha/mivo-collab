'use client';

import React from 'react';
import {
  Video,
  Bot,
  Layout,
  Smartphone,
  ShieldCheck,
  Layers,
  Sparkles,
  Cpu,
  Plus,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { CompanyProduct } from '@mivo/types';

interface ProductSwitcherProps {
  products: CompanyProduct[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  onOpenCreateModal: () => void;
}

// Icon helper mapping
export function getProductIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName) {
    case 'Video':
      return <Video className={className} />;
    case 'Bot':
      return <Bot className={className} />;
    case 'Layout':
      return <Layout className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Cpu':
      return <Cpu className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    default:
      return <Layers className={className} />;
  }
}

export function ProductSwitcher({
  products,
  selectedProductId,
  onSelectProduct,
  onOpenCreateModal,
}: ProductSwitcherProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-mivo-500/20 text-mivo-400 border border-mivo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Company Products & Squads</h3>
            <p className="text-[11px] text-slate-400">
              Each product manages its own dedicated team, conversation feed, and 15-stage lifecycle timeline.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:from-mivo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-mivo-600/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Product</span>
        </button>
      </div>

      {/* Product Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((product) => {
          const isSelected = product.id === selectedProductId;
          const completedCount = product.stages.filter((s) => s.status === 'completed').length;
          const progressPct = Math.round((completedCount / 15) * 100);
          const activeStage = product.stages.find((s) => s.status === 'in-progress') || product.stages[0];

          return (
            <button
              key={product.id}
              onClick={() => onSelectProduct(product.id)}
              className={`group relative flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-mivo-500/80 bg-gradient-to-b from-dark-card via-dark-card to-mivo-950/40 ring-2 ring-mivo-500/40 shadow-xl shadow-mivo-600/15'
                  : 'border-white/10 bg-dark-card/60 hover:bg-dark-card hover:border-white/20'
              }`}
            >
              {/* Top Row: Icon & Status */}
              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${
                    product.colorScheme || 'from-mivo-500 to-cyan-500'
                  } text-white shadow-md`}
                >
                  {getProductIcon(product.iconName, 'w-4 h-4')}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      product.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Name & Tagline */}
              <h4 className="text-sm font-bold text-white group-hover:text-mivo-300 transition-colors truncate w-full">
                {product.name}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{product.tagline}</p>

              {/* Active Stage & Progress */}
              <div className="mt-3 pt-3 border-t border-white/5 w-full space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Active Stage:</span>
                  <span className="font-bold text-mivo-300 flex items-center gap-1 truncate max-w-[130px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-mivo-400 animate-pulse" />
                    #{activeStage.id} {activeStage.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-mivo-500 to-cyan-400 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {progressPct}%
                  </span>
                </div>

                {/* Squads and Members Pill */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>{product.teams?.length || 1} Squads</span>
                  <span>{product.members?.length || 1} Members</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
