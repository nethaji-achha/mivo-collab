'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  ChevronRight,
  Sparkles,
  Users,
  Target,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Flame,
  CheckSquare,
  Square,
  Filter,
  Check,
  RotateCcw,
  Compass,
  ArrowUpRight,
  Zap
} from 'lucide-react';

export type StageStatus = 'completed' | 'in-progress' | 'next-up' | 'locked';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
}

export interface LifecycleStage {
  id: number;
  name: string;
  category: 'Discovery' | 'Strategy' | 'Execution' | 'Scale';
  status: StageStatus;
  lead: string;
  leadRole: string;
  avatarColor: string;
  description: string;
  workDone: TaskItem[];
  workNext: TaskItem[];
  exitCriteria: string;
  estimatedDuration: string;
  resourceLinks?: { title: string; url: string; type: 'doc' | 'design' | 'code' | 'metric' }[];
}

const INITIAL_STAGES: LifecycleStage[] = [
  {
    id: 1,
    name: 'Problem',
    category: 'Discovery',
    status: 'completed',
    lead: 'Alex Vance',
    leadRole: 'Product Lead',
    avatarColor: 'bg-rose-500',
    description: 'Pinpoint precise customer friction points, target personas, and validate the core urgency before building.',
    workDone: [
      { id: '1-1', text: 'Identified core remote collaboration and meeting disconnect friction', completed: true },
      { id: '1-2', text: 'Conducted 15 direct interviews with engineering team leads', completed: true },
      { id: '1-3', text: 'Formalized root-cause problem statement with executive sponsor', completed: true },
    ],
    workNext: [
      { id: '1-4', text: 'Synthesize findings into competitor benchmarking matrix', completed: true },
    ],
    exitCriteria: 'Root-cause validation signed off by leadership',
    estimatedDuration: '1-2 Weeks',
    resourceLinks: [
      { title: 'Problem Discovery Doc v1.0', url: '#', type: 'doc' },
    ],
  },
  {
    id: 2,
    name: 'Research',
    category: 'Discovery',
    status: 'completed',
    lead: 'Sarah Chen',
    leadRole: 'UX Researcher',
    avatarColor: 'bg-amber-500',
    description: 'Deep dive into competitor landscapes, user psychographics, market TAM/SAM, and technical feasibility.',
    workDone: [
      { id: '2-1', text: 'Transcribed and analyzed 30+ potential user recordings', completed: true },
      { id: '2-2', text: 'Benchmarked top 4 industry competitors on feature parity & pricing', completed: true },
      { id: '2-3', text: 'Calculated initial TAM/SAM/SOM market opportunity matrix', completed: true },
    ],
    workNext: [
      { id: '2-4', text: 'Draft ideation problem briefs for team design sprint', completed: true },
    ],
    exitCriteria: 'Research synthesis deck approved by stakeholders',
    estimatedDuration: '2 Weeks',
    resourceLinks: [
      { title: 'User Research & Insights Deck', url: '#', type: 'doc' },
      { title: 'Market Sizing Model', url: '#', type: 'metric' },
    ],
  },
  {
    id: 3,
    name: 'Ideation',
    category: 'Discovery',
    status: 'completed',
    lead: 'David Kim',
    leadRole: 'Lead Designer',
    avatarColor: 'bg-emerald-500',
    description: 'Brainstorm solution hypotheses, cross-functional whiteboarding, and feature prioritization workshops.',
    workDone: [
      { id: '3-1', text: 'Hosted 3-day Miro design sprint with PM, Design & Tech', completed: true },
      { id: '3-2', text: 'Generated 25+ solution hypotheses and user journey sketches', completed: true },
      { id: '3-3', text: 'Applied Value vs Effort prioritization matrix to prune backlog', completed: true },
    ],
    workNext: [
      { id: '3-4', text: 'Package top 2 solution candidates for rapid prototype validation', completed: true },
    ],
    exitCriteria: 'Top 2 solution concepts selected for smoke testing',
    estimatedDuration: '1 Week',
    resourceLinks: [
      { title: 'Miro Design Sprint Board', url: '#', type: 'design' },
    ],
  },
  {
    id: 4,
    name: 'Validation',
    category: 'Discovery',
    status: 'completed',
    lead: 'Maya Patel',
    leadRole: 'Growth PM',
    avatarColor: 'bg-cyan-500',
    description: 'Test hypotheses with low-fidelity prototypes, smoke testing landing pages, and customer willingness to pay.',
    workDone: [
      { id: '4-1', text: 'Launched smoke-test landing page measuring conversion (42% signups)', completed: true },
      { id: '4-2', text: 'Secured 450+ early-access waitlist pre-registrations', completed: true },
      { id: '4-3', text: 'Verified core willingness-to-pay intent with 10 B2B buyers', completed: true },
    ],
    workNext: [
      { id: '4-4', text: 'Formalize PRD scope based on validated customer demands', completed: true },
    ],
    exitCriteria: '>40% positive validation benchmark achieved',
    estimatedDuration: '1-2 Weeks',
    resourceLinks: [
      { title: 'Smoke Test Analytics Report', url: '#', type: 'metric' },
    ],
  },
  {
    id: 5,
    name: 'PRD',
    category: 'Strategy',
    status: 'completed',
    lead: 'Alex Vance',
    leadRole: 'Product Manager',
    avatarColor: 'bg-indigo-500',
    description: 'Comprehensive Product Requirements Document defining functional scope, constraints, and success metrics.',
    workDone: [
      { id: '5-1', text: 'Drafted functional specifications for WebRTC, chat & permissions', completed: true },
      { id: '5-2', text: 'Defined non-functional requirements: <100ms latency, 99.9% uptime', completed: true },
      { id: '5-3', text: 'Created metric scorecard with primary KPIs and north star metrics', completed: true },
    ],
    workNext: [
      { id: '5-4', text: 'Conduct business model & monetization pricing review', completed: true },
    ],
    exitCriteria: 'PRD signed off by Tech Lead and Lead Designer',
    estimatedDuration: '2 Weeks',
    resourceLinks: [
      { title: 'Master PRD Specification v1.2', url: '#', type: 'doc' },
    ],
  },
  {
    id: 6,
    name: 'Business Model',
    category: 'Strategy',
    status: 'completed',
    lead: 'Elena Rostova',
    leadRole: 'Finance & Strategy',
    avatarColor: 'bg-purple-500',
    description: 'Unit economics, pricing tiers (Free, Pro, Enterprise), cloud infrastructure cost modeling, and CAC/LTV.',
    workDone: [
      { id: '6-1', text: 'Calculated SFU media server bandwidth & cloud hosting unit costs', completed: true },
      { id: '6-2', text: 'Structured 3-tier subscription pricing model (Free / Pro $15 / Enterprise)', completed: true },
      { id: '6-3', text: 'Built financial breakeven model based on target team seats', completed: true },
    ],
    workNext: [
      { id: '6-4', text: 'Hand off requirements for technical system architecture', completed: true },
    ],
    exitCriteria: 'Monetization strategy and gross margin model approved',
    estimatedDuration: '1 Week',
    resourceLinks: [
      { title: 'Financial Model & Cloud Unit Costs', url: '#', type: 'metric' },
    ],
  },
  {
    id: 7,
    name: 'Architecture',
    category: 'Strategy',
    status: 'completed',
    lead: 'Marcus Brody',
    leadRole: 'Chief Architect',
    avatarColor: 'bg-blue-500',
    description: 'System design, database schemas, real-time WebRTC media mesh, Redis caching, and microservice APIs.',
    workDone: [
      { id: '7-1', text: 'Engineered monorepo architecture with TurboRepo + Next.js + Fastify', completed: true },
      { id: '7-2', text: 'Modeled PostgreSQL database schema & relational indexing', completed: true },
      { id: '7-3', text: 'Specified WebRTC SFU signaling protocol & Redis pub/sub channels', completed: true },
    ],
    workNext: [
      { id: '7-4', text: 'Guide UX/UI design team on responsive component tokens', completed: true },
    ],
    exitCriteria: 'System Architecture Design Document (ADD) signed off',
    estimatedDuration: '2 Weeks',
    resourceLinks: [
      { title: 'Architecture System Diagram & Schema', url: '#', type: 'code' },
    ],
  },
  {
    id: 8,
    name: 'UX/UI',
    category: 'Strategy',
    status: 'in-progress',
    lead: 'David Kim',
    leadRole: 'Lead UI/UX Designer',
    avatarColor: 'bg-emerald-500',
    description: 'High-fidelity design system, interactive prototypes, micro-animations, and responsive device layouts.',
    workDone: [
      { id: '8-1', text: 'Engineered dark-mode design system with curated HSL color tokens', completed: true },
      { id: '8-2', text: 'Designed interactive meeting control bar, chat panel & lobby', completed: true },
      { id: '8-3', text: 'Completed organization management, billing & members UI pages', completed: true },
    ],
    workNext: [
      { id: '8-4', text: 'Finalize mobile responsive breakpoints and touch gesture flows', completed: false },
      { id: '8-5', text: 'Run prototype usability test with 5 external pilot teams', completed: false },
      { id: '8-6', text: 'Export complete Figma design tokens for Frontend engineers', completed: false },
    ],
    exitCriteria: 'Usability test score > 85/100 and design token export complete',
    estimatedDuration: '2-3 Weeks',
    resourceLinks: [
      { title: 'Figma High-Fidelity Prototype', url: '#', type: 'design' },
      { title: 'Design System Token Guidelines', url: '#', type: 'design' },
    ],
  },
  {
    id: 9,
    name: 'MVP',
    category: 'Execution',
    status: 'next-up',
    lead: 'Full-Stack Team',
    leadRole: 'Engineering Pod',
    avatarColor: 'bg-violet-500',
    description: 'Coding core capabilities: real-time audio/video streaming, persistent team chat, auth, and organization workspace.',
    workDone: [
      { id: '9-1', text: 'Scaffolded TurboRepo monorepo workspace & Tailwind design bridge', completed: true },
      { id: '9-2', text: 'Setup Prisma/Postgres database migrations and Auth tokens', completed: true },
    ],
    workNext: [
      { id: '9-3', text: 'Connect real-time Socket.IO chat backend & room channels', completed: false },
      { id: '9-4', text: 'Integrate WebRTC multi-peer video mesh with screen sharing', completed: false },
      { id: '9-5', text: 'Implement Organization billing Stripe integration endpoints', completed: false },
    ],
    exitCriteria: 'Full user session functional end-to-end without crashes',
    estimatedDuration: '3-4 Weeks',
    resourceLinks: [
      { title: 'GitHub Repository & Sprint Backlog', url: '#', type: 'code' },
    ],
  },
  {
    id: 10,
    name: 'Testing',
    category: 'Execution',
    status: 'locked',
    lead: 'QA & Security',
    leadRole: 'Quality Assurance',
    avatarColor: 'bg-teal-500',
    description: 'Unit testing, E2E browser automation (Playwright), stress & load testing, and penetration security audit.',
    workDone: [],
    workNext: [
      { id: '10-1', text: 'Write automated Playwright E2E tests for meeting lifecycle', completed: false },
      { id: '10-2', text: 'Execute load testing simulating 1,000 concurrent media streams', completed: false },
      { id: '10-3', text: 'Conduct penetration test & vulnerability scan on Auth routes', completed: false },
    ],
    exitCriteria: 'Zero P0/P1 bugs in staging and >80% test code coverage',
    estimatedDuration: '2 Weeks',
    resourceLinks: [
      { title: 'QA Test Matrix & Automation Suite', url: '#', type: 'code' },
    ],
  },
  {
    id: 11,
    name: 'Beta',
    category: 'Execution',
    status: 'locked',
    lead: 'Product & Community',
    leadRole: 'Release Manager',
    avatarColor: 'bg-pink-500',
    description: 'Closed pilot launch with 100 early-adopter teams. Real-time telemetry, crash reports, and user feedback triage.',
    workDone: [],
    workNext: [
      { id: '11-1', text: 'Onboard 100 pilot teams into private staging cohort', completed: false },
      { id: '11-2', text: 'Setup telemetry dashboard tracking audio latency & drop-offs', completed: false },
      { id: '11-3', text: 'Weekly feedback triage meetings with core pilot users', completed: false },
    ],
    exitCriteria: 'Beta NPS > 50 and verified 99.9% audio/video session stability',
    estimatedDuration: '3 Weeks',
    resourceLinks: [],
  },
  {
    id: 12,
    name: 'Production',
    category: 'Execution',
    status: 'locked',
    lead: 'DevOps & SRE',
    leadRole: 'Site Reliability',
    avatarColor: 'bg-indigo-600',
    description: 'Deploy multi-region production cluster, automatic SSL, CDN edge caching, Datadog observability & failover.',
    workDone: [],
    workNext: [
      { id: '12-1', text: 'Deploy production Kubernetes cluster across US-East and EU-Central', completed: false },
      { id: '12-2', text: 'Configure Sentry APM error logging with PagerDuty alerts', completed: false },
      { id: '12-3', text: 'Execute failover and automated disaster recovery drills', completed: false },
    ],
    exitCriteria: 'Production security checklist verified & 99.99% uptime ready',
    estimatedDuration: '1-2 Weeks',
    resourceLinks: [],
  },
  {
    id: 13,
    name: 'Launch',
    category: 'Scale',
    status: 'locked',
    lead: 'Marketing & PR',
    leadRole: 'Go-To-Market Lead',
    avatarColor: 'bg-orange-500',
    description: 'Public release campaign: Product Hunt, tech press, demo video walkthroughs, and onboarding drip sequences.',
    workDone: [],
    workNext: [
      { id: '13-1', text: 'Launch on Product Hunt, HackerNews and tech communities', completed: false },
      { id: '13-2', text: 'Send announcement campaign to 10k+ pre-registered waitlist', completed: false },
      { id: '13-3', text: 'Activate live chat customer support and knowledge base', completed: false },
    ],
    exitCriteria: '1,000+ active organizations onboarded in Week 1',
    estimatedDuration: '1 Week',
    resourceLinks: [],
  },
  {
    id: 14,
    name: 'Growth',
    category: 'Scale',
    status: 'locked',
    lead: 'Growth PM',
    leadRole: 'Growth & Monetization',
    avatarColor: 'bg-lime-500',
    description: 'Conversion funnel optimization, referral loops, team viral invites, and paid acquisition channel testing.',
    workDone: [],
    workNext: [
      { id: '14-1', text: 'Optimize signup-to-first-meeting conversion funnel', completed: false },
      { id: '14-2', text: 'Implement in-meeting "Invite Teammates" viral loops', completed: false },
      { id: '14-3', text: 'Analyze cohort retention curves and drop-off points', completed: false },
    ],
    exitCriteria: 'Achieve >15% Month-over-Month organic user growth',
    estimatedDuration: 'Ongoing',
    resourceLinks: [],
  },
  {
    id: 15,
    name: 'Continuous Improvement',
    category: 'Scale',
    status: 'locked',
    lead: 'All Teams',
    leadRole: 'Core Team',
    avatarColor: 'bg-sky-500',
    description: 'Continuous integration, bi-weekly sprint retrospectives, community feature requests, and performance tuning.',
    workDone: [],
    workNext: [
      { id: '15-1', text: 'Weekly customer feedback review and backlog grooming', completed: false },
      { id: '15-2', text: 'Bi-weekly release cycles with automated zero-downtime deploys', completed: false },
      { id: '15-3', text: 'Refactor performance bottlenecks identified in APM traces', completed: false },
    ],
    exitCriteria: 'Continuous deployment pipeline with sub-15 minute rollback capability',
    estimatedDuration: 'Ongoing',
    resourceLinks: [],
  },
];

