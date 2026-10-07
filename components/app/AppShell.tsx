'use client';

import React, { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { AppBottomNav } from './AppBottomNav';

interface AppShellProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export function AppShell({ children, hideBottomNav = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Background Ambient Neon Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[360px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />
      <div className="fixed bottom-20 right-0 w-[300px] h-[300px] bg-gradient-to-tr from-purple-600/5 via-indigo-600/5 to-transparent blur-3xl pointer-events-none rounded-full -z-10" />

      {/* Top Mobile & Desktop Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation */}
      {!hideBottomNav && <AppBottomNav />}
    </div>
  );
}
