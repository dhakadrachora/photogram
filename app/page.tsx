'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Newspaper,
  Swords,
  MessageSquare,
  Bot,
  Gift,
  Wrench,
  Users,
  Flame,
  ArrowRight,
  TrendingUp,
  Clock,
  Instagram,
  CheckCircle2,
  Share2,
  Calendar,
  Eye,
  RefreshCw,
  Zap,
  ShieldCheck,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { NewsCard } from '@/components/NewsCard';
import { NewsReaderModal } from '@/components/NewsReaderModal';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';
import { NewsItem } from '@/types';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

interface ActiveBattle {
  id: string;
  title: string;
  category: string;
  optionA: { id: string; label: string; votes: number; imageUrl?: string };
  optionB: { id: string; label: string; votes: number; imageUrl?: string };
  totalVotes: number;
  userVotedOptionId?: string;
  isEnded: boolean;
}

export default function HomePage() {
  const { currentUser, openAuthModal, openEarnCoinsModal, refreshCoins } = useAuth();

  // News State
  const [latestNews, setLatestNews] = useState<NewsItem[]>(VIRAL_30_NEWS.slice(0, 3));
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  // Live Battle Spotlight State
  const [featuredBattle, setFeaturedBattle] = useState<ActiveBattle | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  // Community Presence State
  const [onlineCount, setOnlineCount] = useState<number>(1248);

  // Reels Booster Promo Countdown
  const [boostCountdown, setBoostCountdown] = useState<string>('02:45:18');

  // Load latest news
  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const res = await fetch('/api/content?type=news', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.news) && data.news.length > 0) {
          setLatestNews(data.news.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not fetch latest news, using default fallback', err);
      }
    };

    fetchLatestNews();
  }, []);

  // Load featured active battle
  useEffect(() => {
    const fetchBattle = async () => {
      try {
        const res = await fetch('/api/battles/vote');
        const data = await res.json();
        if (Array.isArray(data.battles) && data.battles.length > 0) {
          const active = data.battles.find((b: any) => !b.isEnded) || data.battles[0];
          setFeaturedBattle(active);
        } else {
          // Default featured battle
          setFeaturedBattle({
            id: 'featured-1',
            title: 'ढोटी का सबसे धाकड़ युवा मुकाबला 2026',
            category: 'गाँव मुकाबला ⚔️',
            totalVotes: 480,
            isEnded: false,
            optionA: {
              id: 'opt-a',
              label: 'रोहित धाकड़ (Rohit)',
              votes: 326,
              imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
            },
            optionB: {
              id: 'opt-b',
              label: 'पवन नागर (Pawan)',
              votes: 154,
              imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
            },
          });
        }
      } catch {
        // Fallback
        setFeaturedBattle({
          id: 'featured-1',
          title: 'ढोटी का सबसे धाकड़ युवा मुकाबला 2026',
          category: 'गाँव मुकाबला ⚔️',
          totalVotes: 480,
          isEnded: false,
          optionA: {
            id: 'opt-a',
            label: 'रोहित धाकड़ (Rohit)',
            votes: 326,
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
          },
          optionB: {
            id: 'opt-b',
            label: 'पवन नागर (Pawan)',
            votes: 154,
            imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
          },
        });
      }
    };

    fetchBattle();
  }, []);

  // Quick vote handler from Home spotlight
  const handleSpotlightVote = async (optionId: string) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!featuredBattle) return;

    setIsVoting(true);
    try {
      const res = await fetch('/api/battles/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
        },
        body: JSON.stringify({
          battleId: featuredBattle.id,
          optionId,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'वोट नहीं हो सका');
      } else {
        setVotedOption(optionId);
        await refreshCoins();
        // Update local counts optimistically
        setFeaturedBattle((prev) => {
          if (!prev) return prev;
          const isA = optionId === prev.optionA.id;
          return {
            ...prev,
            totalVotes: prev.totalVotes + 1,
            userVotedOptionId: optionId,
            optionA: {
              ...prev.optionA,
              votes: isA ? prev.optionA.votes + 1 : prev.optionA.votes,
            },
            optionB: {
              ...prev.optionB,
              votes: !isA ? prev.optionB.votes + 1 : prev.optionB.votes,
            },
          };
        });
      }
    } catch (e: any) {
      alert(e?.message || 'वोटिंग में समस्या आई');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReadArticle = (item: NewsItem) => {
    setSelectedNews(item);
    setIsNewsModalOpen(true);
  };

  const greetingName = currentUser?.name ? currentUser.name.split(' ')[0] : 'गाँव वासी';
  const coins = currentUser?.coins ?? 50;

  return (
    <AppShell>
      {/* 1. TOP GREETING & DASHBOARD HEADER */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-gradient-to-r from-[#0B1220] via-[#0D1726] to-[#070B14] p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl sm:text-2xl animate-bounce">👋</span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-hindi tracking-tight">
                राम-राम सा, <span className="text-cyan-400">{greetingName}!</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-hindi">
              ढोटी गांव के डिजिटल समुदाय में आपका स्वागत है।
            </p>
          </div>

          {/* Quick Balance & Earn */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/rewards"
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-all active:scale-95 shadow-md shadow-amber-500/5"
            >
              <span className="text-lg">🪙</span>
              <div>
                <span className="text-sm font-extrabold text-amber-300 font-mono block leading-none">
                  {coins.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium">Dhoti Coins</span>
              </div>
            </Link>

            <button
              onClick={openEarnCoinsModal}
              className="px-3.5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>कमाएं</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden mb-8 border border-white/10 bg-[#0B1220] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>100% असली देसी गाँव मंच</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white font-hindi tracking-tight leading-snug">
            ढोटी की हर खबर, हर आवाज़ और हर पहचान{' '}
            <span className="neon-text-gradient">एक जगह।</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-hindi leading-relaxed">
            राजस्थान के ढोटी गाँव का अपना डिजिटल केंद्र। यहाँ देखें लाइव फोटो बैटल, गाँव चौपाल की चर्चाएं, ताज़ा खबरें, और देसी AI असिस्टेंट से बात करें।
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/battle"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Swords className="w-4 h-4" />
              <span>लाइव बैटल अखाड़ा</span>
            </Link>

            <Link
              href="/ai"
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Dhoti AI साथी</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTION GRID (6 Vibrant rounded cards) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white font-hindi flex items-center gap-2">
            <span>त्वरित सेवाएं (Quick Actions)</span>
          </h2>
          <span className="text-xs text-slate-400">सभी 6 मुख्य खंड</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. News */}
          <Link
            href="/news"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-cyan-500/40 shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              📰
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-cyan-300">
                ताज़ा खबरें
              </h3>
              <span className="text-[10px] text-slate-400">गाँव समाचार</span>
            </div>
          </Link>

          {/* 2. Battle */}
          <Link
            href="/battle"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-red-500/40 shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden"
          >
            <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-red-600 text-white animate-pulse">
              LIVE
            </span>
            <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              ⚔️
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-red-300">
                Battle Arena
              </h3>
              <span className="text-[10px] text-slate-400">फोटो मुकाबला</span>
            </div>
          </Link>

          {/* 3. Chat */}
          <Link
            href="/chat"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-blue-500/40 shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-blue-300">
                गाँव चौपाल
              </h3>
              <span className="text-[10px] text-slate-400">24/7 लाइव चैट</span>
            </div>
          </Link>

          {/* 4. AI */}
          <Link
            href="/ai"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-purple-500/40 shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🎙️
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-purple-300">
                Dhoti AI
              </h3>
              <span className="text-[10px] text-slate-400">देसी वॉइस साथी</span>
            </div>
          </Link>

          {/* 5. Rewards */}
          <Link
            href="/rewards"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-amber-500/40 shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🎁
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-amber-300">
                Rewards & Coins
              </h3>
              <span className="text-[10px] text-slate-400">डेली चेक-इन</span>
            </div>
          </Link>

          {/* 6. Tools */}
          <Link
            href="/tools"
            className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-emerald-500/40 shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
              🛠️
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-hindi group-hover:text-emerald-300">
                20+ Viral Tools
              </h3>
              <span className="text-[10px] text-slate-400">QR, Downloader</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. PROMOTIONAL CARD & COMMUNITY LIVE COUNTER ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Promotional Card: 100 Free Reels Views Booster */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-pink-900/30 via-[#0B1220] to-[#070B14] border border-pink-500/30 p-6 flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                <Instagram className="w-3.5 h-3.5" />
                <span>🎁 100 Free Reels Views Booster</span>
              </span>

              <div className="flex items-center gap-1 text-[11px] font-mono text-pink-300 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                <Clock className="w-3 h-3" />
                <span>{boostCountdown}</span>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white font-hindi mb-2">
              हर 3 घंटे में अपना फ्री Boost Claim करें
            </h3>

            <p className="text-xs text-slate-300 font-hindi leading-relaxed mb-4">
              अपनी किसी भी इंस्टाग्राम रील का लिंक डालें और 100% असली व्यूज बूस्ट तुरंत हासिल करें।
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-emerald-400">
                बूस्टर एक्टिव है (Active)
              </span>
            </div>

            <Link
              href="/rewards"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all active:scale-95"
            >
              Claim Now →
            </Link>
          </div>
        </div>

        {/* Community Live Counter */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#0D1726] to-[#070B14] border border-white/10 p-6 flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Users className="w-3.5 h-3.5" />
                <span>गांव के सदस्य</span>
              </span>

              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>100% Real Time</span>
              </span>
            </div>

            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight block">
                {onlineCount.toLocaleString()} Active Users
              </span>
              <span className="text-xs text-slate-400 font-hindi">
                वर्तमान में ढोटी गाँव मंच पर सक्रिय ग्रामीण व युवा
              </span>
            </div>

            {/* Avatars Row */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex -space-x-2">
                {[
                  'dhoti-king',
                  'pawan-nagar',
                  'rohit-dhakad',
                  'kisan-veer',
                  'desi-bot',
                ].map((seed, i) => (
                  <img
                    key={i}
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-[#0B1220] bg-slate-800"
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                +1,240 अन्य सदस्य चौपाल में
              </span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-slate-400">24/7 लाइव चौपाल खुली है</span>
            <Link href="/chat" className="text-cyan-400 hover:underline font-semibold">
              बातचीत में शामिल हों →
            </Link>
          </div>
        </div>
      </div>

      {/* 5. LIVE BATTLE SPOTLIGHT */}
      {featuredBattle && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h2 className="text-lg sm:text-xl font-bold text-white font-hindi">
                लाइव फोटो मुकाबला (Featured Battle)
              </h2>
            </div>
            <Link
              href="/battle"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              सभी बैटल देखें →
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <span className="text-sm sm:text-base font-bold text-white font-hindi">
                {featuredBattle.title}
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                🪙 10 Coins प्रति वोट
              </span>
            </div>

            {/* 1v1 Arena */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 relative">
              {/* Option A */}
              <div className="rounded-2xl bg-[#0D1726] border border-white/10 p-3 sm:p-4 text-center space-y-2">
                <div className="relative aspect-square max-h-48 w-full rounded-xl overflow-hidden bg-black mx-auto">
                  {featuredBattle.optionA.imageUrl ? (
                    <img
                      src={featuredBattle.optionA.imageUrl}
                      alt={featuredBattle.optionA.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      👑
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/80 text-cyan-400">
                    {Math.round(
                      (featuredBattle.optionA.votes / (featuredBattle.totalVotes || 1)) * 100
                    )}
                    %
                  </div>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-white truncate font-hindi">
                  {featuredBattle.optionA.label}
                </h4>

                <button
                  onClick={() => handleSpotlightVote(featuredBattle.optionA.id)}
                  disabled={isVoting || Boolean(votedOption)}
                  className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    votedOption === featuredBattle.optionA.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
                  }`}
                >
                  {votedOption === featuredBattle.optionA.id ? 'वोट दिया ✅' : 'Vote Now'}
                </button>
              </div>

              {/* VS Badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#05070D] border border-red-500 text-red-400 font-black text-xs sm:text-sm shadow-xl">
                VS
              </div>

              {/* Option B */}
              <div className="rounded-2xl bg-[#0D1726] border border-white/10 p-3 sm:p-4 text-center space-y-2">
                <div className="relative aspect-square max-h-48 w-full rounded-xl overflow-hidden bg-black mx-auto">
                  {featuredBattle.optionB.imageUrl ? (
                    <img
                      src={featuredBattle.optionB.imageUrl}
                      alt={featuredBattle.optionB.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      ⚡
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/80 text-purple-400">
                    {Math.round(
                      (featuredBattle.optionB.votes / (featuredBattle.totalVotes || 1)) * 100
                    )}
                    %
                  </div>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-white truncate font-hindi">
                  {featuredBattle.optionB.label}
                </h4>

                <button
                  onClick={() => handleSpotlightVote(featuredBattle.optionB.id)}
                  disabled={isVoting || Boolean(votedOption)}
                  className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    votedOption === featuredBattle.optionB.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-md shadow-purple-500/20 active:scale-95'
                  }`}
                >
                  {votedOption === featuredBattle.optionB.id ? 'वोट दिया ✅' : 'Vote Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. NEWS SECTION ("ताज़ा खबरें") */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white font-hindi flex items-center gap-2">
              <span>ताज़ा खबरें</span>
            </h2>
            <span className="text-xs text-slate-400 font-hindi">
              गाँव ढोटी और हाड़ौती की प्रमुख सुर्खियां
            </span>
          </div>

          <Link
            href="/news"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
          >
            <span>सभी खबरें</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 3 News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {latestNews.map((item) => (
            <NewsCard key={item.id} item={item} onRead={handleReadArticle} />
          ))}
        </div>
      </div>

      {/* 7. PWA Install Banner */}
      <div className="mt-8">
        <PWAInstallBanner />
      </div>

      {/* News Reader Modal */}
      <NewsReaderModal
        newsItem={selectedNews}
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        allNews={latestNews}
        onSelectNews={(next) => setSelectedNews(next)}
      />
    </AppShell>
  );
}