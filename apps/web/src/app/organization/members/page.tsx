'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  Check,
  Building,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrgMember, Team } from '@mivo/types';
import { format } from 'date-fns';

export default function MembersTeamsPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [memRes, teamRes] = await Promise.all([api.getOrgMembers(), api.getTeams()]);
    if (memRes.success && memRes.data) setMembers(memRes.data);
    if (teamRes.success && teamRes.data) setTeams(teamRes.data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.inviteMember({ email: inviteEmail, role: inviteRole });
      if (res.success && res.data) {
        setMembers((prev) => [...prev, res.data!]);
        setShowInviteModal(false);
        setInviteEmail('');
        setMessage(`Invited ${inviteEmail} successfully!`);
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.createTeam({ name: teamName, description: teamDesc });
      if (res.success && res.data) {
        setTeams((prev) => [...prev, res.data!]);
        setShowTeamModal(false);
        setTeamName('');
        setTeamDesc('');
        setMessage(`Team created successfully!`);
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await api.removeMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-mivo-400" />
            <span>Members & Teams</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage organization members, role access, and squads.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'members' ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-mivo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </button>
          ) : (
            <button
              onClick={() => setShowTeamModal(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create Team</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'members' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'teams' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Teams ({teams.length})
        </button>
      </div>

      {/* Tab 1: Members Table */}
      {activeTab === 'members' && (
        <div className="rounded-3xl border border-white/10 bg-dark-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-dark-bg/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            mem.user.avatarUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(mem.user.name)}`
                          }
                          alt={mem.user.name}
                          className="h-8 w-8 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <p className="font-semibold text-white">{mem.user.name}</p>
                          <p className="text-[11px] text-slate-400">{mem.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-mivo-300 uppercase">
                        {mem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium capitalize">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {mem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {format(new Date(mem.joinedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {mem.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(mem.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Teams Grid */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-dark-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{t.name}</h3>
                <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-semibold">
                  {t.memberCount} Members
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.description || 'General collaboration squad'}</p>
              <div className="pt-2 text-[10px] text-slate-500">
                Created on {format(new Date(t.createdAt), 'MMM dd, yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Invite New Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@hyperdevs.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Organization Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                >
                  <option value="member">Member (Can host & join calls)</option>
                  <option value="admin">Admin (Can manage organization & billing)</option>
                  <option value="guest">Guest (Join permitted calls only)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-mivo-600 px-5 py-2 text-xs font-bold text-white hover:bg-mivo-500 transition-all shadow-lg"
                >
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Collaboration Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Media Core"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Squad focus and deliverables..."
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-dark-bg border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-mivo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-all shadow-lg"
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
