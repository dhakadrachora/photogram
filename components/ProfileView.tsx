'use client';

import React from 'react';
import Image from 'next/image';
import { User, AppTab } from '@/types';
import {
  Coins,
  Trophy,
  Swords,
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
  Share2,
  Flame,
  Award,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { PWAInstallButton } from './PWAInstallButton';
import { Smartphone, RefreshCw } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: AppTab) => void;
}

export function ProfileView({ currentUser, onOpenAuth, onLogout, onNavigateTab }: ProfileViewProps) {
  const handleShare = () => {
    SoundEffects.playBell();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('DHOTI AALE invite link copied! Apne doston ke sath share karo! 🚀');
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#07080c]">
        <div className="max-w-md w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <Crown className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Your Dhoti Aale Profile</h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in with Google to view your Dhoti Coins, battle trophies, rank badges, and chat history.
          </p>
          <button
            onClick={onOpenAuth}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 px-6 shadow-xl transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#07080c] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => onNavigateTab('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>

        {/* Profile Card Header */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="relative">
              <Image
                src={currentUser.avatar}
                alt={currentUser.name}
                width={96}
                height={96}
                referrerPolicy="no-referrer"
                className="h-24 w-24 rounded-full object-cover border-4 border-amber-400 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black text-xs border-2 border-slate-900">
                ✓
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{currentUser.name}</h1>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40">
                  {currentUser.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentUser.email}</p>

              {/* Stats Bar */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">{currentUser.coins}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Dhoti Coins</div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">{currentUser.wins}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Battle Wins</div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-sky-400">{currentUser.battles}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Total Battles</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Profile</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Launchpad to Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigateTab('worldchat')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                💬
              </div>
              <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Enter World Chat</h3>
            <p className="text-xs text-slate-400 mt-1">Talk live with verified Dhoti Aale members.</p>
          </button>

          <button
            onClick={() => onNavigateTab('battle')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-fuchsia-500/30 hover:border-fuchsia-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                ⚔️
              </div>
              <span className="text-xs font-bold text-fuchsia-400 group-hover:translate-x-1 transition-transform">
                Fight →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Live Battle Arena</h3>
            <p className="text-xs text-slate-400 mt-1">Compete in rap and roast clashes to earn +100 Coins.</p>
          </button>

          <button
            onClick={() => onNavigateTab('assistant')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                🎙️
              </div>
              <span className="text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
                Talk →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Talk to AI Assistant</h3>
            <p className="text-xs text-slate-400 mt-1">Voice and text chat with witty desi buddy.</p>
          </button>
        </div>

        {/* App Installation & Live Updates Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">DHOTI AALE Mobile App</h4>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  PWA v1.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                अपने मोबाइल में इंस्टॉल करें और कभी भी नया अपडेट आने पर 1-क्लिक में रिफ्रेश करें।
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[220px]">
            <PWAInstallButton variant="profile" />
          </div>
        </div>
      </div>
    </div>
  );
}
