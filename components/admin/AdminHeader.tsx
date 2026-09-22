'use client';

import React from 'react';
import { Menu, LogOut, Radio } from 'lucide-react';
import { AdminUserSession } from '@/lib/admin/types';
import { signOutSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  session?: AdminUserSession | null;
  onOpenMobileMenu?: () => void;
  title?: string;
}

export function AdminHeader({ session, onOpenMobileMenu, title }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOutSupabase();
    router.push('/');
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {title || 'DHOTI AALE Admin'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live sync pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Supabase Live</span>
        </div>

        {/* User Card */}
        {session && (
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-800">
            {session.avatar ? (
              <img
                src={session.avatar}
                alt={session.name}
                className="w-7 h-7 rounded-full object-cover border border-amber-400/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center text-xs font-bold">
                {session.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white truncate max-w-[130px]">{session.name}</div>
              <div className="text-[10px] text-amber-400 font-mono capitalize">{session.role}</div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
