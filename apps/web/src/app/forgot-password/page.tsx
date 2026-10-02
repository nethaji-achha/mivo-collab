'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/layout/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setIsSubmitted(true);
      } else {
        setError(res.error?.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card/90 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" variant="icon" href={null} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
          <p className="text-xs text-slate-400">
            Enter your email and we'll dispatch a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-xs text-slate-300">
              A recovery link has been simulated for <strong className="text-white">{email}</strong>.
            </p>
            <Link
              href="/reset-password?token=reset_token_mivo_demo_123"
              className="inline-block rounded-xl bg-mivo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-mivo-500 transition-all"
            >
              Proceed to Reset Password →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="alex@mivo.collab"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-mivo-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Sending Link...' : 'Send Recovery Link'}</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/login" className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
