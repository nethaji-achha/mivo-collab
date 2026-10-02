'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Video, Mail, Lock, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/layout/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. You can also use one-click demo login below.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: 'alex' | 'sarah' | 'liam') => {
    setIsLoading(true);
    await demoLogin(role);
    router.push('/dashboard');
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card/90 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" variant="icon" href={null} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Mivo Collab</h1>
          <p className="text-xs text-slate-400">Sign in to your collaboration workspace</p>
        </div>

        {error && (
          <div className="mt-6 flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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

          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-mivo-400 hover:text-mivo-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Password123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-mivo-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Demo One-Click Logins */}
        <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" /> One-Click Demo Personas
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemo('alex')}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-center hover:bg-white/10 hover:border-mivo-500/40 transition-all"
            >
              <p className="text-xs font-bold text-white">Alex</p>
              <p className="text-[10px] text-mivo-300">Individual Host</p>
            </button>
            <button
              onClick={() => handleDemo('sarah')}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-center hover:bg-white/10 hover:border-cyan-500/40 transition-all"
            >
              <p className="text-xs font-bold text-white">Sarah</p>
              <p className="text-[10px] text-cyan-300">Org Admin</p>
            </button>
            <button
              onClick={() => handleDemo('liam')}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-center hover:bg-white/10 hover:border-purple-500/40 transition-all"
            >
              <p className="text-xs font-bold text-white">Liam</p>
              <p className="text-[10px] text-purple-300">Engineer</p>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          New to Mivo Collab?{' '}
          <Link href="/signup" className="font-semibold text-mivo-400 hover:text-mivo-300">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
