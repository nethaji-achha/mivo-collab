'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Activity,
  Server,
  Lock,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AuditLog } from '@mivo/types';
import { format } from 'date-fns';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [systemStats, setSystemStats] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadData();
  }, [search, actionFilter]);

  const loadData = async () => {
    const [logRes, statRes] = await Promise.all([
      api.getAuditLogs({ search: search || undefined, action: actionFilter || undefined }),
      api.getSystemStats(),
    ]);

    if (logRes.success && logRes.data) {
      setLogs(logRes.data);
    }
    if (statRes.success && statRes.data) {
      setSystemStats(statRes.data);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span>Audit Trail & Security Telemetry</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Immutable system logs, authentication events, and administrative actions.
          </p>
        </div>
      </div>

      {/* System Health Strip */}
      {systemStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-dark-card p-4 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400">API Status</p>
            <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Healthy (24ms)</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-dark-card p-4 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400">Media SFU Cluster</p>
            <p className="text-sm font-bold text-cyan-400">Operational</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-dark-card p-4 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400">Total Registered Users</p>
            <p className="text-sm font-bold text-white">{systemStats.totalUsers}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-dark-card p-4 space-y-1">
            <p className="text-[11px] font-semibold text-slate-400">Logged Security Events</p>
            <p className="text-sm font-bold text-white">{systemStats.totalAuditLogs}</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, email, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-dark-card border border-white/10 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl bg-dark-card border border-white/10 px-3.5 py-2 text-xs text-white focus:border-mivo-500 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="auth.login">auth.login</option>
            <option value="auth.signup">auth.signup</option>
            <option value="meeting.create">meeting.create</option>
            <option value="meeting.end">meeting.end</option>
            <option value="org.member_add">org.member_add</option>
            <option value="billing.subscription_upgrade">billing.subscription_upgrade</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl border border-white/10 bg-dark-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-dark-bg/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Target</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy • HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{log.actorName}</p>
                      <p className="text-[11px] text-slate-500">{log.actorEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-mivo-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">
                    {log.targetType}:{log.targetId.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{log.ipAddress}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Metadata Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Log Event Details ({selectedLog.id})</h3>
              <button onClick={() => setSelectedLog(null)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <pre className="rounded-2xl bg-dark-bg p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-white/5 max-h-72">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
