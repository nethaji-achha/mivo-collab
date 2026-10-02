'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'mark-with-text';
  showTagline?: boolean;
  href?: string | null;
}

const SIZE_MAP = {
  sm: { icon: 28, text: 'text-sm', subText: 'text-[9px]' },
  md: { icon: 36, text: 'text-base', subText: 'text-[10px]' },
  lg: { icon: 44, text: 'text-lg', subText: 'text-[11px]' },
  xl: { icon: 64, text: 'text-2xl', subText: 'text-xs' },
};

export function Logo({
  className = '',
  size = 'md',
  variant = 'mark-with-text',
  showTagline = true,
  href = '/',
}: LogoProps) {
  const config = SIZE_MAP[size] || SIZE_MAP.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Logo Graphic Container */}
      <div
        className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-1 ring-1 ring-white/10 shadow-lg shadow-mivo-500/10 group-hover:ring-mivo-400/40 group-hover:scale-105 transition-all duration-200"
        style={{ width: config.icon, height: config.icon }}
      >
        <img
          src="/logo.png"
          alt="Mivo Collab Logo"
          className="h-full w-full object-contain rounded-lg drop-shadow-md"
        />
      </div>

      {/* Brand Text */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className={`font-extrabold tracking-tight text-white flex items-center gap-1.5 ${config.text}`}>
            <span>Mivo</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent">
              Collab
            </span>
          </div>
          {showTagline && (
            <span className={`font-semibold tracking-wide text-slate-400 group-hover:text-slate-300 transition-colors uppercase ${config.subText}`}>
              Connect • Collaborate • Grow
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-mivo-400 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
