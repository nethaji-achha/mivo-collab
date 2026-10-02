'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Zap,
  Plus,
  UserPlus,
  Mail,
  Calendar,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { CompanyProduct, ProductTeam, ProductMember } from '@mivo/types';

interface ProductTeamsRosterProps {
  product: CompanyProduct;
  onOpenAddSquad: () => void;
  onOpenAddMember: () => void;
}

export function ProductTeamsRoster({
  product,
  onOpenAddSquad,
  onOpenAddMember,
}: ProductTeamsRosterProps) {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'product_lead':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'tech_lead':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'designer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'devops_lead':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'qa_specialist':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'growth_pm':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-white/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Squads / Teams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-mivo-400" />
            <h3 className="text-sm font-bold text-white">Product Squads & Sprints</h3>
          </div>
          <button
            onClick={onOpenAddSquad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Squad</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {product.teams?.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-white/10 bg-dark-card/80 p-5 space-y-3 hover:border-white/20 transition-all shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r ${
                    team.color || 'from-mivo-500 to-cyan-500'
                  }`}
                >
                  Squad
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {team.membersCount || 1} Members
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{team.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{team.description}</p>
              </div>

              <div className="pt-2.5 border-t border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px]">Squad Lead:</span>
                  <span className="font-semibold text-slate-200">{team.leadName} ({team.leadRole})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px]">Sprint Focus:</span>
                  <span className="font-semibold text-mivo-300 truncate max-w-[160px]">{team.currentSprint}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Team Members Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Assigned Team Roster ({product.members?.length || 0})</h3>
          </div>
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 hover:from-mivo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-mivo-600/20 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Member</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {product.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-dark-card/70 hover:bg-dark-card transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-mivo-600/30 border border-white/10 flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden shadow">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">{member.name}</h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase shrink-0 ${getRoleBadgeStyle(
                      member.role
                    )}`}
                  >
                    {member.role.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 truncate">{member.title}</p>
                {member.assignedTeamName && (
                  <p className="text-[10px] text-mivo-400 font-semibold truncate mt-0.5">
                    Squad: {member.assignedTeamName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
