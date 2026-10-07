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
    console.error('App Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0B1220] border border-cyan-500/20 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20 text-3xl">
          😅
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white font-hindi">
          कुछ गड़बड़ हो गई सा 😅
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 font-hindi">
          कृपया थोड़ी देर बाद फिर कोशिश करें।
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुनः प्रयास करें (Retry)</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors border border-white/10"
          >
            <Home className="w-4 h-4" />
            <span>होम पेज</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
