'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Play,
  StopCircle,
  RotateCcw,
  BarChart3,
  Eye,
  EyeOff,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Radio,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  Poll,
  PollOption,
  PollResponse,
  PollResult,
  CreatePollRequest,
  SubmitPollResponseRequest,
} from '@mivo/types';
import { api } from '@/lib/api';
import { getSignalingSocket } from '@/lib/socket';

interface PollsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  isHost: boolean;
  peerId: string;
  displayName: string;
  participantCount: number;
}

export function PollsPanel({
  isOpen,
  onClose,
  meetingId,
  isHost,
  peerId,
  displayName,
  participantCount,
}: PollsPanelProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, PollResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'create' | 'history'>('active');

  // Create Poll Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowResponseChange, setAllowResponseChange] = useState(true);
  const [showResultsToParticipants, setShowResultsToParticipants] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Participant Voting State (pollId -> selectedOptionIds[])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [submittingVote, setSubmittingVote] = useState<Record<string, boolean>>({});
  const [voteSuccess, setVoteSuccess] = useState<Record<string, boolean>>({});
  const [voteError, setVoteError] = useState<Record<string, string>>({});

  // Host Expanded Participant View (pollId -> boolean)
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({});

  // Load Polls on Open
  useEffect(() => {
    if (isOpen && meetingId) {
      loadPolls();
    }
  }, [isOpen, meetingId, isHost, peerId]);

  // Real-time Socket Event Listeners
  useEffect(() => {
    const socket = getSignalingSocket();

    const handlePollCreated = (data: { poll: Poll }) => {
      setPolls((prev) => {
        const exists = prev.some((p) => p.id === data.poll.id);
        if (exists) {
          return prev.map((p) => (p.id === data.poll.id ? data.poll : p));
        }
        return [data.poll, ...prev];
      });
    };

    const handlePollStarted = (data: { poll: Poll }) => {
      setPolls((prev) => {
        const exists = prev.some((p) => p.id === data.poll.id);
        if (exists) {
          return prev.map((p) => (p.id === data.poll.id ? { ...p, ...data.poll, status: 'active' } : p));
        }
        return [{ ...data.poll, status: 'active' }, ...prev];
      });
      loadPollResults(data.poll.id);
    };

    const handleResponseReceived = (data: { pollId: string; results: PollResult }) => {
      setPollResults((prev) => ({
        ...prev,
        [data.pollId]: data.results,
      }));
      setPolls((prev) =>
        prev.map((p) =>
          p.id === data.pollId ? { ...p, totalResponses: data.results.totalResponses } : p
        )
      );
    };

    const handlePollClosed = (data: { pollId: string; results?: PollResult }) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === data.pollId ? { ...p, status: 'closed' } : p))
      );
      if (data.results) {
        setPollResults((prev) => ({
          ...prev,
          [data.pollId]: data.results!,
        }));
      }
    };

    const handlePollReopened = (data: { poll: Poll }) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === data.poll.id ? { ...p, ...data.poll, status: 'active', closedAt: null } : p))
      );
      loadPollResults(data.poll.id);
    };

    const handlePollDeleted = (data: { pollId: string }) => {
      setPolls((prev) => prev.filter((p) => p.id !== data.pollId));
      setPollResults((prev) => {
        const copy = { ...prev };
        delete copy[data.pollId];
        return copy;
      });
    };

    const handleVisibilityChanged = (data: {
      pollId: string;
      showResultsToParticipants: boolean;
      results?: PollResult;
    }) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === data.pollId
            ? { ...p, showResultsToParticipants: data.showResultsToParticipants }
            : p
        )
      );
      if (data.results) {
        setPollResults((prev) => ({
          ...prev,
          [data.pollId]: data.results!,
        }));
      }
    };

    socket.on('poll:created', handlePollCreated);
    socket.on('poll:started', handlePollStarted);
    socket.on('poll:response-received', handleResponseReceived);
    socket.on('poll:closed', handlePollClosed);
    socket.on('poll:reopened', handlePollReopened);
    socket.on('poll:deleted', handlePollDeleted);
    socket.on('poll:results-visibility-changed', handleVisibilityChanged);

    return () => {
      socket.off('poll:created', handlePollCreated);
      socket.off('poll:started', handlePollStarted);
      socket.off('poll:response-received', handleResponseReceived);
      socket.off('poll:closed', handlePollClosed);
      socket.off('poll:reopened', handlePollReopened);
      socket.off('poll:deleted', handlePollDeleted);
      socket.off('poll:results-visibility-changed', handleVisibilityChanged);
    };
  }, [isHost, meetingId]);

  const loadPolls = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMeetingPolls(meetingId, isHost, peerId, displayName);
      if (res.success && res.data) {
        setPolls(res.data);
        // Pre-populate user selections
        const initialSelections: Record<string, string[]> = {};
        res.data.forEach((p) => {
          if (p.userSelectedOptionIds && p.userSelectedOptionIds.length > 0) {
            initialSelections[p.id] = p.userSelectedOptionIds;
          }
          // Fetch results for active polls and host view
          if (isHost || (p.showResultsToParticipants && (p.status === 'active' || p.status === 'closed'))) {
            loadPollResults(p.id);
          }
        });
        setSelectedOptions((prev) => ({ ...initialSelections, ...prev }));
      }
    } catch (err) {
      console.error('Failed to load polls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPollResults = async (pollId: string) => {
    try {
      const res = await api.getPollResults(meetingId, pollId, isHost);
      if (res.success && res.data) {
        setPollResults((prev) => ({
          ...prev,
          [pollId]: res.data!,
        }));
      }
    } catch (err) {
      // Results might be hidden for participants
    }
  };

  // Option Form Handlers
  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  // Host: Create Poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!cleanQuestion) {
      setCreateError('Please enter a poll question');
      return;
    }

    if (cleanOptions.length < 2) {
      setCreateError('Please provide at least 2 non-empty answer options');
      return;
    }

    setCreateSubmitting(true);
    const payload: CreatePollRequest = {
      question: cleanQuestion,
      options: cleanOptions,
      pollType,
      isAnonymous,
      allowResponseChange,
      showResultsToParticipants,
    };

    try {
      const res = await api.createPoll(meetingId, payload, isHost);
      if (res.success && res.data) {
        const newPoll = res.data;
        setPolls((prev) => [newPoll, ...prev.filter((p) => p.id !== newPoll.id)]);

        // Broadcast via Socket with the actual created Poll object
        const socket = getSignalingSocket();
        socket.emit('poll:create', { meetingId, poll: newPoll });

        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setPollType('single');
        setIsAnonymous(false);
        setAllowResponseChange(true);
        setShowResultsToParticipants(true);
        setIsCreating(false);
        setActiveTab('active');
      } else {
        setCreateError(res.error?.message || 'Failed to create poll');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating poll');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Host: Start Poll
  const handleStartPoll = async (pollId: string) => {
    const existing = polls.find((p) => p.id === pollId);
    const optimisticActive: Poll | undefined = existing
      ? { ...existing, status: 'active', startedAt: new Date().toISOString() }
      : undefined;

    if (optimisticActive) {
      setPolls((prev) =>
        prev.map((p) => (p.id === pollId ? optimisticActive : p))
      );
    }

    try {
      const res = await api.startPoll(meetingId, pollId, isHost, existing);
      const activePoll = (res.success && res.data) ? res.data : optimisticActive;
      if (activePoll) {
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, ...activePoll, status: 'active' } : p))
        );
        const socket = getSignalingSocket();
        socket.emit('poll:start', { meetingId, pollId, poll: activePoll });
        loadPollResults(pollId);
      }
    } catch (err) {
      console.error('Failed to start poll via API, starting via socket:', err);
      if (optimisticActive) {
        const socket = getSignalingSocket();
        socket.emit('poll:start', { meetingId, pollId, poll: optimisticActive });
        loadPollResults(pollId);
      }
    }
  };

  // Host: Close Poll
  const handleClosePoll = async (pollId: string) => {
    try {
      const res = await api.closePoll(meetingId, pollId, isHost);
      if (res.success && res.data) {
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, status: 'closed', closedAt: new Date().toISOString() } : p))
        );
        if (res.data && res.data.results) {
          const results = res.data.results;
          setPollResults((prev) => ({ ...prev, [pollId]: results }));
        }
        const socket = getSignalingSocket();
        socket.emit('poll:close', { meetingId, pollId });
      }
    } catch (err) {
      console.error('Failed to close poll:', err);
    }
  };

  // Host: Reopen Poll
  const handleReopenPoll = async (pollId: string) => {
    try {
      const res = await api.reopenPoll(meetingId, pollId, isHost);
      if (res.success && res.data) {
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, status: 'active', closedAt: null } : p))
        );
        const socket = getSignalingSocket();
        socket.emit('poll:reopen', { meetingId, pollId });
      }
    } catch (err) {
      console.error('Failed to reopen poll:', err);
    }
  };

  // Host: Delete Poll
  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    try {
      const res = await api.deletePoll(meetingId, pollId, isHost);
      if (res.success) {
        setPolls((prev) => prev.filter((p) => p.id !== pollId));
        const socket = getSignalingSocket();
        socket.emit('poll:delete', { meetingId, pollId });
      }
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  // Host: Toggle Visibility
  const handleToggleVisibility = async (pollId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      const res = await api.togglePollResultsVisibility(meetingId, pollId, newVal, isHost);
      if (res.success) {
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, showResultsToParticipants: newVal } : p))
        );
        const socket = getSignalingSocket();
        socket.emit('poll:toggle-results-visibility', {
          meetingId,
          pollId,
          showResultsToParticipants: newVal,
        });
      }
    } catch (err) {
      console.error('Failed to toggle results visibility:', err);
    }
  };

  // Host: Export Results (CSV or JSON)
  const handleExport = async (pollId: string, format: 'csv' | 'json') => {
    try {
      await api.exportPollResults(meetingId, pollId, format);
    } catch (err) {
      console.error('Failed to export results:', err);
    }
  };

  // Participant: Select Option
  const handleOptionSelect = (poll: Poll, optionId: string) => {
    const current = selectedOptions[poll.id] || [];
    if (poll.pollType === 'single') {
      setSelectedOptions({
        ...selectedOptions,
        [poll.id]: [optionId],
      });
    } else {
      const exists = current.includes(optionId);
      const updated = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
      setSelectedOptions({
        ...selectedOptions,
        [poll.id]: updated,
      });
    }
  };

  // Participant: Submit Vote
  const handleSubmitVote = async (poll: Poll) => {
    const chosen = selectedOptions[poll.id] || [];
    if (chosen.length === 0) {
      setVoteError((prev) => ({ ...prev, [poll.id]: 'Please select at least one option' }));
      return;
    }

    setSubmittingVote((prev) => ({ ...prev, [poll.id]: true }));
    setVoteError((prev) => ({ ...prev, [poll.id]: '' }));

    const payload: SubmitPollResponseRequest = {
      selectedOptionIds: chosen,
      participantName: displayName,
    };

    try {
      const res = await api.submitPollResponse(meetingId, poll.id, payload, peerId, displayName);
      if (res.success) {
        setVoteSuccess((prev) => ({ ...prev, [poll.id]: true }));
        setPolls((prev) =>
          prev.map((p) =>
            p.id === poll.id
              ? { ...p, userResponded: true, userSelectedOptionIds: chosen }
              : p
          )
        );

        // Broadcast through WebSocket for instantaneous live tally
        const socket = getSignalingSocket();
        socket.emit('poll:respond', {
          meetingId,
          pollId: poll.id,
          selectedOptionIds: chosen,
        });

        if (res.data && res.data.results) {
          const results = res.data.results;
          setPollResults((prev) => ({
            ...prev,
            [poll.id]: results,
          }));
        }

        setTimeout(() => {
          setVoteSuccess((prev) => ({ ...prev, [poll.id]: false }));
        }, 3000);
      } else {
        setVoteError((prev) => ({
          ...prev,
          [poll.id]: res.error?.message || 'Failed to submit vote',
        }));
      }
    } catch (err: any) {
      setVoteError((prev) => ({
        ...prev,
        [poll.id]: err.message || 'Error submitting response',
      }));
    } finally {
      setSubmittingVote((prev) => ({ ...prev, [poll.id]: false }));
    }
  };

  if (!isOpen) return null;

  const activePolls = polls.filter((p) => p.status === 'active' || (isHost && p.status === 'draft'));
  const closedPolls = polls.filter((p) => p.status === 'closed');

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[440px] bg-dark-bg/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-dark-card/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Meeting Polls</h3>
              {isHost && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mivo-500/20 text-mivo-300 border border-mivo-500/30">
                  Host Controls
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isHost
                ? 'Create, manage, and review live audience feedback'
                : 'Vote and review live responses'}
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

      {/* Host Navigation Tabs */}
      {isHost && (
        <div className="flex items-center border-b border-white/5 bg-dark-card/30 px-3 pt-2">
          <button
            onClick={() => {
              setActiveTab('active');
              setIsCreating(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'active' && !isCreating
                ? 'border-mivo-500 text-mivo-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Live Polls ({activePolls.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setIsCreating(true);
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              isCreating
                ? 'border-mivo-500 text-mivo-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Poll</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setIsCreating(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history' && !isCreating
                ? 'border-mivo-500 text-mivo-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Past Polls ({closedPolls.length})
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {/* VIEW 1: HOST CREATE POLL MODAL / FORM */}
        {isHost && isCreating && (
          <form onSubmit={handleCreatePoll} className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-mivo-400" />
                New Host Poll
              </h4>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Question Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Poll Question *</label>
              <textarea
                rows={2}
                placeholder="e.g., Which feature should we prioritize next?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-xl bg-dark-card border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                required
              />
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Answer Options *</label>
                <span className="text-[11px] text-slate-500">Min 2, Max 10</span>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 rounded-xl bg-dark-card border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mivo-500"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full mt-1 py-2 border border-dashed border-white/20 hover:border-mivo-500/50 rounded-xl text-xs font-semibold text-slate-300 hover:text-mivo-300 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {/* Settings & Permissions */}
            <div className="rounded-2xl border border-white/10 bg-dark-card/60 p-4 space-y-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Poll Configuration & Rules
              </div>

              {/* Single vs Multiple */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Response Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPollType('single')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      pollType === 'single'
                        ? 'border-mivo-500 bg-mivo-950/40 text-mivo-200'
                        : 'border-white/10 bg-dark-bg text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Single Answer</div>
                    <div className="text-[10px] text-slate-500">Pick only 1 option</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPollType('multiple')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      pollType === 'multiple'
                        ? 'border-mivo-500 bg-mivo-950/40 text-mivo-200'
                        : 'border-white/10 bg-dark-bg text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">Multiple Answers</div>
                    <div className="text-[10px] text-slate-500">Select multiple options</div>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Anonymous responses</span>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-white/20 bg-dark-bg text-mivo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Allow participants to change response</span>
                  <input
                    type="checkbox"
                    checked={allowResponseChange}
                    onChange={(e) => setAllowResponseChange(e.target.checked)}
                    className="rounded border-white/20 bg-dark-bg text-mivo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">Show live results to participants</span>
                  <input
                    type="checkbox"
                    checked={showResultsToParticipants}
                    onChange={(e) => setShowResultsToParticipants(e.target.checked)}
                    className="rounded border-white/20 bg-dark-bg text-mivo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {createSubmitting ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: ACTIVE & DRAFT POLLS LIST */}
        {(!isHost || activeTab === 'active') && !isCreating && (
          <div className="space-y-4">
            {activePolls.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Active Polls</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    {isHost
                      ? 'Create your first poll to gather live feedback from participants.'
                      : 'When the host launches a poll, it will appear here in real-time.'}
                  </p>
                </div>
                {isHost && (
                  <button
                    onClick={() => {
                      setActiveTab('create');
                      setIsCreating(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-mivo-600 text-xs font-bold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Poll</span>
                  </button>
                )}
              </div>
            ) : (
              activePolls.map((poll) => {
                const results = pollResults[poll.id];
                const hasVoted = poll.userResponded;
                const userChosen = selectedOptions[poll.id] || poll.userSelectedOptionIds || [];
                const isExpanded = expandedParticipants[poll.id];

                return (
                  <div
                    key={poll.id}
                    className="rounded-2xl border border-white/10 bg-dark-card p-5 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    {/* Status Ribbon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {poll.status === 'draft' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 uppercase">
                            Draft • Not Started
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Active Poll
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {poll.pollType === 'single' ? 'Single Choice' : 'Multiple Choice'}
                        </span>
                      </div>

                      {poll.isAnonymous && (
                        <span className="text-[10px] font-medium text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Anonymous
                        </span>
                      )}
                    </div>

                    {/* Question */}
                    <div>
                      {!isHost && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mivo-400 mb-1">
                          Host is asking:
                        </div>
                      )}
                      <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {poll.question}
                      </h4>
                    </div>

                    {/* HOST VIEW: Results Horizontal Bars & Controls */}
                    {isHost ? (
                      <div className="space-y-4 pt-1">
                        {poll.status === 'draft' ? (
                          <div className="p-4 rounded-xl bg-dark-bg/60 border border-white/5 space-y-3">
                            <div className="text-xs text-slate-400">
                              {poll.options.length} Answer Options configured.
                            </div>
                            <div className="space-y-1.5">
                              {poll.options.map((opt: PollOption, i: number) => (
                                <div key={opt.id} className="text-xs text-slate-300 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                  <span>{opt.text}</span>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleStartPoll(poll.id)}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-lg shadow-emerald-600/20 transition-all"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Start Poll</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Live Response Statistics */}
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-dark-bg/60 border border-white/5 text-center">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                  Responses
                                </div>
                                <div className="text-base font-black text-white">
                                  {results?.totalResponses || poll.totalResponses || 0}{' '}
                                  <span className="text-xs text-slate-500 font-normal">
                                    / {participantCount}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                  Response Rate
                                </div>
                                <div className="text-base font-black text-emerald-400">
                                  {results?.responseRate || 0}%
                                </div>
                              </div>
                            </div>

                            {/* Horizontal Bar Chart */}
                            <div className="space-y-2.5">
                              {poll.options.map((opt: PollOption) => {
                                const optResult = results?.options.find((o: any) => o.id === opt.id);
                                const votes = optResult?.votesCount || 0;
                                const pct = optResult?.percentage || 0;

                                return (
                                  <div key={opt.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-200 font-medium truncate pr-2">
                                        {opt.text}
                                      </span>
                                      <span className="text-slate-400 font-bold shrink-0">
                                        {votes} ({pct}%)
                                      </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-dark-bg rounded-full overflow-hidden border border-white/5">
                                      <div
                                        className="h-full bg-gradient-to-r from-mivo-500 to-cyan-400 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Host Participant Breakdown (Only if non-anonymous) */}
                            {!poll.isAnonymous && results?.responses && results.responses.length > 0 && (
                              <div className="pt-2 border-t border-white/5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedParticipants({
                                      ...expandedParticipants,
                                      [poll.id]: !isExpanded,
                                    })
                                  }
                                  className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white py-1 transition-colors"
                                >
                                  <span className="flex items-center gap-1.5 font-semibold">
                                    <Users className="w-3.5 h-3.5" />
                                    View Respondent Choices ({results.responses.length})
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {results.responses.map((resp: PollResponse) => (
                                      <div
                                        key={resp.id}
                                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-dark-bg/60 border border-white/5"
                                      >
                                        <span className="font-semibold text-slate-200 truncate">
                                          {resp.participantName}
                                        </span>
                                        <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                                          {resp.selectedOptionIds
                                            .map(
                                              (id: string) =>
                                                poll.options.find((o: PollOption) => o.id === id)?.text || id
                                            )
                                            .join(', ')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Host Control Actions */}
                            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                              <button
                                onClick={() =>
                                  handleToggleVisibility(poll.id, poll.showResultsToParticipants)
                                }
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                  poll.showResultsToParticipants
                                    ? 'bg-mivo-500/20 text-mivo-300 border-mivo-500/30'
                                    : 'bg-white/5 text-slate-400 border-white/10'
                                }`}
                                title="Toggle live results for participants"
                              >
                                {poll.showResultsToParticipants ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Results Shared</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Results Hidden</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleExport(poll.id, 'csv')}
                                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white transition-all"
                                  title="Export CSV"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleClosePoll(poll.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow"
                                >
                                  <StopCircle className="w-3.5 h-3.5" />
                                  <span>Close Poll</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      /* PARTICIPANT VIEW: Voting Card or Results Card */
                      <div className="space-y-3.5 pt-1">
                        {voteError[poll.id] && (
                          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{voteError[poll.id]}</span>
                          </div>
                        )}

                        {voteSuccess[poll.id] && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Response recorded successfully!</span>
                          </div>
                        )}

                        {/* If participant has voted and is not changing response */}
                        {hasVoted && !voteSuccess[poll.id] && (
                          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Response Submitted</span>
                            </div>
                            {poll.allowResponseChange && poll.status === 'active' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPolls((prev) =>
                                    prev.map((p) =>
                                      p.id === poll.id ? { ...p, userResponded: false } : p
                                    )
                                  )
                                }
                                className="text-xs text-mivo-400 hover:text-mivo-300 font-semibold"
                              >
                                Change Response
                              </button>
                            )}
                          </div>
                        )}

                        {/* Interactive Voting Options (if not submitted or changing response) */}
                        {(!hasVoted || voteSuccess[poll.id]) && poll.status === 'active' ? (
                          <div className="space-y-2">
                            {poll.options.map((opt: PollOption) => {
                              const isSelected = userChosen.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleOptionSelect(poll, opt.id)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? 'border-mivo-500 bg-mivo-950/50 text-white ring-1 ring-mivo-500/30'
                                      : 'border-white/10 bg-dark-bg/60 text-slate-300 hover:border-white/20'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-${
                                      poll.pollType === 'single' ? 'full' : 'md'
                                    } border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-mivo-400 bg-mivo-500 text-white'
                                        : 'border-slate-500'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="text-xs font-medium flex-1">{opt.text}</span>
                                </button>
                              );
                            })}

                            <button
                              onClick={() => handleSubmitVote(poll)}
                              disabled={submittingVote[poll.id] || userChosen.length === 0}
                              className="w-full mt-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-mivo-600/20 hover:opacity-95 disabled:opacity-40 transition-all"
                            >
                              {submittingVote[poll.id] ? 'Submitting...' : 'Submit Response'}
                            </button>
                          </div>
                        ) : null}

                        {/* Participant Live Results (If enabled by host) */}
                        {poll.showResultsToParticipants && results ? (
                          <div className="pt-3 border-t border-white/10 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase">
                              <span>Live Results</span>
                              <span>{results.totalResponses} Votes</span>
                            </div>
                            {poll.options.map((opt: PollOption) => {
                              const optResult = results.options.find((o: any) => o.id === opt.id);
                              const pct = optResult?.percentage || 0;
                              const isMyPick = userChosen.includes(opt.id);

                              return (
                                <div key={opt.id} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span
                                      className={`truncate pr-2 ${
                                        isMyPick ? 'font-bold text-mivo-300' : 'text-slate-300'
                                      }`}
                                    >
                                      {opt.text} {isMyPick && '✓'}
                                    </span>
                                    <span className="text-slate-400 font-bold shrink-0">
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-dark-bg rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isMyPick
                                          ? 'bg-gradient-to-r from-mivo-500 to-cyan-400'
                                          : 'bg-slate-600'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          !isHost && (
                            <div className="text-[11px] text-slate-500 text-center italic pt-1">
                              Results are hidden by the meeting host.
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 3: HOST PAST / CLOSED POLLS */}
        {isHost && activeTab === 'history' && !isCreating && (
          <div className="space-y-4">
            {closedPolls.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-2 text-slate-400 text-xs">
                No completed or archived polls yet.
              </div>
            ) : (
              closedPolls.map((poll) => {
                const results = pollResults[poll.id];

                return (
                  <div
                    key={poll.id}
                    className="rounded-2xl border border-white/10 bg-dark-card p-5 space-y-3.5 opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase">
                        Closed Poll
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {results?.totalResponses || poll.totalResponses || 0} Total Responses
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{poll.question}</h4>

                    {/* Results summary */}
                    <div className="space-y-2 pt-1">
                      {poll.options.map((opt: PollOption) => {
                        const optResult = results?.options.find((o: any) => o.id === opt.id);
                        const votes = optResult?.votesCount || 0;
                        const pct = optResult?.percentage || 0;

                        return (
                          <div key={opt.id} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="truncate pr-2">{opt.text}</span>
                              <span className="font-bold text-slate-400">
                                {votes} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-mivo-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Past Controls */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => handleExport(poll.id, 'csv')}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReopenPoll(poll.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reopen</span>
                        </button>
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                          title="Delete poll"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
