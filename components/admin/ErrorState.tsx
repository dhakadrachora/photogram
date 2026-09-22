'use client';

import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Failed to load section',
  error = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl bg-red-950/20 border border-red-900/40 my-4 space-y-3">
      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
        <AlertOctagon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-red-200 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-red-300/80 max-w-md leading-relaxed font-mono bg-red-950/40 p-2 rounded-lg border border-red-900/30">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white transition-all shadow-md active:scale-95"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
