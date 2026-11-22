'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-4 shadow-2xl">
          <h1 className="text-2xl font-bold italic font-serif text-white">Instagram</h1>
          <p className="text-xs text-neutral-400">
            A critical error occurred while loading Instagram.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-xs shadow-md transition-colors"
          >
            Reload Instagram
          </button>
        </div>
      </body>
    </html>
  );
}
