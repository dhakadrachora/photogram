'use client';

import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Radio, Crown, Sparkles, ExternalLink } from 'lucide-react';
import { AdminUserSession } from '@/lib/admin/types';
import { signOutSupabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminHeaderProps {
  session?: AdminUserSession | null;
  onOpenMobileMenu?: () => void;
  title?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Executive Command Dashboard',
  '/admin/news': 'Village News & Media Hub',
  '/admin/people': 'Hall of Fame (Personalities)',
  '/admin/businesses': 'Village Business Directory',
  '/admin/battles': 'Live Community Battle Arena',
  '/admin/users': 'Resident Members & Roles',
  '/admin/gallery': 'Cultural Photo Gallery',
  '/admin/videos': 'Video Showcase & Documentaries',
  '/admin/comments': 'Resident Problem Support',
  '/admin/notifications': 'Community Announcements Ticker',
  '/admin/storage': 'Supabase Storage Bucket Explorer',
  '/admin/analytics': 'Database Real-time Insights',
  '/admin/ai': 'DHOTI AALE Admin AI Co-Pilot',
  '/admin/activity': 'Real-time System Audit Trail',
  '/admin/security': 'Security & Role Level Audits',
  '/admin/settings': 'Global Portal Configuration',
};

export function AdminHeader({ session, onOpenMobileMenu, title }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const d = new Date();
    setCurrentDate(
      d.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  const handleLogout = async () => {
    await signOutSupabase();
    router.push('/');
  };

  const activeTitle = title || ROUTE_TITLES[pathname] || 'Administration Console';

  return (
    <header className="h-16 bg-[#090D16]/85 backdrop-blur-xl border-b border-white/6 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="truncate">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
              {activeTitle}
            </h1>
            <span className="hidden md:inline-flex text-[9px] px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono">
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Live sync orb */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Supabase Synced</span>
        </div>

        {/* Date badge */}
        {currentDate && (
          <div className="hidden lg:block text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-white/3 border border-white/5">
            {currentDate}
          </div>
        )}

        {/* User Card */}
        {session && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/8">
            <div className="relative">
              {session.avatar ? (
                <img
                  src={session.avatar}
                  alt={session.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 border border-amber-300 flex items-center justify-center text-xs font-black shadow-md">
                  {session.name.charAt(0).toUpperCase()}
                </div>
              )}
              {session.isOwner && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-xs">
                  <Crown className="h-2.5 w-2.5" />
                </div>
              )}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white truncate max-w-[120px] flex items-center gap-1">
                <span>{session.name}</span>
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono font-bold capitalize">
                {session.role === 'owner' ? '👑 Site Owner' : 'Administrator'}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all ml-1 border border-transparent hover:border-red-500/20"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
