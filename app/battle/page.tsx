'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Swords,
  Trophy,
  Crown,
  Flame,
  Clock,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  Users,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';

interface BattleOption {
  id: string;
  label: string;
  tagline?: string;
  votes: number;
  emoji?: string;
  imageUrl?: string;
}

interface Battle {
  id: string;
  title: string;
  category: string;
  description?: string;
  optionA: BattleOption;
  optionB: BattleOption;
  startsAt?: number;
  endsAt?: number;
  isEnded: boolean;
  status: 'active' | 'closed';
  published: boolean;
  userVotedOptionId?: string;
  totalVotes: number;
  winnerOptionId?: string;
  isDraw?: boolean;
}

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  votes: number;
  wins: number;
  coins: number;
  badge: string;
}

const DEFAULT_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    id: '1',
    name: 'रोहित धाकड़ (Dhakad)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-dhakad',
    votes: 1840,
    wins: 14,
    coins: 2450,
    badge: 'ढोटी चैंपियन 👑',
  },
  {
    rank: 2,
    id: '2',
    name: 'पवन नागर (Pawan)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pawan-nagar',
    votes: 1520,
    wins: 11,
    coins: 1980,
    badge: 'गाँव का शेर 🏅',
  },
  {
    rank: 3,
    id: '3',
    name: 'दिनेश कुमावत (Dinesh)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dinesh-kumawat',
    votes: 1290,
    wins: 9,
    coins: 1620,
    badge: 'रैप उस्ताद 🎤',
  },
  {
    rank: 4,
    id: '4',
    name: 'सुरेश गुर्जर (Suresh)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=suresh-gurjar',
    votes: 980,
    wins: 7,
    coins: 1250,
    badge: 'देसी रॉकर ⚡',
  },
  {
    rank: 5,
    id: '5',
    name: 'मुकेश मीणा (Mukesh)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=mukesh-meena',
    votes: 740,
    wins: 5,
    coins: 920,
    badge: 'सरपंच साहब 🎖️',
  },
];

