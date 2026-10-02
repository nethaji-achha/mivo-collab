'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  Users,
  Compass,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  MessageSquare,
  Clock,
  Flame,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { CompanyProduct } from '@mivo/types';
import { ProductSwitcher } from '@/components/teamwork/ProductSwitcher';
import { ProductHeader } from '@/components/teamwork/ProductHeader';
import { ProductTimelineBar } from '@/components/teamwork/ProductTimelineBar';
import { ProductTeamChat } from '@/components/teamwork/ProductTeamChat';
import { ProductTeamsRoster } from '@/components/teamwork/ProductTeamsRoster';
import { CreateProductModal } from '@/components/teamwork/CreateProductModal';
import { CreateSquadModal } from '@/components/teamwork/CreateSquadModal';
import { AddMemberModal } from '@/components/teamwork/AddMemberModal';

export default function TeamworkStagesPage() {
  const { primaryOrg, user } = useAuth();
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat' | 'teams' | 'phases'>('timeline');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, [primaryOrg?.id]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProducts(primaryOrg?.id);
      if (res.success && res.data && res.data.length > 0) {
        setProducts(res.data);
        if (!selectedProductId || !res.data.some((p) => p.id === selectedProductId)) {
          setSelectedProductId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Stage Advancement Handler
  const handleAdvanceStage = async () => {
    if (!currentProduct) return;
    try {
      const res = await api.advanceProductStage(currentProduct.id);
      if (res.success && res.data) {
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? res.data! : p)));
        setCelebrationMessage(
          `🏆 Level Complete! ${currentProduct.name} has advanced to Stage #${res.data.currentStageId}.`
        );
        setTimeout(() => setCelebrationMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to advance stage:', err);
    }
  };

  // Task Toggle Handler
  const handleToggleTask = async (
    stageId: number,
    section: 'workDone' | 'workNext',
    taskId: string
  ) => {
    if (!currentProduct) return;
    try {
      const res = await api.toggleProductTask(currentProduct.id, stageId, section, taskId);
      if (res.success && res.data) {
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? res.data! : p)));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Add Task Handler
  const handleAddTask = async (
    stageId: number,
    section: 'workDone' | 'workNext',
    text: string
  ) => {
    if (!currentProduct) return;
    try {
      const res = await api.addProductTask(
        currentProduct.id,
        stageId,
        section,
        text,
        user?.name || 'Team Member'
      );
      if (res.success && res.data) {
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? res.data! : p)));
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (
    stageId: number,
    section: 'workDone' | 'workNext',
    taskId: string
  ) => {
    if (!currentProduct) return;
    try {
      const res = await api.deleteProductTask(currentProduct.id, stageId, taskId, section);
      if (res.success && res.data) {
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? res.data! : p)));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Product Created Callback
  const handleProductCreated = (newProd: CompanyProduct) => {
    setProducts((prev) => [newProd, ...prev]);
    setSelectedProductId(newProd.id);
    setActiveTab('timeline');
    setCelebrationMessage(`🎉 Product "${newProd.name}" initialized with 15-stage pipeline!`);
    setTimeout(() => setCelebrationMessage(null), 5000);
  };

  // Squad / Member Added Callback
  const handleProductUpdated = (updatedProd: CompanyProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-mivo-500/20 text-mivo-400 border border-mivo-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Compass className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs text-slate-400 font-semibold">Loading product workspaces & squads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-mivo-500/20 text-mivo-300 border border-mivo-500/30">
              {primaryOrg ? `${primaryOrg.name} Organization` : 'Teamwork Hub'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-mivo-400" />
            Product Lifecycle & Teamwork Hub
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Multi-product management: manage dedicated squads, real-time team conversations, and independent 15-stage horizontal timelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setIsCreateProductOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Celebration Notification */}
      {celebrationMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <p className="text-xs sm:text-sm font-bold">{celebrationMessage}</p>
          </div>
          <button
            onClick={() => setCelebrationMessage(null)}
            className="text-xs font-semibold px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Multi-Product Switcher Cards */}
      <ProductSwitcher
        products={products}
        selectedProductId={currentProduct ? currentProduct.id : ''}
        onSelectProduct={(id) => setSelectedProductId(id)}
        onOpenCreateModal={() => setIsCreateProductOpen(true)}
      />

      {currentProduct && (
        <>
          {/* 2. Active Product Hero Header Card */}
          <ProductHeader
            product={currentProduct}
            onAdvanceStage={handleAdvanceStage}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenAddSquad={() => setIsCreateSquadOpen(true)}
          />

          {/* 3. Product Workspace Navigation Tabs */}
          <div className="flex items-center border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                activeTab === 'timeline'
                  ? 'border-mivo-500 text-mivo-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>15-Stage Lifecycle Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                activeTab === 'chat'
                  ? 'border-mivo-500 text-mivo-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Squad Conversation Feed</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-mivo-500/20 text-mivo-300 font-mono">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                activeTab === 'teams'
                  ? 'border-mivo-500 text-mivo-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Squads & Members ({currentProduct.members?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('phases')}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                activeTab === 'phases'
                  ? 'border-mivo-500 text-mivo-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>4 Macro-Phases Overview</span>
            </button>
          </div>

          {/* 4. Tab Views */}
          {activeTab === 'timeline' && (
            <ProductTimelineBar
              stages={currentProduct.stages}
              currentStageId={currentProduct.currentStageId}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onAdvanceStage={handleAdvanceStage}
            />
          )}

          {activeTab === 'chat' && (
            <ProductTeamChat
              product={currentProduct}
              currentUser={{
                id: user?.id || 'usr_guest',
                name: user?.name || 'Alex Rivera',
                avatarUrl: user?.avatarUrl,
                role: user?.role,
              }}
            />
          )}

          {activeTab === 'teams' && (
            <ProductTeamsRoster
              product={currentProduct}
              onOpenAddSquad={() => setIsCreateSquadOpen(true)}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
            />
          )}

          {activeTab === 'phases' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-mivo-400" />
                The 4 Macro-Phases of Delivery for {currentProduct.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Phase 1 */}
                <div
                  className={`rounded-2xl border p-5 space-y-2.5 ${
                    currentProduct.currentStageId > 4
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : currentProduct.currentStageId <= 4
                      ? 'border-mivo-500/50 bg-mivo-950/30 ring-1 ring-mivo-500/40'
                      : 'border-white/5 bg-dark-card/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 font-mono">PHASE 1</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      {currentProduct.currentStageId > 4 ? '100% Done' : 'In Progress'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Discovery & Validation</h4>
                  <p className="text-xs text-slate-400">
                    Stages 1 - 4: Problem definition, user research, solution ideation, and smoke validation tests.
                  </p>
                </div>

                {/* Phase 2 */}
                <div
                  className={`rounded-2xl border p-5 space-y-2.5 ${
                    currentProduct.currentStageId > 8
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : currentProduct.currentStageId >= 5 && currentProduct.currentStageId <= 8
                      ? 'border-mivo-500/50 bg-mivo-950/30 ring-1 ring-mivo-500/40'
                      : 'border-white/5 bg-dark-card/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-mivo-400 font-mono">PHASE 2</span>
                    <span className="text-[10px] bg-mivo-500/20 text-mivo-300 px-2 py-0.5 rounded-full font-bold">
                      {currentProduct.currentStageId > 8
                        ? '100% Done'
                        : currentProduct.currentStageId >= 5
                        ? 'Active Sprint'
                        : 'Next Phase'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Strategy & System Design</h4>
                  <p className="text-xs text-slate-300">
                    Stages 5 - 8: PRD scope, monetization unit economics, technical architecture, and UI/UX design tokens.
                  </p>
                </div>

                {/* Phase 3 */}
                <div
                  className={`rounded-2xl border p-5 space-y-2.5 ${
                    currentProduct.currentStageId > 12
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : currentProduct.currentStageId >= 9 && currentProduct.currentStageId <= 12
                      ? 'border-mivo-500/50 bg-mivo-950/30 ring-1 ring-mivo-500/40'
                      : 'border-amber-500/20 bg-amber-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 font-mono">PHASE 3</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {currentProduct.currentStageId > 12
                        ? '100% Done'
                        : currentProduct.currentStageId >= 9
                        ? 'Active Engineering'
                        : 'Upcoming'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Build & Release</h4>
                  <p className="text-xs text-slate-400">
                    Stages 9 - 12: MVP engineering pod, QA testing automation, closed beta cohort, and production failover.
                  </p>
                </div>

                {/* Phase 4 */}
                <div className="rounded-2xl border border-white/5 bg-dark-card/40 p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 font-mono">PHASE 4</span>
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                      {currentProduct.currentStageId >= 13 ? 'Active GTM' : 'Future Horizon'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Scale & Continuous Flywheel</h4>
                  <p className="text-xs text-slate-400">
                    Stages 13 - 15: Public launch campaigns, viral growth loops, and ongoing iterative sprint enhancements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onProductCreated={handleProductCreated}
      />

      {currentProduct && (
        <>
          <CreateSquadModal
            isOpen={isCreateSquadOpen}
            onClose={() => setIsCreateSquadOpen(false)}
            product={currentProduct}
            onSquadCreated={handleProductUpdated}
          />

          <AddMemberModal
            isOpen={isAddMemberOpen}
            onClose={() => setIsAddMemberOpen(false)}
            product={currentProduct}
            onMemberAdded={handleProductUpdated}
          />
        </>
      )}
    </div>
  );
}
