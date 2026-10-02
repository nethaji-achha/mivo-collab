'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  CalendarPlus,
  History,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  Bell,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Do not show sidebar on landing page, auth pages, or inside active meeting room
  const hideSidebar =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/join/') ||
    (pathname.startsWith('/meetings/') && !pathname.endsWith('/lobby'));

  if (hideSidebar || !user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Teamwork & Stages', href: '/teamwork', icon: Compass },
    { label: 'Meetings', href: '/meetings', icon: History },
    { label: 'Schedule', href: '/schedule', icon: CalendarPlus },
    { label: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const orgItems = [
    { label: 'Organization', href: '/organization', icon: Building2 },
    { label: 'Members & Teams', href: '/organization/members', icon: Users },
    { label: 'Billing & Plans', href: '/organization/billing', icon: CreditCard },
  ];

  const adminItems = [
    { label: 'Audit Logs & Security', href: '/admin/audit-logs', icon: ShieldCheck },
    { label: 'Preferences', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200 bg-slate-50/70 p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-mivo-50 text-mivo-700 border border-mivo-200 shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-mivo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Collaboration</p>
          <nav className="mt-2 space-y-1">
            {orgItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-mivo-50 text-mivo-700 border border-mivo-200 shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-mivo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Administration</p>
          <nav className="mt-2 space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-mivo-50 text-mivo-700 border border-mivo-200 shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-mivo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
