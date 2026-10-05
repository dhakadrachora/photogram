'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="hi">
      <body className="bg-stone-950 text-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-center space-y-4 shadow-2xl">
          <h2 className="text-xl font-black text-amber-400">DHOTI AALE</h2>
          <p className="text-xs text-slate-300">
            एप्लिकेशन लोड करने में समस्या आई। कृपया पुनः प्रयास करें।
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-transform active:scale-95"
          >
            ऐप पुनः लोड करें
          </button>
        </div>
      </body>
    </html>
  );
}
