'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, AppTab } from '@/types';
import { isSiteAdmin } from '@/lib/admin-auth';
import {
  Home,
  MessageSquare,
  Swords,
  Bot,
  User as UserIcon,
  Coins,
  LogOut,
  Menu,
  X,
  Crown,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onlineCount: number;
  onOpenReportModal?: () => void;
}

export function CrownIcon({ className = 'w-6 h-6 text-amber-400' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

export function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onlineCount,
  onOpenReportModal,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = isSiteAdmin(currentUser?.email);

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleOpenReport = () => {
    setMobileMenuOpen(false);
    if (onOpenReportModal) {
      onOpenReportModal();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo & Community Badge */}
        <div
          id="nav-brand-logo"
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-md group-hover:scale-105 transition-transform">
            <CrownIcon className="w-5 h-5 text-slate-950 drop-shadow-sm" />
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1">
              DHOTI AALE
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                HQ
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              {onlineCount} Dhoti Clan Online
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Home */}
          <button
            id="nav-home-tab"
            onClick={() => handleTabClick('home')}
            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'text-sky-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
            {activeTab === 'home' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>

          {/* World Chat */}
          <button
            id="nav-worldchat-tab"
            onClick={() => handleTabClick('worldchat')}
            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'worldchat'
                ? 'text-sky-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>World Chat</span>
            {activeTab === 'worldchat' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>

          {/* Battle */}
          <button
            id="nav-battle-tab"
            onClick={() => handleTabClick('battle')}
            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'battle'
                ? 'text-sky-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>Battle</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
              Live
            </span>
            {activeTab === 'battle' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>

          {/* AI Assistant */}
          <button
            id="nav-assistant-tab"
            onClick={() => handleTabClick('assistant')}
            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'assistant'
                ? 'text-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4 text-amber-400" />
            <span>DHOTI AALE (AI)</span>
            {activeTab === 'assistant' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
          </button>

          {/* Profile */}
          <button
            id="nav-profile-tab"
            onClick={() => handleTabClick('profile')}
            className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'profile'
                ? 'text-sky-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            )}
          </button>

          {/* Admin Tab (VISIBLE EXCLUSIVELY TO SITE OWNER / ADMIN) */}
          {isAdmin && (
            <button
              id="nav-admin-tab"
              onClick={() => handleTabClick('admin')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Admin Panel 👑</span>
            </button>
          )}
        </nav>

        {/* Right: Google Sign in Pill or User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Dhoti Coins */}
              <div
                id="user-coins-display"
                onClick={() => handleTabClick('profile')}
                className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
              >
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>{currentUser.dhotiCoins ?? currentUser.coins ?? 100}</span>
              </div>

              {/* Avatar Pill */}
              <div
                id="user-profile-button"
                onClick={() => handleTabClick(isAdmin ? 'admin' : 'profile')}
                className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 p-1 pr-2.5 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <Image
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  width={28}
                  height={28}
                  referrerPolicy="no-referrer"
                  className="rounded-full bg-slate-800 border border-amber-400/40 object-cover"
                />
                <span className="text-xs font-semibold text-white hidden sm:inline max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                {isAdmin && (
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                    OWNER
                  </span>
                )}
              </div>

              <button
                id="logout-button"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="login-navbar-button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-950" />
              <span className="whitespace-nowrap hidden sm:inline">लॉगिन / साइन-अप</span>
              <span className="whitespace-nowrap sm:hidden text-xs">लॉगिन</span>
            </button>
          )}

          {/* Quick Report a Problem Icon Button */}
          {onOpenReportModal && (
            <button
              onClick={handleOpenReport}
              title="समस्या रिपोर्ट करें / Report a Problem"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 text-xs font-semibold transition-colors"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>रिपोर्ट / सहायता</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-3 space-y-1">
          <button
            onClick={() => handleTabClick('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'home' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => handleTabClick('worldchat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'worldchat' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>World Chat</span>
          </button>
          <button
            onClick={() => handleTabClick('battle')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'battle' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300'
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>Battle Arena</span>
          </button>
          <button
            onClick={() => handleTabClick('assistant')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'assistant' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'
            }`}
          >
            <Bot className="h-4 w-4 text-amber-400" />
            <span>DHOTI AALE (AI वॉइस)</span>
          </button>
          <button
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'profile' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-300'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </button>

          {/* Report a problem in mobile menu */}
          {onOpenReportModal && (
            <button
              onClick={handleOpenReport}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-400 hover:bg-slate-800"
            >
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>समस्या रिपोर्ट करें (Report a Problem)</span>
            </button>
          )}

          {/* Admin in Mobile Menu */}
          {isAdmin && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              <Crown className="h-4 w-4" />
              <span>Admin Panel 👑</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
