'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Download,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BILLING_PLANS } from '@mivo/config';
import { Subscription, Invoice, BillingPlanTier } from '@mivo/types';
import { format } from 'date-fns';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<any>({ currentMonthMeetingMinutes: 1420, maxMeetingMinutes: 'Unlimited', storageUsedGB: 12.4, storageLimitGB: 150 });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<BillingPlanTier | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    const [subRes, invRes] = await Promise.all([api.getSubscription(), api.getInvoices()]);
    if (subRes.success && subRes.data) {
      setSubscription(subRes.data.subscription);
      if (subRes.data.usage) setUsage(subRes.data.usage);
    }
    if (invRes.success && invRes.data) {
      setInvoices(invRes.data);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlanForUpgrade) return;
    setIsProcessing(true);
    try {
      const res = await api.checkout({
        planId: selectedPlanForUpgrade,
        billingCycle,
        provider: 'stripe',
      });
      if (res.success && res.data) {
        setSubscription(res.data.subscription);
        setUpgradeMessage(res.data.message);
        setSelectedPlanForUpgrade(null);
        await loadBilling();
        setTimeout(() => setUpgradeMessage(''), 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPlanId = subscription?.plan || 'business';

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-mivo-400" />
            <span>Subscription & Billing</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your organization tier, cloud storage quota, and payment history.
          </p>
        </div>
      </div>

      {upgradeMessage && (
        <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 shadow-xl">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{upgradeMessage}</span>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <div className="rounded-3xl border border-white/10 bg-dark-card p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="rounded bg-mivo-500/20 text-mivo-300 border border-mivo-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase">
              Current Active Plan
            </span>
            <h2 className="mt-2 text-2xl font-extrabold text-white capitalize">{currentPlanId} Plan</h2>
            <p className="text-xs text-slate-400 mt-1">
              Renewal Date: {subscription ? format(new Date(subscription.renewalDate), 'MMMM dd, yyyy') : 'N/A'} • Next cycle: ${currentPlanId === 'business' ? '28' : '12'}/mo
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: Active</span>
            </span>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="space-y-1.5 bg-dark-bg p-4 rounded-2xl border border-white/5">
            <p className="text-[11px] font-semibold text-slate-400">Meeting Minutes (This Month)</p>
            <p className="text-lg font-bold text-white">{usage.currentMonthMeetingMinutes} mins</p>
            <p className="text-[10px] text-mivo-400">Unlimited on Business</p>
          </div>
          <div className="space-y-1.5 bg-dark-bg p-4 rounded-2xl border border-white/5">
            <p className="text-[11px] font-semibold text-slate-400">Cloud Recording Storage</p>
            <p className="text-lg font-bold text-white">{usage.storageUsedGB} GB / {usage.storageLimitGB} GB</p>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-[12%]" />
            </div>
          </div>
          <div className="space-y-1.5 bg-dark-bg p-4 rounded-2xl border border-white/5">
            <p className="text-[11px] font-semibold text-slate-400">Max Active Seats</p>
            <p className="text-lg font-bold text-white">12 / 100 Members</p>
            <p className="text-[10px] text-emerald-400">88 Seats Available</p>
          </div>
        </div>
      </div>

      {/* Available Plans Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Compare All Tier Capabilities</h2>
            <p className="text-xs text-slate-400">Upgrade or downgrade your organization subscription anytime.</p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center rounded-xl bg-dark-card border border-white/10 p-1 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                billingCycle === 'yearly' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual (20% Off)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BILLING_PLANS.map((p) => {
            const isCurrent = currentPlanId === p.id;
            const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;

            return (
              <div
                key={p.id}
                className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-mivo-500 bg-dark-card/90 ring-1 ring-mivo-500 shadow-xl'
                    : 'border-white/10 bg-dark-card hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    {isCurrent && (
                      <span className="rounded bg-mivo-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline space-x-1">
                    <span className="text-2xl font-extrabold text-white">${price}</span>
                    <span className="text-[11px] text-slate-400">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 min-h-[30px]">{p.tagline}</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-white/5">
                  <button
                    disabled={isCurrent}
                    onClick={() => setSelectedPlanForUpgrade(p.id)}
                    className={`w-full rounded-xl py-2 text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-white/5 text-slate-500 cursor-default'
                        : 'bg-gradient-to-r from-mivo-600 to-cyan-500 text-white shadow hover:opacity-95'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : `Switch to ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Invoice History</h2>
        <div className="rounded-3xl border border-white/10 bg-dark-card overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-dark-bg/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Invoice ID</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-white">{inv.id}</td>
                  <td className="px-6 py-4">{format(new Date(inv.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4">${inv.amount}.00 USD</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-mivo-400 hover:text-mivo-300 inline-flex items-center gap-1 font-medium">
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Checkout Confirmation Modal */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Confirm Plan Modification</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are switching your organization subscription to <strong className="text-white uppercase">{selectedPlanForUpgrade}</strong> ({billingCycle}).
            </p>
            <div className="rounded-2xl bg-dark-bg p-4 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Selected Tier:</span>
                <span className="text-white font-semibold uppercase">{selectedPlanForUpgrade}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Billing Frequency:</span>
                <span className="text-white font-semibold capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-white/5 pt-2 font-bold text-white">
                <span>Total Due:</span>
                <span>
                  ${billingCycle === 'yearly' ? BILLING_PLANS.find((p) => p.id === selectedPlanForUpgrade)?.priceYearly : BILLING_PLANS.find((p) => p.id === selectedPlanForUpgrade)?.priceMonthly}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 px-5 py-2 text-xs font-bold text-white hover:opacity-95 transition-all shadow-lg"
              >
                {isProcessing ? 'Processing Checkout...' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
