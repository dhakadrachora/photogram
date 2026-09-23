'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  TrendingUp,
  Search,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';

const SMARTLINK_URL =
  process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK ||
  'https://www.profitableratecpmnetwork.com/ef9finaux?key=76e0011014ce039fc35fd49375d37b9f';

interface OrderItem {
  id: string;
  orderId: string;
  link: string;
  username: string;
  quantity: number;
  status: string;
  timestamp: number;
}

export function InstagramReelsBooster() {
  const [activeTab, setActiveTab] = useState<'boost' | 'leaderboard' | 'track'>('boost');

  // Input states
  const [reelLink, setReelLink] = useState('');
  const [username, setUsername] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Watch ad modal & countdown
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Success state
  const [successData, setSuccessData] = useState<{
    orderId: string;
    quantity: number;
    username: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Leaderboard & Live feed
  const [totalDelivered, setTotalDelivered] = useState(14800);
  const [recentDeliveries, setRecentDeliveries] = useState<OrderItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Track order
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Fetch initial leaderboard & feed
  const fetchFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const res = await fetch('/api/reels/boost');
      const data = await res.json();
      if (data.success) {
        setTotalDelivered(data.totalDelivered || 14800);
        setRecentDeliveries(data.recentDeliveries || []);
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {
      console.warn('Feed fetch error:', e);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Handle Start Ad Watch
  const handleStartWatchAd = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const link = reelLink.trim();
    if (!link) {
      setInputError('कृपया अपनी Instagram Reel का लिंक दर्ज करें।');
      return;
    }

    if (!link.includes('instagram.com/')) {
      setInputError('अमान्य लिंक! कृपया मान्य Instagram Reel लिंक दर्ज करें (उदा: https://www.instagram.com/reel/...)');
      return;
    }

    try {
      SoundEffects.playTap();
    } catch {}

    // 1. Open Adsterra Smartlink in a new window/tab to guarantee paid ad impression
    try {
      window.open(SMARTLINK_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Popup blocked:', e);
    }

    // 2. Open interactive on-screen countdown modal
    setCountdown(15);
    setIsTimerFinished(false);
    setIsAdModalOpen(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerFinished(true);
          try {
            SoundEffects.playSuccess();
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Claim 100 Views after ad completes
  const handleClaimViews = async () => {
    if (!isTimerFinished || isClaiming) return;

    setIsClaiming(true);
    setInputError(null);

    try {
      const res = await fetch('/api/reels/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: reelLink.trim(),
          username: username.trim() || undefined,
        }),
      });

      const data = await res.json();
      setIsClaiming(false);

      if (res.ok && data.success) {
        setIsAdModalOpen(false);
        setSuccessData({
          orderId: data.orderId,
          quantity: data.quantity || 100,
          username: data.username,
        });
        setReelLink('');
        fetchFeed();
        try {
          SoundEffects.playCheer();
        } catch {}
      } else {
        setIsAdModalOpen(false);
        setInputError(data.error || 'ऑर्डर भेजने में समस्या आई। कृपया 3 घंटे बाद प्रयास करें।');
      }
    } catch (err: any) {
      setIsClaiming(false);
      setIsAdModalOpen(false);
      setInputError(err.message || 'नेटवर्क समस्या। कृपया पुनः प्रयास करें।');
    }
  };

  // Track Order
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) return;

    setIsTracking(true);
    setTrackResult(null);

    try {
      const res = await fetch(`/api/reels/boost?action=status&orderId=${encodeURIComponent(trackOrderId.trim())}`);
      const data = await res.json();
      setIsTracking(false);
      if (data.success) {
        setTrackResult(data);
      } else {
        setTrackResult({ error: 'ऑर्डर नहीं मिला या अभी प्रोसेस हो रहा है।' });
      }
    } catch {
      setIsTracking(false);
      setTrackResult({ error: 'स्टेटस चेक करने में विफल। पुनः प्रयास करें।' });
    }
  };

  const copyOrderId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-purple-500/30 p-4 sm:p-7 shadow-2xl relative overflow-hidden text-white my-6">
      {/* Background Neon Accents */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white shrink-0">
            <Instagram className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Instagram Reels Free Views Booster</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 shadow-sm">
                  100% FREE
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              अपनी रील पर हर 3 घंटे में पाएँ <strong className="text-pink-400">100 फ्री व्यूज</strong>। सिर्फ 15 सेकंड का ऐड देखें!
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-2 text-xs font-bold text-emerald-400 shrink-0 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{totalDelivered.toLocaleString('hi-IN')}+ Views Delivered</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/90 mt-4 gap-1 sm:gap-2">
        <button
          onClick={() => {
            setActiveTab('boost');
            setSuccessData(null);
          }}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'boost'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>⚡ Boost 100 Views</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'leaderboard'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>🏆 Live Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`pb-3 px-3 sm:px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'track'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>🔍 Track Order Status</span>
        </button>
      </div>

      {/* TAB 1: BOOST FORM */}
      {activeTab === 'boost' && (
        <div className="mt-5 space-y-4">
          {successData ? (
            /* Success Celebration Card */
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">बधाई हो! 100 Free Views का आर्डर भेजा गया 🎉</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  आपका आर्डर हमारे SMM सर्वर को सफलतापूर्वक भेज दिया गया है। अगले 5 से 20 मिनट के अंदर आपकी रील पर 100 व्यूज बढ़ जाएँगे।
                </p>
              </div>

              {/* Order Box */}
              <div className="inline-flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-slate-300">
                <span>Order ID: <strong>#{successData.orderId}</strong></span>
                <button
                  onClick={() => copyOrderId(successData.orderId)}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* 3-Hour Cooldown Note */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-2 max-w-md mx-auto">
                <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                <span>इस रील के लिए अगला 100 व्यूज का क्लेम <strong>3 घंटे बाद</strong> खुलेगा।</span>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-md"
              >
                + किसी दूसरी रील पर व्यूज बढ़ाएँ
              </button>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleStartWatchAd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5 text-pink-400" />
                    <span>Instagram Reel Link *</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={reelLink}
                    onChange={(e) => {
                      setReelLink(e.target.value);
                      setInputError(null);
                    }}
                    placeholder="https://www.instagram.com/reel/C7xyz123/..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span>Username (वैकल्पिक)</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@your_instagram"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 shadow-inner"
                  />
                </div>
              </div>

              {/* Error Box */}
              {inputError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>{inputError}</div>
                </div>
              )}

              {/* Rules Note */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>पब्लिक रील (Public Account) होना चाहिए</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>एक रील पर हर 3 घंटे में 100 व्यूज</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>100% सुरक्षित और असली SMM व्यूज</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:via-pink-400 hover:to-purple-500 text-white shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Watch 15s Ad & Boost 100 Views FREE</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: LIVE LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Boosters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                <span>आज के टॉप बूस्टर (Top Boosters)</span>
              </h3>
              <div className="space-y-1.5">
                {leaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <span className="font-bold text-white">{item.handle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-pink-400 font-bold">{item.boostedViews}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {item.badges}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Feed Ticker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>लाइव डिलीवरी फीड (Live Orders)</span>
                </h3>
                <button onClick={fetchFeed} className="text-[11px] text-pink-400 hover:underline flex items-center gap-1">
                  <RefreshCw className={`h-3 w-3 ${isLoadingFeed ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {recentDeliveries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
                    No orders delivered yet today. Be the first one!
                  </div>
                ) : (
                  recentDeliveries.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-slate-300 truncate">@{ord.username}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-emerald-400 text-[11px]">+{ord.quantity} Views</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRACK ORDER STATUS */}
      {activeTab === 'track' && (
        <div className="mt-5 space-y-4 max-w-lg mx-auto">
          <form onSubmit={handleTrackOrder} className="flex gap-2">
            <input
              type="text"
              required
              value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
              placeholder="Enter your Order ID (उदा: 784230)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={isTracking}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isTracking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Track</span>
            </button>
          </form>

          {trackResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
              {trackResult.error ? (
                <div className="text-xs text-rose-400">{trackResult.error}</div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="font-mono font-bold text-white">#{trackResult.orderId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 py-1">
                    <span className="text-slate-400">Order Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        trackResult.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {trackResult.status}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Views Package:</span>
                    <span className="font-bold text-pink-400">100 Reels Views</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          15-SECOND WATCH AD MODAL
          ======================================================= */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-pink-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            {/* Header */}
            <div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-pink-500/20 mb-3">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-white">
                {isTimerFinished ? 'स्पॉन्सर ऐड पूरा हुआ! 🎉' : 'स्पॉन्सर ऐड लोड हो रहा है...'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isTimerFinished
                  ? 'अब आप नीचे दिए गए बटन पर क्लिक करके अपने 100 व्यूज क्लेम करें!'
                  : 'स्पॉन्सर ऐड नई विंडो में खुला है। कृपया 15 सेकंड इंतज़ार करें।'}
              </p>
            </div>

            {/* Circular Countdown Progress */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div
                className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-all ${
                  isTimerFinished
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/30'
                    : 'border-pink-500 border-t-transparent animate-spin'
                }`}
              />
              <div className="absolute font-black text-2xl text-white">
                {isTimerFinished ? '✓' : `${countdown}s`}
              </div>
            </div>

            {/* External Smartlink Re-trigger link */}
            {!isTimerFinished && (
              <a
                href={SMARTLINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-bold underline"
              >
                <span>यदि ऐड नहीं खुला तो यहाँ क्लिक करें</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleClaimViews}
                disabled={!isTimerFinished || isClaiming}
                className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isTimerFinished
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 shadow-emerald-500/30 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>SMM ऑर्डर भेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>{isTimerFinished ? 'Claim 100 Free Views Now ⚡' : `Wait ${countdown}s to Unlock`}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdModalOpen(false);
                  if (timerRef.current) clearInterval(timerRef.current);
                }}
                disabled={isClaiming}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                रद्द करें (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
