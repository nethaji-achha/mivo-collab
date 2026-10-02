'use client';

import React from 'react';

interface AudioVisualizerProps {
  level: number; // 0 - 100
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({ level, barCount = 5, className = '' }: AudioVisualizerProps) {
  // Generate bar heights based on level
  const bars = Array.from({ length: barCount }, (_, i) => {
    const factor = Math.sin((i / barCount) * Math.PI);
    const heightPercent = Math.max(15, Math.min(100, Math.round(level * factor + Math.random() * 10)));
    return heightPercent;
  });

  return (
    <div className={`flex items-center space-x-1 h-4 ${className}`}>
      {bars.map((height, i) => (
        <span
          key={i}
          style={{ height: `${height}%` }}
          className="w-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 transition-all duration-75 ease-out"
        />
      ))}
    </div>
  );
}
