'use client';

import React from 'react';

export function AdminLoading({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header bar shimmer */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="h-7 w-48 bg-slate-800 rounded-xl" />
        <div className="h-9 w-28 bg-slate-800 rounded-xl" />
      </div>

      {/* Metric Cards or Table skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900 border border-slate-800/80 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-800 rounded" />
              <div className="h-8 w-8 bg-slate-800 rounded-xl" />
            </div>
            <div className="h-6 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Main content table/list shimmer */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="h-5 w-32 bg-slate-800 rounded" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
