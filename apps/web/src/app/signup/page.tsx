'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Video, Mail, Lock, User, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/layout/Logo';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters with letters and numbers');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signup({
        name,
        email,
        password,
        organizationName: orgName || undefined,
      });

      if (success) {
        router.push('/dashboard');
      } else {
        setError('Failed to create account. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-dark-card/90 p-8 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" variant="icon" href={null} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your Mivo Collab Account</h1>
          <p className="text-xs text-slate-400">Connect • Collaborate • Grow</p>
        </div>

        {error && (
          <div className="mt-6 flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Work Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Min 8 characters (e.g. Password123!)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Company / Organization (Optional)</label>
            <div className="relative mt-1">
              <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="HyperDevelopers Lab"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-xl bg-dark-bg border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mivo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 to-cyan-500 py-3 text-xs font-bold text-white shadow-lg shadow-mivo-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <span>{isLoading ? 'Creating Account...' : 'Get Started Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-mivo-400 hover:text-mivo-300">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
