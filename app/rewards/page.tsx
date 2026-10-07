'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Gift,
  Coins,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  ShoppingBag,
  Instagram,
  ShieldCheck,
  Crown,
  Flame,
  ArrowRight,
  Clock,
  Swords,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { InstagramReelsBooster } from '@/components/InstagramReelsBooster';

interface CheckinDay {
  day: number;
  coins: number;
  label: string;
}

const CHECKIN_DAYS: CheckinDay[] = [
  { day: 1, coins: 10, label: 'Day 1' },
  { day: 2, coins: 20, label: 'Day 2' },
  { day: 3, coins: 30, label: 'Day 3' },
  { day: 4, coins: 50, label: 'Day 4' },
  { day: 5, coins: 75, label: 'Day 5' },
  { day: 6, coins: 100, label: 'Day 6' },
  { day: 7, coins: 200, label: 'Day 7 👑' },
];

export default function RewardsPage() {
  const { currentUser, openAuthModal, updateUser, refreshCoins, openEarnCoinsModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkin' | 'store' | 'reels'>('checkin');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(1);
  const [isClaimingCheckin, setIsClaimingCheckin] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const coins = currentUser?.coins ?? 50;

  // Check last check-in date
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const lastCheckinStr = localStorage.getItem('dhoti_last_checkin');
      const streakStr = localStorage.getItem('dhoti_checkin_streak');
      if (streakStr) {
        setCurrentStreak(Number(streakStr) || 1);
      }

      if (lastCheckinStr) {
        const lastDate = new Date(Number(lastCheckinStr)).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
          setIsCheckedInToday(true);
        }
      }
    } catch {}
  }, []);

  const handleDailyCheckin = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (isCheckedInToday) {
      alert('साहब, आज का चेक-इन आप पहले ही क्लेम कर चुके हैं! कल फिर आएं।');
      return;
    }

    setIsClaimingCheckin(true);
    try {
      const todayReward = CHECKIN_DAYS[(currentStreak - 1) % 7]?.coins || 10;

      // Credit via server-side API
      const res = await fetch('/api/coins/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const nextStreak = (currentStreak % 7) + 1;
        setCurrentStreak(nextStreak);
        setIsCheckedInToday(true);
        localStorage.setItem('dhoti_last_checkin', Date.now().toString());
        localStorage.setItem('dhoti_checkin_streak', nextStreak.toString());

        updateUser((prev) => (prev ? { ...prev, coins: (prev.coins || 0) + todayReward } : null));
        await refreshCoins();

        setClaimMessage(`🎉 बधाई हो! +${todayReward} Dhoti Coins आपके खाते में जोड़ दिए गए!`);
        setTimeout(() => setClaimMessage(null), 5000);
      }
    } catch (e: any) {
      alert('चेक-इन में समस्या आई। पुनः प्रयास करें।');
    } finally {
      setIsClaimingCheckin(false);
    }
  };

  const handleStoreRedeem = (itemTitle: string, cost: number) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (coins < cost) {
      alert(`आपके पास पर्याप्त Coins नहीं हैं! (आवश्यक: ${cost}, आपके पास: ${coins})`);
      return;
    }

    alert(`🎉 "${itemTitle}" के लिए आपका अनुरोध दर्ज कर लिया गया है! एडमिन द्वारा सत्यापन के बाद यह सक्रिय हो जाएगा।`);
  };

  return (
    <AppShell>
      {/* Top Header Card */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-gradient-to-br from-[#0B1220] via-[#0D1726] to-[#070B14] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3">
              <Gift className="w-3.5 h-3.5" />
              <span>Dhoti Rewards & Coin Wallet</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white font-hindi tracking-tight mb-2">
              🎁 Rewards & Dhoti Coins
            </h1>

            <p className="text-sm text-slate-300 font-hindi max-w-lg">
              गाँव की गतिविधियों, बैटल में वोटिंग और दैनिक चेक-इन से Coins कमाएं और विशेष उपहार अनलॉक करें।
            </p>
          </div>

          {/* Current Balance Card */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 p-5 min-w-[220px] shadow-xl shadow-amber-500/5">
            <span className="text-xs text-amber-300/80 font-medium block mb-1">
              आपका वर्तमान बैलेंस
            </span>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight text-glow-gold">
                🪙 {coins.toLocaleString()}
              </span>
            </div>
            <button
              onClick={openEarnCoinsModal}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>फ्री Coins कमाएं</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'checkin'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Check-in</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'reels'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Instagram className="w-4 h-4" />
          <span>Reels Views Booster</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'store'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-[#0D1726] text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Reward Store</span>
        </button>
      </div>

      {/* Claim Success Alert */}
      {claimMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-hindi flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{claimMessage}</span>
        </div>
      )}

      {/* Tab 1: Daily Check-in */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-hindi flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>7-Day Daily Check-in Streak</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  लगातार 7 दिन ऐप खोलें और हर दिन बढ़ते हुए Dhoti Coins प्राप्त करें!
                </p>
              </div>

              <button
                onClick={handleDailyCheckin}
                disabled={isCheckedInToday || isClaimingCheckin}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCheckedInToday
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isCheckedInToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>आज का क्लेम पूरा हुआ</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>{isClaimingCheckin ? 'क्लेम हो रहा है...' : 'Daily Check-in Claim करें'}</span>
                  </>
                )}
              </button>
            </div>

            {/* 7-Day Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {CHECKIN_DAYS.map((d) => {
                const isPast = d.day < currentStreak;
                const isCurrent = d.day === currentStreak;

                return (
                  <div
                    key={d.day}
                    className={`rounded-2xl p-4 text-center border transition-all ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20 scale-102 ring-1 ring-amber-400'
                        : isPast
                        ? 'bg-[#0D1726]/60 border-emerald-500/30'
                        : 'bg-[#0D1726] border-white/5 opacity-70'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">
                      {d.label}
                    </span>
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-[#070B14] flex items-center justify-center text-lg border border-white/10">
                      {isPast ? '✅' : isCurrent ? '🎁' : '🪙'}
                    </div>
                    <span className="text-sm font-extrabold text-amber-300 font-mono block">
                      +{d.coins}
                    </span>
                    <span className="text-[10px] text-slate-400">Coins</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reward Activities Card */}
          <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-bold text-white font-hindi mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Coins कमाने की अन्य गतिविधियां (Earn Coins)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/battle"
                className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">
                      बैटल में वोट करें
                    </h4>
                    <span className="text-xs text-slate-400">हर वोट पर +10 Dhoti Coins</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  वोट दें →
                </span>
              </Link>

              <Link
                href="/chat"
                className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">
                      गाँव चौपाल में संदेश भेजें
                    </h4>
                    <span className="text-xs text-slate-400">सक्रिय चर्चा पर +5 Coins</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  जुड़ें →
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reels Booster */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          <InstagramReelsBooster />
        </div>
      )}

      {/* Tab 3: Reward Store */}
      {activeTab === 'store' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white font-hindi mb-2 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <span>Dhoti Reward Store</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              अपने कमाए हुए Dhoti Coins को डिजिटल बैज और विशेष सुविधाओं में बदलें।
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item 1 */}
              <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      लोकप्रिय (Popular)
                    </span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      🪙 500 Coins
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>सत्यापित निवासी ब्लू टिक (Blue Tick)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    आपकी प्रोफ़ाइल और चौपाल संदेशों पर आधिकारिक सत्यापित निवासी का बैज लगेगा।
                  </p>
                </div>
                <button
                  onClick={() => handleStoreRedeem('सत्यापित निवासी ब्लू टिक', 500)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  500 Coins में रिडीम करें
                </button>
              </div>

              {/* Item 2 */}
              <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      रील्स बूस्ट
                    </span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      🪙 200 Coins
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>इंस्टाग्राम रील 500+ व्यूज बूस्ट</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    अपनी किसी भी इंस्टाग्राम रील के लिए प्राथमिकता कतार में व्यूज डिलीवरी।
                  </p>
                </div>
                <button
                  onClick={() => handleStoreRedeem('रील व्यूज बूस्ट', 200)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  200 Coins में रिडीम करें
                </button>
              </div>

              {/* Item 3 */}
              <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      VIP स्टेटस
                    </span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      🪙 1,000 Coins
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>ढोटी VIP रेजिडेंट स्टेटस (VIP Rank)</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    गाँव के लीडरबोर्ड में शीर्ष रैंकिंग, कस्टम अवतार फ्रेम और विशेष चौपाल रंग।
                  </p>
                </div>
                <button
                  onClick={() => handleStoreRedeem('ढोटी VIP स्टेटस', 1000)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  1,000 Coins में रिडीम करें
                </button>
              </div>

              {/* Item 4 */}
              <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      एक्सक्लूसिव टूल
                    </span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      🪙 300 Coins
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI फोटो बैकग्राउंड रिमूवर प्रो एक्सेस</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    असीमित HD फोटो बैकग्राउंड रिमूवल और कस्टम बैनर डिज़ाइनर टूल एक्सेस।
                  </p>
                </div>
                <button
                  onClick={() => handleStoreRedeem('AI बैकग्राउंड रिमूवर प्रो', 300)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  300 Coins में रिडीम करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
