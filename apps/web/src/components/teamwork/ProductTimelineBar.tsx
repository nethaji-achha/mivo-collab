'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  Filter,
  Flame,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  FileText,
  ExternalLink,
  Target,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { ProductLifecycleStage, ProductLifecycleTask } from '@mivo/types';

interface ProductTimelineBarProps {
  stages: ProductLifecycleStage[];
  currentStageId: number;
  onToggleTask: (stageId: number, section: 'workDone' | 'workNext', taskId: string) => void;
  onAddTask: (stageId: number, section: 'workDone' | 'workNext', text: string) => void;
  onDeleteTask: (stageId: number, section: 'workDone' | 'workNext', taskId: string) => void;
  onAdvanceStage: () => void;
}

export function ProductTimelineBar({
  stages,
  currentStageId,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onAdvanceStage,
}: ProductTimelineBarProps) {
  const [selectedStageId, setSelectedStageId] = useState<number>(currentStageId || 1);
  const [filterCategory, setFilterCategory] = useState<'All' | 'Discovery' | 'Strategy' | 'Execution' | 'Scale'>('All');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [taskSectionTarget, setTaskSectionTarget] = useState<'workDone' | 'workNext'>('workNext');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync selected stage with current active stage on product switch
  useEffect(() => {
    setSelectedStageId(currentStageId || 1);
  }, [currentStageId]);

  // Auto-scroll selected button into view
  useEffect(() => {
    const el = document.getElementById(`prod-stage-btn-${selectedStageId}`);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedStageId]);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];
  const activeStage = stages.find((s) => s.status === 'in-progress');

  const handlePrevStep = () => {
    if (selectedStageId > 1) setSelectedStageId(selectedStageId - 1);
  };

  const handleNextStep = () => {
    if (selectedStageId < stages.length) setSelectedStageId(selectedStageId + 1);
  };

  const handleFormAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    onAddTask(selectedStageId, taskSectionTarget, newTaskInput.trim());
    setNewTaskInput('');
  };

  const filteredStages = stages.filter(
    (s) => filterCategory === 'All' || s.category === filterCategory
  );

  return (
    <div className="w-full space-y-5">
      {/* Filter Category Pills & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(['All', 'Discovery', 'Strategy', 'Execution', 'Scale'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterCategory === cat
                  ? 'bg-mivo-600 text-white shadow-md shadow-mivo-600/30'
                  : 'bg-dark-card/60 text-slate-400 hover:text-white hover:bg-dark-card border border-white/5'
              }`}
            >
              {cat}
              {cat === 'All'
                ? ' (15)'
                : cat === 'Discovery'
                ? ' (1-4)'
                : cat === 'Strategy'
                ? ' (5-8)'
                : cat === 'Execution'
                ? ' (9-12)'
                : ' (13-15)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeStage && (
            <button
              onClick={() => setSelectedStageId(activeStage.id)}
              className="flex items-center gap-1.5 text-xs text-mivo-400 hover:text-mivo-300 bg-mivo-500/10 border border-mivo-500/20 px-3 py-1.5 rounded-xl font-semibold transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-mivo-400" />
              Jump to Active ({activeStage.name})
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevStep}
              disabled={selectedStageId === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-dark-card text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextStep}
              disabled={selectedStageId === stages.length}
              className="p-1.5 rounded-lg border border-white/10 bg-dark-card text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next Step"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL INTERACTIVE STEPPER BAR */}
      <div className="relative rounded-2xl border border-white/10 bg-dark-card/80 p-4 shadow-xl">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-mivo-600/40 scrollbar-track-dark-bg"
        >
          <div className="flex items-center gap-2 min-w-max py-1 px-1">
            {filteredStages.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;
              const isCompleted = stage.status === 'completed';
              const isInProgress = stage.status === 'in-progress';
              const isNextUp = stage.status === 'next-up';
              const isLocked = stage.status === 'locked';

              return (
                <React.Fragment key={stage.id}>
                  <button
                    id={`prod-stage-btn-${stage.id}`}
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`group relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all w-44 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-mivo-500 bg-gradient-to-b from-mivo-950/80 to-dark-card ring-2 ring-mivo-500/40 shadow-xl shadow-mivo-600/20 scale-[1.02]'
                        : isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/15 hover:border-emerald-500/60 hover:bg-emerald-950/30'
                        : isInProgress
                        ? 'border-mivo-400/50 bg-mivo-950/30 hover:border-mivo-400 hover:bg-mivo-950/50 ring-1 ring-mivo-400/30'
                        : isNextUp
                        ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400/80 hover:bg-amber-950/40'
                        : 'border-white/5 bg-dark-bg/60 opacity-65 hover:opacity-100 hover:border-white/20'
                    }`}
                  >
                    {/* Top Level & Status Badge */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-mivo-500 text-white'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isInProgress
                            ? 'bg-mivo-500/20 text-mivo-300'
                            : isNextUp
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        STEP {stage.id.toString().padStart(2, '0')}
                      </span>

                      {/* Status Icon */}
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isInProgress && (
                        <span className="relative flex h-3 w-3 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mivo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-mivo-500"></span>
                        </span>
                      )}
                      {isNextUp && (
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                      )}
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>

                    {/* Stage Name */}
                    <div className="text-sm font-bold text-white tracking-tight truncate w-full group-hover:text-mivo-300 transition-colors">
                      {stage.name}
                    </div>

                    {/* Category & Status Description */}
                    <div className="mt-1 flex items-center justify-between w-full text-[11px]">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">
                        {stage.category}
                      </span>
                      <span
                        className={`font-semibold capitalize text-[10px] ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isInProgress
                            ? 'text-mivo-300'
                            : isNextUp
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCompleted
                          ? 'Completed'
                          : isInProgress
                          ? 'In Progress'
                          : isNextUp
                          ? 'Next Up'
                          : 'Upcoming'}
                      </span>
                    </div>

                    {/* Mini Task Counter */}
                    <div className="mt-2.5 w-full pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {stage.workDone.filter((t) => t.completed).length}/
                        {stage.workDone.length + stage.workNext.length} Tasks
                      </span>
                      <span className="text-[10px] text-slate-500">{stage.estimatedDuration}</span>
                    </div>
                  </button>

                  {/* Connector Arrow */}
                  {idx < filteredStages.length - 1 && (
                    <div className="flex items-center px-0.5">
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isCompleted ? 'text-emerald-500/60' : 'text-slate-700'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAILED STAGE DRILL-DOWN CARD (Work Done vs Work Next) */}
      <div className="rounded-3xl border border-white/10 bg-dark-card/90 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Stage Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-mivo-600/30 text-mivo-300 border border-mivo-500/30">
                LEVEL #{selectedStage.id.toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase">
                {selectedStage.category} Phase
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  selectedStage.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : selectedStage.status === 'in-progress'
                    ? 'bg-mivo-500/20 text-mivo-300 border border-mivo-500/30'
                    : selectedStage.status === 'next-up'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {selectedStage.status.replace('-', ' ')}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">{selectedStage.name}</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">{selectedStage.description}</p>
          </div>

          {/* Lead & Duration Badges */}
          <div className="flex items-center gap-3 bg-dark-bg/60 border border-white/10 rounded-2xl p-3 shrink-0">
            <div
              className={`w-9 h-9 rounded-xl ${selectedStage.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow`}
            >
              {selectedStage.lead.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{selectedStage.lead}</div>
              <div className="text-[10px] text-slate-400">{selectedStage.leadRole}</div>
            </div>
            <div className="h-7 w-[1px] bg-white/10 mx-1" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Duration</div>
              <div className="text-xs font-bold text-slate-200">{selectedStage.estimatedDuration}</div>
            </div>
          </div>
        </div>

        {/* 2 Interactive Columns: Work Done vs Work to do Next */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Work Accomplished */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Work Accomplished Till Now</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                {selectedStage.workDone.filter((t) => t.completed).length}/{selectedStage.workDone.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {selectedStage.workDone.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 text-center">No tasks recorded yet in this section.</p>
              ) : (
                selectedStage.workDone.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-bg/70 border border-white/5 hover:border-emerald-500/30 transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTask(selectedStage.id, 'workDone', task.id)}
                      className="mt-0.5 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-snug">{task.text}</p>
                      {task.assigneeName && (
                        <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
                          👤 {task.assigneeName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(selectedStage.id, 'workDone', task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Work to do Next */}
          <div className="rounded-2xl border border-mivo-500/30 bg-mivo-950/15 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-mivo-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white">Work to do Next (Horizons)</h4>
              </div>
              <span className="text-xs font-mono font-bold text-mivo-300 bg-mivo-500/15 px-2 py-0.5 rounded-full">
                {selectedStage.workNext.filter((t) => !t.completed).length} Pending
              </span>
            </div>

            <div className="space-y-2">
              {selectedStage.workNext.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 text-center">All deliverables clear for next stage gate.</p>
              ) : (
                selectedStage.workNext.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-bg/70 border border-white/5 hover:border-mivo-500/40 transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTask(selectedStage.id, 'workNext', task.id)}
                      className={`mt-0.5 transition-colors shrink-0 ${
                        task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                      ) : (
                        <div className="w-4 h-4 rounded-md border border-slate-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium leading-snug ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </p>
                      {task.assigneeName && (
                        <span className="text-[10px] text-slate-400 font-semibold mt-1 inline-block">
                          👤 {task.assigneeName}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(selectedStage.id, 'workNext', task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Task / Deliverable Inline Form */}
        <form
          onSubmit={handleFormAddTask}
          className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-2xl bg-dark-bg/80 border border-white/10"
        >
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTaskSectionTarget('workNext')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                taskSectionTarget === 'workNext'
                  ? 'bg-mivo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              + Next Work Item
            </button>
            <button
              type="button"
              onClick={() => setTaskSectionTarget('workDone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                taskSectionTarget === 'workDone'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              + Accomplished Task
            </button>
          </div>

          <input
            type="text"
            placeholder={`Add deliverable to Stage #${selectedStage.id} (${selectedStage.name})...`}
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            className="flex-1 w-full bg-transparent border-none px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!newTaskInput.trim()}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white disabled:opacity-40 transition-all shrink-0"
          >
            Add Task
          </button>
        </form>

        {/* Exit Criteria & Resource Links Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-bg/50 border border-white/5 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-mivo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300">Phase Exit Criteria Gate:</span>
              <p className="text-slate-400 mt-0.5">{selectedStage.exitCriteria}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-bg/50 border border-white/5 space-y-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> Linked Artifacts & Resources
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedStage.resourceLinks && selectedStage.resourceLinks.length > 0 ? (
                selectedStage.resourceLinks.map((res, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg hover:underline cursor-pointer"
                  >
                    <span>{res.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500 italic">No external resource links attached yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
