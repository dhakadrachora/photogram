'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Bell,
  Coins,
  Sparkles,
  User as UserIcon,
  Flame,
  ShieldCheck,
  Bot,
  Swords,
  Newspaper,
  MessageSquare,
  Wrench,
  Gift,
  X,
  ExternalLink,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenNotifications?: () => void;
}

export function AppHeader({ onOpenNotifications }: AppHeaderProps) {
  const pathname = usePathname();
  const { currentUser, openAuthModal, openEarnCoinsModal, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const coins = currentUser?.coins ?? 50;

  // Real mock notifications based on live community activity
  const notifications = [
    {
      id: '1',
      title: '⚔️ नया लाइव बैटल शुरू हुआ!',
      desc: 'रोहित धाकड़ VS पवन नागर का मुकाबला लाइव है। अपना वोट देकर 10 Coins पाएं!',
      time: '10 मिनट पहले',
      link: '/battle',
      unread: true,
    },
    {
      id: '2',
      title: '🎁 डेली चेक-इन उपलब्ध है',
      desc: 'आज का चेक-इन पूरा करें और अपने फ्री Dhoti Coins क्लेम करें।',
      time: '1 घंटा पहले',
      link: '/rewards',
      unread: true,
    },
    {
      id: '3',
      title: '📰 ढोटी कृषि एवं मौसम अपडेट',
      desc: 'इस सप्ताह हाड़ौती क्षेत्र में मौसम पूर्वानुमान और फसलों के लिए सलाह।',
      time: '3 घंटे पहले',
      link: '/news',
      unread: false,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#05070D]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all">
                <div className="w-full h-full bg-[#070B14] rounded-[10px] flex items-center justify-center overflow-hidden">
                  <span className="font-hindi-head text-cyan-400 text-lg sm:text-xl font-black">
                    ढो
                  </span>
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md -z-10 group-hover:bg-cyan-400/40 transition-all" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    DHOTI <span className="text-cyan-400">AALE</span>
                  </span>
                  <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    देसी
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:block font-medium truncate max-w-[240px]">
                  ढोटी गांव का डिजिटल मंच
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              href="/news"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith('/news')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              News
            </Link>
            <Link
              href="/battle"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/battle'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Battle
            </Link>
            <Link
              href="/chat"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/chat'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              चौपाल Chat
            </Link>
            <Link
              href="/ai"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/ai'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Dhoti AI
            </Link>
            <Link
              href="/rewards"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/rewards'
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Rewards
            </Link>
            <Link
              href="/tools"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith('/tools')
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              20+ Tools
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-semibold"
              >
                Admin 👑
              </Link>
            )}
          </nav>

          {/* Right Header Actions: Coins, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Shortcut Button (Mobile) */}
            <Link
              href="/ai"
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:scale-105 active:scale-95 transition-all"
              title="Dhoti Aale AI"
            >
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            </Link>

            {/* Dhoti Coins Badge */}
            <Link
              href="/rewards"
              className="group flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-all hover:shadow-lg hover:shadow-amber-500/10 active:scale-95"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm">
                🪙
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-xs sm:text-sm text-amber-300 font-mono tracking-tight">
                  {coins.toLocaleString()}
                </span>
                <span className="text-[10px] font-medium text-amber-400/80 hidden xs:inline">
                  Coins
                </span>
              </div>
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#05070D] animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#05070D]" />
            </button>

            {/* Profile Avatar or Login Button */}
            {currentUser ? (
              <Link
                href="/profile"
                className="relative group flex items-center gap-2 p-0.5 rounded-full ring-2 ring-cyan-500/30 hover:ring-cyan-400 transition-all active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-slate-800 relative">
                  <img
                    src={
                      currentUser.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                        currentUser.id
                      )}`
                    }
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#05070D]" />
              </Link>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>लॉगिन</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#0B1220] border border-white/10 shadow-2xl overflow-hidden mt-12 sm:mt-8">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base font-hindi">
                  सूचनाएं (Notifications)
                </h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
              {notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setShowNotifications(false)}
                  className={`block p-3 rounded-xl border transition-all ${
                    item.unread
                      ? 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>

            <div className="p-3 border-t border-white/10 bg-[#070B14] flex justify-between items-center text-xs text-slate-400">
              <span>गाँव ढोटी लाइव अलर्ट</span>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-cyan-400 hover:underline"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