export default function BattlePage() {
  const { currentUser, openAuthModal, refreshCoins } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'leaderboard' | 'winners'>('active');
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteSuccessMsg, setVoteSuccessMsg] = useState<string | null>(null);

  const effectiveEmail = currentUser?.email || null;

  const loadBattles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = effectiveEmail
        ? `/api/battles/vote?email=${encodeURIComponent(effectiveEmail)}`
        : '/api/battles/vote';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveEmail ? { 'x-user-email': effectiveEmail } : {}),
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Battle request failed: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.battles) && data.battles.length > 0) {
        setBattles(data.battles);
      } else {
        // Fallback default featured mock battle if database is empty
        setBattles([
          {
            id: 'featured-1',
            title: 'ढोटी का सबसे धाकड़ युवा मुकाबला 2026',
            category: 'गाँव मुकाबला ⚔️',
            description: 'रोहित धाकड़ VS पवन नागर - लाइव वोट करें और गाँव का किंग चुनें!',
            isEnded: false,
            status: 'active',
            published: true,
            totalVotes: 480,
            optionA: {
              id: 'opt-a',
              label: 'रोहित धाकड़ (Rohit)',
              tagline: 'टीम धाकड़ • ढोटी यूथ आइकन',
              votes: 326,
              imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
            },
            optionB: {
              id: 'opt-b',
              label: 'पवन नागर (Pawan)',
              tagline: 'टीम नागर • ढोटी खेल प्रमुख',
              votes: 154,
              imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
            },
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Could not load battles from server, using fallback', err);
      setError(err?.message || 'बैटल डेटा लोड नहीं हो सका');
    } finally {
      setLoading(false);
    }
  }, [effectiveEmail]);

  useEffect(() => {
    loadBattles();
  }, [loadBattles]);

  const handleVote = async (battleId: string, optionId: string) => {
    if (!currentUser || !effectiveEmail) {
      openAuthModal();
      return;
    }

    try {
      setVotingId(battleId);
      setVoteSuccessMsg(null);

      const response = await fetch('/api/battles/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': effectiveEmail,
        },
        body: JSON.stringify({ battleId, optionId, userEmail: effectiveEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ALREADY_VOTED') {
          alert('साहब, आप इस बैटल में पहले ही वोट कर चुके हैं!');
        } else if (data.code === 'BATTLE_ENDED') {
          alert('यह बैटल समाप्त हो चुकी है!');
        } else {
          alert(data.error || 'वोट करने में समस्या आई।');
        }
        await loadBattles();
        return;
      }

      setVoteSuccessMsg('🎉 आपका वोट सफलतापूर्वक दर्ज हो गया! +10 Dhoti Coins अर्जित किए गए!');
      await refreshCoins();
      await loadBattles();
      setTimeout(() => setVoteSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'वोट विफल रहा');
    } finally {
      setVotingId(null);
    }
  };

  const handleShareBattle = (battle: Battle) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/battle`;
    const text = `⚔️ *DHOTI AALE BATTLE ARENA*\n\n*${battle.title}*\n${battle.optionA.label} VS ${battle.optionB.label}\n\n👉 अभी अपना वोट दें:\n${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const activeBattles = battles.filter((b) => !b.isEnded);
  const endedBattles = battles.filter((b) => b.isEnded);

  return (
    <AppShell>
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-[#0B1220] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>राजस्थान का #1 डिजिटल फोटो अखाड़ा</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-hindi leading-tight mb-2">
              ⚔️ Battle Arena
            </h1>

            <p className="text-sm text-slate-300 font-hindi max-w-xl">
              गाँव के धाकड़ युवाओं के बीच लाइव 1v1 मुकाबला। अपना वोट दें, परिणाम तय करें और Dhoti Coins जीतें!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadBattles}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>रिफ्रेश</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {voteSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-hindi flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{voteSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Active Battles ({activeBattles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'winners'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Winners ({endedBattles.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Battles */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeBattles.length > 0 ? (
            activeBattles.map((battle) => {
              const total = battle.totalVotes || (battle.optionA.votes + battle.optionB.votes) || 0;
              const aVotes = battle.optionA.votes || 0;
              const bVotes = battle.optionB.votes || 0;
              const aPct = total > 0 ? Math.round((aVotes / total) * 100) : 50;
              const bPct = total > 0 ? 100 - aPct : 50;
              const hasVoted = Boolean(battle.userVotedOptionId);
              const userVotedA = battle.userVotedOptionId === battle.optionA.id;
              const userVotedB = battle.userVotedOptionId === battle.optionB.id;

              return (
                <div
                  key={battle.id}
                  className="rounded-3xl bg-[#0B1220] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md"
                >
                  {/* Battle Header */}
                  <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#070B14]/60">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        LIVE VOTE
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {battle.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Users className="w-3.5 h-3.5" />
                        <span>{total.toLocaleString()} कुल वोट</span>
                      </div>
                      <button
                        onClick={() => handleShareBattle(battle)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
                        title="व्हाट्सएप पर शेयर करें"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Battle Title */}
                  <div className="px-5 pt-4">
                    <h2 className="text-lg sm:text-xl font-bold text-white font-hindi">
                      {battle.title}
                    </h2>
                    {battle.description && (
                      <p className="text-xs text-slate-400 font-hindi mt-1">
                        {battle.description}
                      </p>
                    )}
                  </div>

                  {/* Main 1v1 Battle Arena Grid */}
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative">
                    {/* VS Center Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[#05070D] border-2 border-red-500 text-red-400 font-black text-sm shadow-xl shadow-red-500/30">
                      VS
                    </div>

                    {/* Option A (Left Participant) */}
                    <div
                      className={`relative rounded-2xl overflow-hidden border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                        userVotedA
                          ? 'bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-[#0D1726] border-white/10 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-square max-h-72 w-full rounded-xl overflow-hidden bg-[#070B14]">
                          {battle.optionA.imageUrl ? (
                            <img
                              src={battle.optionA.imageUrl}
                              alt={battle.optionA.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              👑
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-black bg-black/80 text-cyan-400 backdrop-blur-md">
                            {aPct}% Votes
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white font-hindi">
                            {battle.optionA.label}
                          </h3>
                          {battle.optionA.tagline && (
                            <p className="text-xs text-slate-400">
                              {battle.optionA.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vote Button A */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleVote(battle.id, battle.optionA.id)}
                          disabled={hasVoted || votingId === battle.id}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            userVotedA
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                              : hasVoted
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 active:scale-98 shadow-lg shadow-cyan-500/20'
                          }`}
                        >
                          {userVotedA ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>आपने वोट किया ({aVotes})</span>
                            </>
                          ) : hasVoted ? (
                            <span>वोट बंद है ({aVotes})</span>
                          ) : (
                            <>
                              <Swords className="w-4 h-4" />
                              <span>Vote Now for {battle.optionA.label.split(' ')[0]}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Option B (Right Participant) */}
                    <div
                      className={`relative rounded-2xl overflow-hidden border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                        userVotedB
                          ? 'bg-purple-500/10 border-purple-400 shadow-lg shadow-purple-500/20'
                          : 'bg-[#0D1726] border-white/10 hover:border-purple-500/30'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-square max-h-72 w-full rounded-xl overflow-hidden bg-[#070B14]">
                          {battle.optionB.imageUrl ? (
                            <img
                              src={battle.optionB.imageUrl}
                              alt={battle.optionB.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              ⚡
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-black bg-black/80 text-purple-400 backdrop-blur-md">
                            {bPct}% Votes
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white font-hindi">
                            {battle.optionB.label}
                          </h3>
                          {battle.optionB.tagline && (
                            <p className="text-xs text-slate-400">
                              {battle.optionB.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vote Button B */}
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleVote(battle.id, battle.optionB.id)}
                          disabled={hasVoted || votingId === battle.id}
                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            userVotedB
                              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                              : hasVoted
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white active:scale-98 shadow-lg shadow-purple-500/20'
                          }`}
                        >
                          {userVotedB ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>आपने वोट किया ({bVotes})</span>
                            </>
                          ) : hasVoted ? (
                            <span>वोट बंद है ({bVotes})</span>
                          ) : (
                            <>
                              <Swords className="w-4 h-4" />
                              <span>Vote Now for {battle.optionB.label.split(' ')[0]}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Progress Bar */}
                  <div className="px-5 pb-5">
                    <div className="h-3.5 w-full rounded-full bg-[#070B14] overflow-hidden flex p-0.5 border border-white/5">
                      <div
                        style={{ width: `${aPct}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      />
                      <div
                        style={{ width: `${bPct}%` }}
                        className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
                      <span className="text-cyan-400 font-bold">{battle.optionA.label.split(' ')[0]}: {aPct}%</span>
                      <span className="text-purple-400 font-bold">{battle.optionB.label.split(' ')[0]}: {bPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-12 text-center max-w-md mx-auto">
              <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1 font-hindi">
                अभी कोई Battle उपलब्ध नहीं है।
              </h3>
              <p className="text-xs text-slate-400">
                नया मुकाबला जल्द ही शुरू होगा या लीडरबोर्ड देखें।
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-3xl bg-[#0B1220] border border-white/10 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-[#070B14]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base font-hindi">
                गाँव के शीर्ष बैटल चैंपियंस (Top Champions)
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-medium">सीजन 2026</span>
          </div>

          <div className="divide-y divide-white/5">
            {DEFAULT_LEADERBOARD.map((user) => (
              <div
                key={user.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                      user.rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                        : user.rank === 2
                        ? 'bg-slate-300 text-slate-950 font-black'
                        : user.rank === 3
                        ? 'bg-amber-700 text-white font-bold'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {user.rank}
                  </div>

                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-white/10"
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {user.name}
                      </h4>
                      {user.rank === 1 && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span className="text-xs text-cyan-400 font-medium block">
                      {user.badge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-sm sm:text-base font-bold text-white font-mono block">
                      {user.votes.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">वोट</span>
                  </div>
                  <div className="hidden xs:block">
                    <span className="text-sm sm:text-base font-bold text-amber-400 font-mono block">
                      🪙 {user.coins}
                    </span>
                    <span className="text-[10px] text-slate-400">Dhoti Coins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Winners */}
      {activeTab === 'winners' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white font-hindi mb-2 flex items-center gap-2">
              🏆 Battle Winners
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              हाल ही में संपन्न हुए मुकाबलों के विजेता और उन्हें दिए गए पुरस्कार।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0D1726] border border-amber-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-amber-400">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=rohit-dhakad"
                      alt="विजेता"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                      विजेता (Champion)
                    </span>
                    <h4 className="font-bold text-white text-base">रोहित धाकड़</h4>
                  </div>
                </div>
                <div className="text-xs text-slate-300 font-hindi mb-3">
                  मुकाबला: ढोटी यूथ आइकन बैटल 2026
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs">
                  <span className="text-slate-400">कुल वोट: 68% (326)</span>
                  <span className="text-amber-400 font-bold">पुरस्कार: 🪙 500 Coins</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D1726] border border-cyan-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-cyan-400">
                    <img
                      src="https://api.dicebear.com/7.x/bottts/svg?seed=pawan-nagar"
                      alt="विजेता"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block">
                      विजेता (Champion)
                    </span>
                    <h4 className="font-bold text-white text-base">पवन नागर</h4>
                  </div>
                </div>
                <div className="text-xs text-slate-300 font-hindi mb-3">
                  मुकाबला: ढोटी खेल प्रीमियर लीग बैटल
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs">
                  <span className="text-slate-400">कुल वोट: 62% (284)</span>
                  <span className="text-cyan-400 font-bold">पुरस्कार: 🪙 300 Coins</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
