'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  Sparkles,
  ArrowRight,
  Plus,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Organization } from '@mivo/types';

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    api.getCurrentOrg().then((res) => {
      if (res.success && res.data) {
        setOrg(res.data);
      }
    });
  }, []);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-mivo-400" />
            <span>Organization Workspace</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage company members, teams, permissions, and SaaS subscription.
          </p>
        </div>

        <Link
          href="/organization/members"
          className="inline-flex items-center space-x-1.5 rounded-xl bg-mivo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-mivo-500 transition-all shadow-lg shadow-mivo-600/20"
        >
          <Users className="h-4 w-4" />
          <span>Manage Members</span>
        </Link>
      </div>

      {/* Org Info Banner */}
      <div className="rounded-3xl border border-white/10 bg-dark-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <img
            src={
              org?.logoUrl ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
            }
            alt="Org Logo"
            className="h-16 w-16 rounded-2xl object-cover border border-white/10"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{org?.name || 'HyperDevelopers Global'}</h2>
              <span className="rounded bg-mivo-500/20 text-mivo-300 border border-mivo-500/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                {org?.plan || 'Business'} Tier
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">Workspace Slug: {org?.slug || 'hyperdevelopers'}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Subscription Active • 100 Members Allocated</span>
            </p>
          </div>
        </div>

        <Link
          href="/organization/billing"
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
        >
          Upgrade / Change Plan
        </Link>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/organization/members"
          className="rounded-2xl border border-white/10 bg-dark-card p-6 hover:border-mivo-500/40 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30 group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-white">Members & Teams</h3>
          <p className="mt-1 text-xs text-slate-400">
            Invite coworkers, assign member or admin roles, and create teams.
          </p>
          <div className="mt-4 flex items-center text-xs text-mivo-400 font-semibold group-hover:text-mivo-300">
            <span>Manage Directory</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/organization/billing"
          className="rounded-2xl border border-white/10 bg-dark-card p-6 hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
            <CreditCard className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-white">Billing & Invoices</h3>
          <p className="mt-1 text-xs text-slate-400">
            Manage payment methods, review past invoices, and adjust seat limits.
          </p>
          <div className="mt-4 flex items-center text-xs text-cyan-400 font-semibold group-hover:text-cyan-300">
            <span>View Billing</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="rounded-2xl border border-white/10 bg-dark-card p-6 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-white">Security & Audit Logs</h3>
          <p className="mt-1 text-xs text-slate-400">
            Inspect real-time security events, auth logins, and meeting actions.
          </p>
          <div className="mt-4 flex items-center text-xs text-amber-400 font-semibold group-hover:text-amber-300">
            <span>Audit Trail</span> <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