export function ProductLifecyclePipeline() {
  const [stages, setStages] = useState<LifecycleStage[]>(INITIAL_STAGES);
  const [selectedStageId, setSelectedStageId] = useState<number>(8); // default to current active stage: UX/UI
  const [filterCategory, setFilterCategory] = useState<'All' | 'Discovery' | 'Strategy' | 'Execution' | 'Scale'>('All');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [taskSectionTarget, setTaskSectionTarget] = useState<'workDone' | 'workNext'>('workNext');
  const [showCelebration, setShowCelebration] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];
  const completedStagesCount = stages.filter((s) => s.status === 'completed').length;
  const inProgressStage = stages.find((s) => s.status === 'in-progress');
  const overallProgressPercent = Math.round((completedStagesCount / stages.length) * 100);

  // Auto-scroll selected button into view
  useEffect(() => {
    const el = document.getElementById(`stage-btn-${selectedStageId}`);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedStageId]);

  // Navigate to step
  const handleSelectStage = (id: number) => {
    setSelectedStageId(id);
  };

  const handlePrevStep = () => {
    if (selectedStageId > 1) {
      setSelectedStageId(selectedStageId - 1);
    }
  };

  const handleNextStep = () => {
    if (selectedStageId < stages.length) {
      setSelectedStageId(selectedStageId + 1);
    }
  };

  // Toggle task completion
  const handleToggleTask = (stageId: number, section: 'workDone' | 'workNext', taskId: string) => {
    setStages((prevStages) =>
      prevStages.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          [section]: stage[section].map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  // Add task to current stage
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    const newTask: TaskItem = {
      id: `${selectedStageId}-${Date.now()}`,
      text: newTaskInput.trim(),
      completed: taskSectionTarget === 'workDone',
    };

    setStages((prev) =>
      prev.map((s) => {
        if (s.id !== selectedStageId) return s;
        return {
          ...s,
          [taskSectionTarget]: [...s[taskSectionTarget], newTask],
        };
      })
    );

    setNewTaskInput('');
  };

  // Delete task
  const handleDeleteTask = (stageId: number, section: 'workDone' | 'workNext', taskId: string) => {
    setStages((prev) =>
      prev.map((s) => {
        if (s.id !== stageId) return s;
        return {
          ...s,
          [section]: s[section].filter((t: TaskItem) => t.id !== taskId),
        };
      })
    );
  };

  // Promote / Advance stage
  const handleAdvanceStage = () => {
    const currentActiveIdx = stages.findIndex((s) => s.status === 'in-progress');
    if (currentActiveIdx === -1 || currentActiveIdx === stages.length - 1) return;

    setStages((prev) => {
      const updated = [...prev];
      // Mark current as completed
      updated[currentActiveIdx] = {
        ...updated[currentActiveIdx],
        status: 'completed',
      };
      // Mark next as in-progress
      const nextIdx = currentActiveIdx + 1;
      updated[nextIdx] = {
        ...updated[nextIdx],
        status: 'in-progress',
      };
      // Mark next+1 as next-up if exists
      if (nextIdx + 1 < updated.length) {
        updated[nextIdx + 1] = {
          ...updated[nextIdx + 1],
          status: 'next-up',
        };
      }
      return updated;
    });

    setSelectedStageId(currentActiveIdx + 2);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4000);
  };

  // Filtered list
  const filteredStages = stages.filter(
    (s) => filterCategory === 'All' || s.category === filterCategory
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Progress Metric */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-mivo-50/50 p-6 sm:p-7 shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mivo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-mivo-50 text-mivo-700 border border-mivo-200">
                <Sparkles className="w-3.5 h-3.5 text-mivo-600" />
                Team Lifecycle Pipeline
              </span>
              <span className="text-xs text-slate-500">
                15 Sequential Levels • Problem to Continuous Improvement
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Work Completed & Next Horizons
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Real-time transparency on what has been accomplished till now and what needs to be tackled next. Click any stage in the bar below to drill into tasks and handoffs.
            </p>
          </div>

          {/* Key Metrics Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Overall Progress
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {overallProgressPercent}%
                </span>
                <span className="text-xs text-slate-400">
                  ({completedStagesCount}/15 Done)
                </span>
              </div>
            </div>

            <div className="hidden sm:block h-10 w-[1px] bg-white/10" />

            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Active Phase
              </div>
              <div className="text-sm font-bold text-mivo-300 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-mivo-400 animate-pulse" />
                {inProgressStage ? inProgressStage.name : 'Completed'} (Stage #{inProgressStage?.id})
              </div>
            </div>

            {inProgressStage && (
              <button
                onClick={handleAdvanceStage}
                className="ml-auto sm:ml-2 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:from-mivo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-mivo-600/25 transition-all active:scale-95"
                title="Promote stage to completed and unlock next level"
              >
                <Check className="w-4 h-4" />
                <span>Complete Phase</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-dark-surface rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-mivo-500 to-cyan-400 rounded-full transition-all duration-700 shadow-md shadow-mivo-500/20"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            Stage {selectedStage.id} of 15
          </span>
        </div>
      </div>

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
          {inProgressStage && (
            <button
              onClick={() => setSelectedStageId(inProgressStage.id)}
              className="flex items-center gap-1.5 text-xs text-mivo-400 hover:text-mivo-300 bg-mivo-500/10 border border-mivo-500/20 px-3 py-1.5 rounded-xl font-semibold transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-mivo-400" />
              Jump to Active ({inProgressStage.name})
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

      {/* Celebration Notification Toast */}
      {showCelebration && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-extrabold">Phase Promoted Successfully! 🎉</p>
              <p className="text-xs text-emerald-100">
                Stage advanced. The next stage is now unlocked and ready for execution.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="text-xs font-semibold px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

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
                    id={`stage-btn-${stage.id}`}
                    onClick={() => handleSelectStage(stage.id)}
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

                    {/* Mini Task Counter Indicator */}
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

      {/* SELECTED STAGE WORKSPACE DRILL-DOWN */}
      <div className="rounded-3xl border border-white/10 bg-dark-card p-6 sm:p-8 shadow-2xl space-y-7">
        {/* Stage Header Info Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mivo-600 to-teal-900 border border-mivo-500/30 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-mivo-600/30 shrink-0">
              #{selectedStage.id}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-2xl font-black text-white">{selectedStage.name} Stage</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white/10 text-slate-200 border border-white/10">
                  {selectedStage.category} Phase
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    selectedStage.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : selectedStage.status === 'in-progress'
                      ? 'bg-mivo-500/20 text-mivo-300 border-mivo-500/30'
                      : selectedStage.status === 'next-up'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Status: {selectedStage.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {selectedStage.description}
              </p>
            </div>
          </div>

          {/* Lead & Stage Gate Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 bg-dark-bg/60 border border-white/10 p-3.5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl ${selectedStage.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-md`}
              >
                {selectedStage.lead.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{selectedStage.lead}</div>
                <div className="text-[10px] text-slate-400">{selectedStage.leadRole}</div>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-mivo-400" /> Stage Exit Gate:
              </div>
              <div className="text-xs font-semibold text-slate-200 max-w-xs truncate">
                {selectedStage.exitCriteria}
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN TASK & DELIVERABLE SHOWCASE: WORK DONE vs WORK TO BE DONE NEXT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN 1: WORK DONE TILL NOW */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Work Done Till Now
                  </h4>
                  <p className="text-[11px] text-emerald-300">
                    Completed milestones, verified deliverables & outputs
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedStage.workDone.filter((t) => t.completed).length} /{' '}
                {selectedStage.workDone.length} Done
              </span>
            </div>

            {selectedStage.workDone.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No items recorded as completed yet for this upcoming stage.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedStage.workDone.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(selectedStage.id, 'workDone', task.id)}
                    className="group flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-bg/60 border border-emerald-500/20 hover:border-emerald-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        className="mt-0.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span
                        className={`text-xs ${
                          task.completed
                            ? 'text-slate-200 line-through text-slate-400'
                            : 'text-slate-200 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(selectedStage.id, 'workDone', task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: WORK TO BE DONE NEXT */}
          <div className="rounded-2xl border border-mivo-500/30 bg-mivo-950/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-mivo-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-mivo-500/20 text-mivo-400">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Work To Be Done Next
                  </h4>
                  <p className="text-[11px] text-mivo-300">
                    Immediate sprint objectives, upcoming handoffs & blockers
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-mivo-500/20 text-mivo-300 border border-mivo-500/30">
                {selectedStage.workNext.filter((t) => !t.completed).length} Pending
              </span>
            </div>

            {selectedStage.workNext.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                All next action items have been marked complete for this stage!
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedStage.workNext.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(selectedStage.id, 'workNext', task.id)}
                    className="group flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-bg/60 border border-mivo-500/20 hover:border-mivo-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        className="mt-0.5 text-mivo-400 hover:text-mivo-300 transition-colors"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span
                        className={`text-xs ${
                          task.completed
                            ? 'text-slate-400 line-through'
                            : 'text-slate-100 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(selectedStage.id, 'workNext', task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ADD TASK FORM */}
        <div className="rounded-2xl border border-white/5 bg-dark-bg/40 p-4">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-400">Add to:</span>
              <select
                value={taskSectionTarget}
                onChange={(e) => setTaskSectionTarget(e.target.value as any)}
                className="bg-dark-card border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-mivo-500"
              >
                <option value="workNext">Work To Do Next</option>
                <option value="workDone">Work Done Till Now</option>
              </select>
            </div>

            <input
              type="text"
              placeholder={`Add new task or milestone to Stage #${selectedStage.id} (${selectedStage.name})...`}
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              className="flex-1 w-full bg-dark-card border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
            />

            <button
              type="submit"
              disabled={!newTaskInput.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-mivo-600 hover:bg-mivo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </form>
        </div>

        {/* ATTACHED ARTIFACTS & RESOURCE LINKS */}
        {selectedStage.resourceLinks && selectedStage.resourceLinks.length > 0 && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-mivo-400" />
                Stage Artifacts & Deliverables
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {selectedStage.resourceLinks.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-dark-bg/60 hover:bg-white/5 text-xs font-medium text-slate-200 transition-all hover:border-mivo-500/50"
                >
                  <span className="w-2 h-2 rounded-full bg-mivo-400" />
                  <span>{res.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
