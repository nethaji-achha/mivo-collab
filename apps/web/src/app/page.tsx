'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Shield,
  Zap,
  Users,
  Sparkles,
  ScreenShare,
  Lock,
  ChevronRight,
  Check,
  Play,
  Calendar,
  MessageSquare,
  Globe,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BILLING_PLANS } from '@mivo/config';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [instantLoading, setInstantLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleStartInstantMeeting = async () => {
    setInstantLoading(true);
    try {
      if (!user) {
        await demoLogin('alex');
      }
      const res = await api.createMeeting({
        title: `${user?.name || 'Alex'}'s Instant Meeting`,
        type: 'instant',
      });
      if (res.success && res.data) {
        router.push(`/join/${res.data.publicMeetingId}`);
      } else {
        router.push('/join/mivo-collab-hq');
      }
    } catch {
      router.push('/join/mivo-collab-hq');
    } finally {
      setInstantLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does Mivo Collab achieve low latency and crystal-clear media?',
      a: 'Mivo Collab uses a Selective Forwarding Unit (SFU) media server architecture combined with WebRTC, adaptive bitrate streaming, and dynamic simulcast routing to ensure uninterrupted video calls across unstable networks.',
    },
    {
      q: 'Is an account required to join a meeting?',
      a: 'No! Guests can join any public or team meeting instantly with a single click through the pre-join lobby without requiring complicated account registration.',
    },
    {
      q: 'How does AI transcription and summarization work?',
      a: 'Our asynchronous intelligence pipeline automatically captures audio streams, transcribes spoken dialogue with speaker attribution, and extracts actionable summaries into your meeting workspace.',
    },
    {
      q: 'What security standards does Mivo Collab follow?',
      a: 'All audio, video, and data channels are secured with DTLS-SRTP and TLS 1.3 encryption. We enforce server-side role validation, audit trails, and strict privacy controls.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-mivo-600/30 blur-[140px]" />
        <div className="absolute top-[-10%] right-[20%] w-[400px] h-[400px] rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-mivo-500/30 bg-mivo-500/10 px-4 py-1.5 text-xs font-medium text-mivo-300 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Next-Gen WebRTC Communication Platform</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">by HyperDevelopers</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            Connect • Collaborate • <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-green-300 bg-clip-text text-transparent">
              Grow
            </span>
          </h1>

          {/* Tagline / Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            A serious commercial SaaS platform built for crystal-clear HD video meetings, ultra-low latency SFU media routing, team workspaces, and AI meeting intelligence.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartInstantMeeting}
              disabled={instantLoading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-mivo-600 via-mivo-500 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-mivo-600/30 hover:shadow-mivo-500/50 hover:scale-[1.02] transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>{instantLoading ? 'Creating Meeting Room...' : 'Start Instant Meeting'}</span>
            </button>

            <Link
              href="/schedule"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white hover:bg-white/10 backdrop-blur-md transition-all"
            >
              <Calendar className="h-4 w-4 text-mivo-400" />
              <span>Schedule a Meeting</span>
            </Link>

            <Link
              href="/join/mivo-collab-hq"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-8 py-4 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 backdrop-blur-md transition-all"
            >
              <Radio className="h-4 w-4" />
              <span>Join Live Demo Room</span>
            </Link>
          </div>

          {/* Metrics strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-white/5 text-center">
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">&lt; 50ms</p>
              <p className="text-xs text-slate-400 mt-0.5">Real-time Audio Latency</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">1000+</p>
              <p className="text-xs text-slate-400 mt-0.5">Concurrent Video Participants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">99.99%</p>
              <p className="text-xs text-slate-400 mt-0.5">Service Availability SLA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">DTLS-SRTP</p>
              <p className="text-xs text-slate-400 mt-0.5">End-to-End Media Security</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Meeting Room Preview Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative rounded-3xl border border-white/10 bg-dark-card/80 p-3 sm:p-6 shadow-2xl backdrop-blur-2xl">
          {/* Mock Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[420px] rounded-2xl bg-dark-bg p-3 border border-white/5 relative overflow-hidden">
            {/* Tile 1: Active Speaker */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10 flex flex-col justify-between p-4">
              <div className="flex justify-between items-center z-10">
                <span className="rounded bg-mivo-600 px-2 py-0.5 text-[10px] font-bold text-white">Host</span>
                <span className="flex items-center space-x-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Speaking</span>
                </span>
              </div>
              <div className="self-center flex flex-col items-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Alex"
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
                />
                <p className="mt-2 text-xs font-semibold text-white">Alex Rivera</p>
                <div className="mt-1 flex space-x-1">
                  <span className="h-2 w-1 bg-cyan-400 rounded-full animate-wave-bar" />
                  <span className="h-3 w-1 bg-cyan-400 rounded-full animate-wave-bar delay-75" />
                  <span className="h-4 w-1 bg-cyan-400 rounded-full animate-wave-bar delay-150" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 z-10">
                <span>San Francisco, CA</span>
                <span>1080p HD • 60 FPS</span>
              </div>
            </div>

            {/* Tile 2: Participant */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex flex-col justify-between p-4">
              <div className="flex justify-between items-center z-10">
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">Engineering</span>
              </div>
              <div className="self-center flex flex-col items-center">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Sarah"
                  className="h-20 w-20 rounded-2xl object-cover border border-white/10"
                />
                <p className="mt-2 text-xs font-semibold text-white">Sarah Chen</p>
              </div>
              <div className="text-[10px] text-slate-400">Bangalore, IN</div>
            </div>

            {/* Tile 3: Screen Share Preview */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-mivo-500/40 flex flex-col justify-between p-4">
              <div className="flex justify-between items-center z-10">
                <span className="rounded bg-mivo-500/20 text-mivo-300 border border-mivo-500/30 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                  <ScreenShare className="h-3 w-3" /> Architecture Diagram
                </span>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 font-mono space-y-1">
                <p className="text-cyan-400 font-bold">// SFU Selective Forwarding Unit</p>
                <p>Client -&gt; RTP Track -&gt; Mediasoup Router</p>
                <p>Adaptive Simulcast: 1080p, 720p, 360p</p>
                <p className="text-emerald-400">Zero packet loss recorded</p>
              </div>
              <div className="text-[10px] text-slate-400">Shared by Liam Smith</div>
            </div>
          </div>

          {/* Floating toolbar mockup */}
          <div className="mt-4 flex items-center justify-center space-x-3 bg-dark-bg/90 rounded-2xl p-2.5 border border-white/10 max-w-md mx-auto shadow-xl">
            <span className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white text-xs">🎙️</span>
            <span className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white text-xs">📹</span>
            <span className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">🖥️</span>
            <span className="h-8 w-8 rounded-xl bg-mivo-600/30 text-mivo-300 flex items-center justify-center text-xs">💬</span>
            <span className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white text-xs">👥</span>
            <span className="h-8 px-4 rounded-xl bg-rose-600 text-white font-semibold text-xs flex items-center justify-center">Leave</span>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mivo-400">Core Capabilities</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for High Stakes Collaboration
          </p>
          <p className="mt-3 text-sm text-slate-400">
            From quick 1-on-1 standups to 1,000-person organization townhalls with zero performance compromise.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-3xl border border-white/10 bg-dark-card p-8 flex flex-col justify-between hover:border-mivo-500/40 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mivo-600/20 text-mivo-400 border border-mivo-500/30 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Selective Forwarding Unit (SFU)</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Unlike primitive peer-to-peer mesh networks, Mivo uses a dedicated media server layer that routes streams dynamically with adaptive bitrate and simulcast.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-mivo-300 font-semibold flex items-center gap-1">
              <span>Production Group RTC</span> <ChevronRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-white/10 bg-dark-card p-8 flex flex-col justify-between hover:border-cyan-500/40 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">AI Meeting Intelligence</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Capture everything automatically. Instant speech-to-text transcription, key summary bullets, actionable task extraction, and searchable meeting knowledge.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
              <span>Automated Summaries</span> <ChevronRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-white/10 bg-dark-card p-8 flex flex-col justify-between hover:border-amber-500/40 transition-all group">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Enterprise Security & Compliance</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Server-side authorization on every action, non-predictable meeting tokens, complete audit logs, SAML/SSO readiness, and granular host moderation controls.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              <span>Audit Logs & Role Control</span> <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mivo-400">Transparent SaaS Pricing</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Flexible Plans for Every Stage of Growth
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Start for free as an individual creator, or empower your entire organization with enterprise scale.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-8 inline-flex items-center rounded-xl bg-dark-card border border-white/10 p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex items-center space-x-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                billingCycle === 'yearly' ? 'bg-mivo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BILLING_PLANS.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const isFeatured = plan.id === 'business';
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all ${
                  isFeatured
                    ? 'border-2 border-mivo-500 bg-dark-card shadow-2xl shadow-mivo-500/20 ring-1 ring-mivo-500/50'
                    : 'border border-white/10 bg-dark-card/60 hover:border-white/20'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-mivo-600 to-cyan-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Most Popular
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-slate-400 min-h-[36px]">{plan.tagline}</p>
                  <div className="mt-5 flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-white">${price}</span>
                    <span className="text-xs text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5">
                  <Link
                    href={user ? '/organization/billing' : '/signup'}
                    className={`w-full flex items-center justify-center rounded-xl py-2.5 text-xs font-semibold transition-all ${
                      isFeatured
                        ? 'bg-gradient-to-r from-mivo-600 to-cyan-500 text-white shadow-lg shadow-mivo-600/30 hover:opacity-95'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {plan.priceMonthly === 0 ? 'Get Started Free' : `Upgrade to ${plan.name}`}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mivo-400">Frequently Asked Questions</h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">Everything You Need to Know</p>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-dark-card overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-mivo-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-mivo-900 via-mivo-800 to-indigo-950 border border-mivo-500/30 p-8 sm:p-12 text-center shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to elevate your team's real-time communication?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join leading engineering, product, and enterprise teams using Mivo Collab for frictionless video meetings.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleStartInstantMeeting}
                className="w-full sm:w-auto rounded-xl bg-white px-6 py-3 text-xs font-bold text-dark-bg hover:bg-slate-100 transition-all shadow-lg"
              >
                Start Instant Meeting
              </button>
              <Link
                href="/signup"
                className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold text-white hover:bg-white/20 transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
