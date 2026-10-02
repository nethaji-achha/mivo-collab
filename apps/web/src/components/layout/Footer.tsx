'use client';

import React from 'react';
import Link from 'next/link';
import { Video, ShieldCheck, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';

export function Footer() {
  const pathname = usePathname();

  // Hide footer inside meeting room
  if (pathname.startsWith('/meetings/') && !pathname.endsWith('/lobby')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Connect • Collaborate • Grow. Enterprise-grade WebRTC video meetings, real-time collaboration, and intelligent knowledge capture.
            </p>
            <div className="text-[11px] text-slate-500">
              Owned and developed by <span className="font-semibold text-slate-700">HyperDevelopers</span>.
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-800">Product</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/#features" className="hover:text-mivo-600 transition-colors">Instant Meetings</Link></li>
              <li><Link href="/#features" className="hover:text-mivo-600 transition-colors">Screen Sharing & Chat</Link></li>
              <li><Link href="/schedule" className="hover:text-mivo-600 transition-colors">Meeting Scheduler</Link></li>
              <li><Link href="/organization/billing" className="hover:text-mivo-600 transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/#security" className="hover:text-mivo-600 transition-colors">Security & SFU</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-800">Platform</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/dashboard" className="hover:text-mivo-600 transition-colors">Dashboard</Link></li>
              <li><Link href="/organization" className="hover:text-mivo-600 transition-colors">Workspaces</Link></li>
              <li><Link href="/admin/audit-logs" className="hover:text-mivo-600 transition-colors">Audit Logs</Link></li>
              <li><Link href="/settings" className="hover:text-mivo-600 transition-colors">Device Setup</Link></li>
            </ul>
          </div>

          {/* Compliance */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-800">Compliance</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center space-x-1.5"><ShieldCheck className="h-3.5 w-3.5 text-mivo-600" /><span>TLS / DTLS-SRTP</span></li>
              <li className="flex items-center space-x-1.5"><ShieldCheck className="h-3.5 w-3.5 text-mivo-600" /><span>SOC 2 Type II Ready</span></li>
              <li className="flex items-center space-x-1.5"><ShieldCheck className="h-3.5 w-3.5 text-mivo-600" /><span>GDPR & Privacy First</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Mivo Collab. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with precision for HyperDevelopers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
