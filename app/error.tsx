'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Runtime Boundary Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-white">कुछ तकनीकी समस्या आई</h2>
        <p className="text-xs text-slate-400">
          कृपया पेज दोबारा लोड करें। आपका डेटा पूरी तरह सुरक्षित है।
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुनः प्रयास करें (Retry)</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>होम पेज</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
