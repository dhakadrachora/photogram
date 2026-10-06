'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Newspaper,
  MessageSquare,
  Swords,
  Bot,
  Users,
  Bell,
  Trophy,
  ChevronRight,
  Megaphone,
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Share2,
  Crown,
  Compass,
  Phone,
  MapPin,
  Building,
  UserCheck,
  Headphones,
  Gift,
  Copy,
  Check,
  LogIn,
} from 'lucide-react';
import { User, AppTab, NewsItem, CommunityUpdate, PresenceUser } from '@/types';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';
import { PWAInstallButton } from './PWAInstallButton';
import { NewsReaderModal } from './NewsReaderModal';
import { AdBanner } from './AdBanner';

interface LandingPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: AppTab) => void;
  onOpenAuth: () => void;
  onOpenEarnCoins?: () => void;
}

export function LandingPage({ currentUser, onNavigateTab, onOpenAuth, onOpenEarnCoins }: LandingPageProps) {
  const isAdmin = isSiteAdmin(currentUser?.email);

  // Modals for interactive cards
  const [activeModal, setActiveModal] = useState<'news' | 'people' | 'updates' | null>(null);

  // Dynamic news / announcements
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedNewsForReader, setSelectedNewsForReader] = useState<NewsItem | null>(null);
  const [copiedNewsId, setCopiedNewsId] = useState<string | null>(null);
  const [updatesList, setUpdatesList] = useState<CommunityUpdate[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const onlineCount = onlineUsers.length;

  const handleShareNewsWhatsApp = (item: NewsItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/news?id=${encodeURIComponent(item.id)}`;
    const cleanExcerpt = (item.excerpt || item.content || '')
      .replace(/[#*`_]/g, '')
      .slice(0, 140)
      .trim();
    const text = `📰 *${item.title}*\n\n${cleanExcerpt}...\n\n👉 पूरी खबर यहाँ पढ़ें:\n${shareUrl}\n\n_DHOTI AALE - राजस्थान का डिजिटल ग्राम मंच_`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyNewsLink = async (item: NewsItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/news?id=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-999999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopiedNewsId(item.id);
      setTimeout(() => setCopiedNewsId(null), 2200);
    } catch {
      setCopiedNewsId(item.id);
      setTimeout(() => setCopiedNewsId(null), 2200);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    let presenceTimer: ReturnType<typeof setInterval> | null = null;

    async function loadData() {
      try {
        const res = await fetch('/api/content?type=all', { cache: 'no-store' });
        const data = await res.json();
        if (isSubscribed && data) {
          if (Array.isArray(data.news)) setNewsList(data.news);
          if (Array.isArray(data.updates)) setUpdatesList(data.updates);
        }
      } catch (e) {
        console.warn('Could not load content', e);
      }
    }

    let isPresenceLoading = false;

    async function loadPresence() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      if (isPresenceLoading) return;
      isPresenceLoading = true;
      try {
        const res = await fetch('/api/presence', {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);
        if (isSubscribed && res.ok && Array.isArray(data?.users)) {
          setOnlineUsers(data.users);
        }
      } catch (e) {
        console.warn('Could not load online users', e);
      } finally {
        isPresenceLoading = false;
      }
    }

    void loadData();
    void loadPresence();

    // Refresh presence periodically only when visible
    presenceTimer = setInterval(() => void loadPresence(), 15000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && isSubscribed) {
        void loadPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      if (presenceTimer) clearInterval(presenceTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Only real active users are shown. No hard-coded resident names.
  const visiblePeople = onlineUsers.filter(
    (person) => person.userId !== 'dhoti_aale_ai_official'
  );

  return (
    <div className="w-full flex flex-col bg-[#06090f] text-slate-100 antialiased selection:bg-amber-500/30 min-h-screen">
      {/* BEGIN: TopBar Header */}
      <header
        className="w-full pt-3 px-4 sm:px-6 pb-2.5 flex items-center justify-between z-30 bg-slate-950/90 backdrop-blur-xl sticky top-0 border-b border-amber-500/20 shadow-2xl shadow-black/60"
        data-purpose="header-bar"
      >
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0 text-center select-none" data-purpose="brand-logo">
            {/* Official DHOTI AALE App Logo */}
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-amber-400/60 shadow-lg shrink-0 bg-slate-900 ring-2 ring-amber-500/25">
              <img src="/app-logo.png" alt="DHOTI AALE" className="w-full h-full object-cover" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="tracking-widest text-base font-black uppercase bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                DHOTI AALE
              </span>
              <span className="text-[10px] tracking-[0.2em] text-amber-400/90 font-bold uppercase mt-0.5">
                डिजिटल गाँव पोर्टल 👑
              </span>
            </div>
          </div>

          {/* Right Header Actions: Install Button + User Profile / Login */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
            {/* Earn Coins with Rewarded Ad Button */}
            <button
              type="button"
              id="landing-earn-coins-btn"
              onClick={() => {
                SoundEffects.playTap();
                onOpenEarnCoins?.();
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] font-black shadow-md shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
              title="विज्ञापन देखकर 50 सिक्के कमाएँ"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>+50 Coins</span>
            </button>

            <PWAInstallButton variant="header" />
            {!currentUser ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
                title="लॉगिन करें"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold">लॉगिन</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <a
                    href="/admin"
                    id="landing-admin-btn"
                    className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm transition-transform active:scale-95"
                    title="Admin Control Center"
                  >
                    <span>👑 Admin</span>
                  </a>
                )}
                <div
                  onClick={() => onNavigateTab('profile')}
                  className="flex items-center gap-1.5 cursor-pointer bg-slate-900 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300 shadow-sm hover:border-amber-400/60"
                >
                  <span className="max-w-[80px] truncate text-[11px]">{currentUser.name}</span>
                  {isAdmin && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* END: TopBar */}

      {/* BEGIN: HeroSection */}
      <section
        className="w-full bg-gradient-to-b from-slate-950 via-[#180e07] to-stone-900 pt-6 pb-10 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center text-center text-white"
        data-purpose="hero-banner"
      >
        {/* Ambient Lights */}
        <div className="absolute -right-12 top-0 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 bottom-0 w-72 h-72 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

        {/* Main Badge & Headline */}
        <div className="relative z-10 max-w-xl mt-1 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>राजस्थान का #1 डिजिटल गाँव समुदाय 👑</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            ढोटी की अपनी <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              डिजिटल पहचान
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium px-2 leading-relaxed max-w-md mx-auto">
            गाँव चौपाल वर्ल्ड चैट, लाइव फोटो बैटल और ताज़ा समाचार — राजस्थान की संस्कृति डिजिटल युग में।
          </p>
        </div>

        {/* Action CTAs */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-xl flex flex-col sm:flex-row items-center justify-center gap-3 mt-6" data-purpose="cta-buttons">
          {/* Battle CTA */}
          <button
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('battle');
            }}
            id="hero-play-battle-btn"
            className="w-full sm:w-auto flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] transition-all text-slate-950 rounded-full font-black text-xs tracking-wide shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <Swords className="h-4 w-4" />
            <span>लाइव फोटो बैटल खेलें</span>
          </button>

          {/* App Install CTA */}
          <PWAInstallButton variant="hero" />

          {/* World Chat CTA */}
          <button
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('worldchat');
            }}
            id="hero-world-chat-btn"
            className="w-full sm:w-auto flex-1 py-3 px-5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 hover:border-amber-500/40 active:scale-[0.98] transition-all text-white rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <span>गाँव चौपाल चैट</span>
          </button>
        </div>

        {/* Featured Village Portrait Showcase Banner */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mt-6 rounded-3xl overflow-hidden border border-amber-500/40 shadow-2xl shadow-amber-500/10 group">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-slate-900">
            <img
              src="/dhoti-splash.jpg"
              alt="ढोटी आले - गाँव चौपाल व संस्कृति"
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/90 text-slate-950 font-black text-[10px] uppercase tracking-wider mb-1">
                मेरा गाँव • मेरा गौरव 🚩
              </span>
              <p className="text-xs font-bold text-white leading-tight">
                ढोटी गांव की खबरें, लोग, जानकारी और गतिविधियां एक जगह।
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* END: HeroSection */}

      {/* BEGIN: VillageCommunityFeaturesGrid */}
      <main id="features-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 -mt-3 z-10" data-purpose="features-navigation">
        {/* Sleek Rewards & Free Views Teaser Banner */}
        <div
          id="rewards-teaser-banner"
          onClick={() => {
            SoundEffects.playTap();
            onNavigateTab('rewards');
          }}
          className="mb-4 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-[1px] shadow-lg shadow-purple-950/30 cursor-pointer transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/90 px-4 py-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 font-black shadow-md">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-white">
                    🎁 100 Free Instagram Reels Views
                  </span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    मुफ़्त
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  हर 3 घंटे में रील्स लिंक डालें और फ्री व्यूज बूस्ट पाएं
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform">
              <span className="hidden sm:inline">Claim Karein</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Watch Ad & Earn 50 Coins Quick Banner */}
        <div
          id="earn-coins-teaser-card"
          onClick={() => {
            SoundEffects.playTap();
            onOpenEarnCoins?.();
          }}
          className="mb-4 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-[1.5px] shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md font-black">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-amber-300">
                    🎁 विज्ञापन देखें और +50 धोती सिक्के पाएं!
                  </span>
                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[9px] font-bold text-amber-300 animate-pulse">
                    Rewarded Video Ad
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  छोटा 15-सेकंड विज्ञापन देखें और अपनी प्रोफाइल व बैटल के लिए सिक्के तुरंत कमाएं
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <span>ऐड देखें</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* In-feed AdBanner for Monetization */}
        <AdBanner slot="4567890123" className="mb-5 shadow-xs" label="प्रायोजित / Sponsored by Google" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
          {/* CARD 1: News / ताज़ा समाचार */}
          <article
            id="feature-card-news"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('news');
            }}
            className="glass-premium rounded-2xl p-4 shadow-xl hover:border-amber-500/40 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-news"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-110 transition-transform">
                <Newspaper className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-white text-sm">News</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">ताज़ा</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-2">
                {newsList.length > 0 ? newsList[0].title : 'ढोटी पंचायत विकास कार्य एवं मुख्य समाचार...'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-[10px] text-amber-400/90 font-medium">
                {newsList.length > 0 ? `${newsList.length} खबरें • पढ़ें` : 'आज के मुख्य बिंदु'}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>

          {/* CARD 2: World Chat / गाँव चौपाल */}
          <article
            id="feature-card-chat"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('worldchat');
            }}
            className="glass-premium rounded-2xl p-4 shadow-xl hover:border-emerald-500/40 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-chat"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white text-sm">World Chat</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> लाइव
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                गाँव चौपाल चर्चा व देसी संदेश
              </p>
            </div>
            {/* User Profile Avatars Cluster */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                {visiblePeople.slice(0, 3).map((person) => (
                  <div key={person.userId} className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 overflow-hidden text-[10px] flex items-center justify-center font-bold text-amber-300" title={person.userName}>
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      person.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </article>

          {/* CARD 3: Battle / मुकाबला */}
          <article
            id="feature-card-battle"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('battle');
            }}
            className="glass-premium rounded-2xl p-4 shadow-xl hover:border-amber-500/40 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-battle"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5 group-hover:scale-110 transition-transform">
                <Swords className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-white text-sm">Battle Arena</h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                गाँव प्रश्नोत्तरी व ज्ञान मुकाबला
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">क्विज़ चैलेंज</span>
              <Trophy className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
          </article>

          {/* CARD 4: AI Assistant */}
          <article
            id="feature-card-ai"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('assistant');
            }}
            className="glass-premium border-amber-500/30 rounded-2xl p-4 shadow-xl hover:border-amber-400 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-ai"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-2.5 group-hover:scale-110 transition-transform">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white text-sm">DHOTI AI</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">वॉइस</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                &ldquo;राम राम भाईसाहब!&rdquo; अखाड़ा और सरकारी ताज़ा अपडेट्स
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-amber-300 font-bold">🎙️ देसी AI वॉइस</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
          </article>

          {/* CARD 5: People */}
          <article
            id="feature-card-people"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('people');
            }}
            className="glass-premium rounded-2xl p-4 shadow-xl hover:border-purple-500/40 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-people"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2.5 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-white text-sm">People</h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                गाँव के निवासी व प्रवासी संपर्क
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center -space-x-1.5">
                {visiblePeople.slice(0, 3).map((person) => (
                  <div
                    key={person.userId}
                    className="relative w-5 h-5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-[9px] font-bold text-purple-300"
                    title={person.userName}
                  >
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      person.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{onlineCount} ऑनलाइन</span>
            </div>
          </article>

          {/* CARD 6: Latest Updates */}
          <article
            id="feature-card-updates"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('updates');
            }}
            className="glass-premium rounded-2xl p-4 shadow-xl hover:border-rose-500/40 active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            data-purpose="feature-updates"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2.5 relative group-hover:scale-110 transition-transform">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </div>
              <h2 className="font-bold text-white text-sm">Updates</h2>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                सरकारी घोषणाएं व गाँव आयोजन
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">नया नोटिस</span>
              <Megaphone className="h-3.5 w-3.5 text-rose-400" />
            </div>
          </article>
        </div>

        {/* Community Pride Banner */}
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/30 p-3.5 text-center">
          <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>आपणो ढोटी गाँव - एक कदम डिजिटल विकास री ओर</span>
          </div>
          <p className="text-[11px] text-slate-400 font-hindi mt-1">
            गाँव चौपाल, प्रतियोगिता और एआई मददगार के साथ अपनी आवाज को मंच दें।
          </p>
        </div>

        {/* Support Helpdesk Link Banner */}
        <div 
          onClick={() => {
            SoundEffects.playTap();
            onNavigateTab('support');
          }}
          className="mt-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 p-3.5 flex items-center justify-between cursor-pointer hover:border-amber-500/60 hover:bg-slate-800/90 transition-all shadow-xl group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                <span>सहायता व समाधान केंद्र (24/7 Support)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live Chat</span>
              </div>
              <p className="text-[11px] text-slate-400 font-hindi">
                कोई समस्या, सिक्के की दिक्कत या सवाल? सीधा एडमिन से चैट करें।
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* =========================================================
            SEMANTIC SEO & KNOWLEDGE BASE SECTION (CRAWLABLE CONTENT)
            ========================================================= */}
        <section aria-label="DHOTI AALE डिजिटल गाँव जानकारी एवं विशेषताएँ" className="mt-8 pt-6 border-t border-white/10 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>राजस्थान का #1 डिजिटल गाँव मंच</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              DHOTI AALE (ढोटी आले) - डिजिटल पहचान, मुकाबला और चौपाल
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
              ढोटी गाँव (राजस्थान) का आधुनिक वेब पोर्टल जहाँ ग्रामीण संस्कृति, युवा प्रतिभा और आर्टिफिशियल इंटेलिजेंस (AI) एक साथ जुड़ते हैं।
            </p>
          </div>

          {/* 4 Feature Deep-Dives for SEO Crawlers & Visitors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* Feature 1: Photo Battle */}
            <div 
              onClick={() => {
                SoundEffects.playTap();
                onNavigateTab('battle');
              }}
              className="p-4 rounded-2xl glass-premium border border-white/10 shadow-lg hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  ⚔️
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  लाइव फोटो बैटल एरीना (Photo Battles)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                अपनी सबसे शानदार फोटो अपलोड करें, साथी निवासियों को 1v1 मुकाबले में चुनौती दें और लाइव वोटों के ज़रिए गाँव के चैंपियन बनें। विजेताओं को आकर्षक रिवॉर्ड्स और पहचान दी जाती है।
              </p>
            </div>

            {/* Feature 2: DHOTI AI */}
            <div 
              onClick={() => {
                SoundEffects.playTap();
                onNavigateTab('assistant');
              }}
              className="p-4 rounded-2xl glass-premium border border-white/10 shadow-lg hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  🤖
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  DHOTI AALE AI वॉइस असिस्टेंट
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                गाँव का अपना बुद्धिमान डिजिटल साथी जो हिंदी, अंग्रेजी और राजस्थानी में आपकी बात समझता है। गाँव की जानकारी, मुकाबले की स्थिति और सरकारी योजनाओं की सहायता एक आवाज़ में प्राप्त करें।
              </p>
            </div>

            {/* Feature 3: World Chat Choupal */}
            <div 
              onClick={() => {
                SoundEffects.playTap();
                onNavigateTab('worldchat');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-sky-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  💬
                </div>
                <h3 className="text-sm font-bold text-stone-900 group-hover:text-sky-700 transition-colors">
                  24/7 गाँव चौपाल (World Chat)
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                देश-विदेश में बसे ढोटी निवासियों के साथ 24 घंटे लाइव गपशप, त्यौहारों की बधाइयाँ और देसी स्टिकर्स का आनंद लें। सुरक्षित और मॉडरेटेड चौपाल मंच।
              </p>
            </div>

            {/* Feature 4: Resident Directory & Blue Tick */}
            <div 
              onClick={() => {
                SoundEffects.playTap();
                onNavigateTab('profile');
              }}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  👑
                </div>
                <h3 className="text-sm font-bold text-stone-900 group-hover:text-purple-700 transition-colors">
                  निवासी डायरेक्टरी व ब्लू टिक (Verified Residents)
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                गाँव के प्रतिष्ठित नागरिकों, युवाओं और उद्यमियों की आधिकारिक प्रोफ़ाइल। एडमिन द्वारा प्रमाणित ब्लू टिक (Blue Tick) सम्मान और गाँव में पहचान।
              </p>
            </div>
          </div>

          {/* Quick FAQ Section for Google Snippets */}
          <div className="rounded-2xl bg-stone-100/80 border border-stone-200 p-4 space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <span>❓ अक्सर पूछे जाने वाले सवाल (FAQs)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <details className="group rounded-xl bg-white border border-stone-200 p-3 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-stone-800">
                  <span>DHOTI AALE पोर्टल क्या है?</span>
                  <span className="transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-2 text-stone-600 leading-relaxed">
                  DHOTI AALE (www.dhotiaale.online) राजस्थान के ढोटी गाँव का आधिकारिक डिजिटल समुदाय है, जिसमें फोटो बैटल प्रतियोगिताएं, AI असिस्टेंट, लाइव चौपाल और गाँव की खबरें उपलब्ध हैं।
                </p>
              </details>

              <details className="group rounded-xl bg-white border border-stone-200 p-3 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-stone-800">
                  <span>फोटो बैटल (Photo Battle) में कैसे जीतें?</span>
                  <span className="transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-2 text-stone-600 leading-relaxed">
                  अपनी प्रोफ़ाइल से Battle Arena में फोटो सबमिट करें। गाँव के निवासी और मित्र लाइव वोट करते हैं। सबसे ज्यादा वोट प्राप्त करने वाले प्रतिभागी को इंस्टाग्राम रिवॉर्ड और विजेता प्रमाणपत्र मिलता है।
                </p>
              </details>

              <details className="group rounded-xl bg-white border border-stone-200 p-3 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
                <summary className="flex items-center justify-between font-bold text-stone-800">
                  <span>क्या यह ऐप मोबाइल में बिना डाउनलोड किए चल सकती है?</span>
                  <span className="transition group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-2 text-stone-600 leading-relaxed">
                  हाँ, DHOTI AALE एक Progressive Web App (PWA) है। आप इसे किसी भी ब्राउज़र में चला सकते हैं या &apos;Install App&apos; पर क्लिक करके बिना प्ले स्टोर के सीधे फोन में सेव कर सकते हैं।
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* =========================================================
            PROFESSIONAL FOOTER (GOOGLE ADSENSE & COMPLIANCE VERIFIED)
            ========================================================= */}
        <footer className="mt-12 pt-8 pb-6 border-t border-stone-200/80 text-stone-600 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/app-logo.png" alt="DHOTI AALE" className="w-8 h-8 rounded-xl object-cover border border-amber-400/40" />
              <div>
                <span className="font-black text-stone-900 text-sm tracking-tight block">DHOTI AALE (ढोटी आले)</span>
                <span className="text-[10px] text-stone-500">Rajasthan&apos;s #1 Digital Village Platform</span>
              </div>
            </div>

            {/* Compliance Policy Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
              <Link href="/news" className="text-[#8D2817] font-bold hover:underline">गाँव समाचार (News)</Link>
              <span className="text-stone-300">•</span>
              <Link href="/about" className="hover:text-amber-800 transition-colors">About Us</Link>
              <span className="text-stone-300">•</span>
              <Link href="/privacy-policy" className="hover:text-amber-800 transition-colors">Privacy Policy</Link>
              <span className="text-stone-300">•</span>
              <Link href="/terms" className="hover:text-amber-800 transition-colors">Terms &amp; Conditions</Link>
              <span className="text-stone-300">•</span>
              <Link href="/contact" className="hover:text-amber-800 transition-colors">Contact Us</Link>
              <span className="text-stone-300">•</span>
              <Link href="/support" className="hover:text-amber-800 transition-colors">24/7 Support Desk</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-stone-200/50 text-[11px] text-stone-400">
            <div>
              © {new Date().getFullYear()} DHOTI AALE. Designed &amp; Built for Village Community.
            </div>
            <div>
              <strong>DHOTI AALE Team</strong> | Dhoti, Rajasthan (IN-325001)
            </div>
          </div>
        </footer>
      </main>
      {/* END: VillageCommunityFeaturesGrid */}

      {/* ================= MODAL: NEWS (ताज़ा समाचार) ================= */}
      {activeModal === 'news' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-white border border-stone-200 p-4 sm:p-6 shadow-2xl text-stone-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#8D2817] flex items-center justify-center border border-orange-200">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">ढोटी समाचार (Village News)</h3>
                  <p className="text-[10px] text-stone-500">Panchayat &amp; Village Headlines</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/news"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8D2817] text-xs font-bold transition-colors"
                >
                  <span>सभी समाचार देखें ↗</span>
                </Link>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable News Items */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1">
              {newsList.length > 0 ? (
                newsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNewsForReader(item)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200/90 hover:border-amber-400/80 cursor-pointer transition-all group space-y-2.5"
                  >
                    {/* Featured Image */}
                    {item.imageUrl && (
                      <div className="relative w-full aspect-[16/9] max-h-52 rounded-xl overflow-hidden bg-stone-200 shadow-xs">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-bold text-[#8D2817] px-2 py-0.5 rounded bg-orange-100/80">
                        {item.category}
                      </span>
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('hi-IN') : 'ताज़ा'}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-[#8D2817] transition-colors leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {item.excerpt || item.content?.slice(0, 130)}
                    </p>

                    {/* Action Bar */}
                    <div
                      className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                        स्रोत: {item.author || 'DHOTI AALE'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp Share */}
                        <button
                          onClick={(e) => handleShareNewsWhatsApp(item, e)}
                          title="WhatsApp पर शेयर करें"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                          <span>WhatsApp</span>
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={(e) => handleCopyNewsLink(item, e)}
                          title="लिंक कॉपी करें"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-200 border border-stone-200 text-stone-700 text-[11px] font-semibold transition-colors"
                        >
                          {copiedNewsId === item.id ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedNewsId === item.id ? 'कॉपी!' : 'लिंक'}</span>
                        </button>

                        {/* Read Full */}
                        <button
                          onClick={() => setSelectedNewsForReader(item)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold transition-colors ml-1"
                        >
                          <span>पूरा पढ़ें →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-stone-500 text-xs">
                  ताज़ा समाचार लोड हो रहे हैं...
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-3 shrink-0">
              <Link
                href="/news"
                className="flex-1 py-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#8D2817] font-bold text-xs text-center transition-colors"
              >
                पूर्ण समाचार पोर्टल खोलें (Open /news) ↗
              </Link>
              <button
                onClick={() => setActiveModal(null)}
                className="py-2.5 px-4 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full News Reader Modal */}
      <NewsReaderModal
        isOpen={Boolean(selectedNewsForReader)}
        newsItem={selectedNewsForReader}
        onClose={() => setSelectedNewsForReader(null)}
        allNews={newsList}
        onSelectNews={(item) => setSelectedNewsForReader(item)}
      />

      {/* ================= MODAL: PEOPLE (गाँव डायरेक्टरी) ================= */}
      {activeModal === 'people' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">गाँव निवासी व प्रतिनिधि (People)</h3>
                  <p className="text-[10px] text-stone-500">Community Members & Founders</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-stone-950 font-black flex items-center justify-center text-sm shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-stone-900 truncate">Dhoti Aale AI</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">AI Assistant</span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium">Digital Village AI Assistant</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Online</span>
                  </div>
                </div>
              </div>

              {visiblePeople.map((person) => (
                <div key={person.userId} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 border border-stone-200 shrink-0 flex items-center justify-center">
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt={person.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-stone-700">{person.userName.charAt(0).toUpperCase()}</span>
                    )}
                    <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-900 truncate">{person.userName}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">Online</span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium truncate">{person.userBadge || 'Dhoti Resident'}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>अभी ऑनलाइन</span>
                      {person.isAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                    </div>
                  </div>
                </div>
              ))}

              {visiblePeople.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                  <p className="text-sm font-semibold text-stone-700">अभी कोई दूसरा user online नहीं है</p>
                  <p className="mt-1 text-[11px] text-stone-500">Online होते ही उनका real account name यहाँ दिखेगा.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
            >
              वापस जाएं (Back)
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: LATEST UPDATES (सूचनाएं) ================= */}
      {activeModal === 'updates' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#8D2817] flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">सूचनाएं व नोटिस (Latest Updates)</h3>
                  <p className="text-[10px] text-stone-500">Announcements & Circulars</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {updatesList.length > 0 ? (
                updatesList.map((up) => (
                  <div key={up.id} className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80">
                    <div className="flex items-center justify-between text-[11px] text-rose-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> {up.tag}
                      </span>
                      <span className="text-stone-400">{up.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">{up.title}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{up.summary}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80">
                    <div className="flex items-center justify-between text-[11px] text-rose-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> ग्राम सभा सूचना
                      </span>
                      <span className="text-stone-400">आगामी रविवार</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">विशेष ग्राम सभा बैठक - ढोटी पंचायत भवन</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      आगामी रविवार प्रातः 10:00 बजे ढोटी पंचायत भवन में जल संरक्षण व पक्की नालियों के निर्माण प्रस्ताव हेतु बैठक रखी गई है। सभी ग्रामवासी सादर आमंत्रित हैं।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> विद्युत आपूर्ति सूचना
                      </span>
                      <span className="text-stone-400">कल दोपहर</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">ट्रांसफार्मर मेंटेनेंस कार्य</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      कल दोपहर 1:00 PM से 3:30 PM तक ट्रांसफार्मर मरम्मत कार्य के चलते विद्युत आपूर्ति बाधित रहेगी।
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
            >
              ठीक है (Understood)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
