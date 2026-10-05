'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Coins,
  CheckCircle,
  Clock,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Flame,
  Swords,
  Trophy,
} from 'lucide-react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { SoundEffects } from '@/lib/audio/sound-effects';

interface EarnCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onCoinsRewarded?: (newCoins: number) => void;
}

const SPONSORED_CAMPAIGNS = [
  {
    id: 'battle',
    brand: 'DHOTI BATTLE LEAGUE',
    tagline: 'राजस्थान का #1 डिजिटल फोटो मुकाबला',
    title: '⚔️ 1v1 लाइव फोटो बैटल अखाड़ा!',
    description: 'अपनी सबसे धाकड़ फोटो अपलोड करें, साथी ग्रामीणों को चुनौती दें और लाइव वोटों के ज़रिए गाँव के चैंपियन बनें!',
    badge: '🔥 ट्रेंडिंग प्रतियोगिता',
    ctaText: 'मुकाबला शुरू करें',
    ctaLink: '/#battle',
    colorFrom: 'from-amber-500',
    colorTo: 'to-orange-600',
    stats: '1,420+ बैटल लाइव • 50+ विजेता पुरस्कृत',
  },
  {
    id: 'reels',
    brand: 'INSTA VIRAL BOOSTER',
    tagline: 'ढोटी क्रिएटर्स स्पेशल ऑफ़र',
    title: '🚀 100 मुफ़्त इंस्टाग्राम रील्स व्यूज बूस्टर!',
    description: 'हर 3 घंटे में अपनी रील का लिंक डालें और बिना किसी शुल्क के 100% असली व्यूज बूस्ट हासिल करें।',
    badge: '🎁 100% मुफ़्त ऑफ़र',
    ctaText: 'फ्री व्यूज बूस्ट क्लेम करें',
    ctaLink: '/#rewards',
    colorFrom: 'from-pink-500',
    colorTo: 'to-purple-600',
    stats: '10,000+ रील्स बूस्टेड • 4.9★ रेटिंग',
  },
  {
    id: 'apk',
    brand: 'DHOTI AALE OFFICIAL APP',
    tagline: 'सुपरफास्ट एंड्रॉइड एक्सपीरियंस',
    title: '📲 DHOTI AALE मोबाइल ऐप (APK)',
    description: 'सीधे अपने स्मार्टफोन में इंस्टॉल करें! 0% लैग, फुल-स्क्रीन मोड, 24/7 चौपाल और AI वॉइस असिस्टेंट एक टैप में।',
    badge: '⚡ सुपरफास्ट APK',
    ctaText: 'APK अभी इंस्टॉल करें',
    ctaLink: '/dhoti-aale.apk',
    colorFrom: 'from-emerald-500',
    colorTo: 'to-teal-600',
    stats: '4.8 MB साइज़ • 100% सुरक्षित व सत्यापित',
  },
];

export function EarnCoinsModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onCoinsRewarded,
}: EarnCoinsModalProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number>(50);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCampaignIdx, setActiveCampaignIdx] = useState(0);
  const [hasGoogleAdFilled, setHasGoogleAdFilled] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const adInsRef = useRef<HTMLModElement | null>(null);

  // Initialize and run rewarded ad lifecycle
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(15);
      setIsCompleted(false);
      setHasGoogleAdFilled(false);
      setClaimedReward(50);

      // Rotate campaign on each open
      setActiveCampaignIdx((prev) => (prev + 1) % SPONSORED_CAMPAIGNS.length);

      // Play soft bell sound when ad opens if not muted
      try {
        SoundEffects.playTap();
      } catch (e) {}

      // Push ad request to Google AdSense
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (e) {
        console.warn('AdMob rewarded render notice:', e);
      }

      // Check if Google AdSense filled an iframe
      const checkGoogleAd = () => {
        if (adInsRef.current) {
          const iframe = adInsRef.current.querySelector('iframe');
          const status = adInsRef.current.getAttribute('data-ad-status');
          if (iframe || status === 'filled') {
            setHasGoogleAdFilled(true);
          }
        }
      };

      const checkInterval = setInterval(checkGoogleAd, 1000);

      // 15 seconds countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            clearInterval(checkInterval);
            handleRewardCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearInterval(checkInterval);
      };
    }
  }, [isOpen]);

  const handleRewardCompletion = async () => {
    setIsCompleted(true);
    setIsClaiming(true);

    // Audio celebration fanfare
    try {
      SoundEffects.playBell();
      setTimeout(() => {
        SoundEffects.playCheer();
      }, 200);
    } catch (e) {}

    let newTotalCoins = 50;

    try {
      // 1. Credit locally first for zero-lag instant UI update
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('dhoti_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            newTotalCoins = Number(parsed.dhotiCoins ?? parsed.coins ?? 100) + 50;
            const updated = {
              ...parsed,
              coins: newTotalCoins,
              dhotiCoins: newTotalCoins,
            };
            localStorage.setItem('dhoti_user', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {}
        } else {
          // Guest user session coins
          const guestCoins = Number(localStorage.getItem('dhoti_guest_coins') || '0') + 50;
          localStorage.setItem('dhoti_guest_coins', guestCoins.toString());
          newTotalCoins = guestCoins;
        }
      }

      // 2. Sync with backend API
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/coins/reward', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: currentUser?.id,
          email: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClaimedReward(data.reward || 50);
        if (data.newCoins) {
          newTotalCoins = data.newCoins;
        }
      }

      if (onCoinsRewarded) {
        onCoinsRewarded(newTotalCoins);
      }
    } catch (e) {
      console.error('Error claiming reward:', e);
      setClaimedReward(50);
      if (onCoinsRewarded) {
        onCoinsRewarded(newTotalCoins);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  const campaign = SPONSORED_CAMPAIGNS[activeCampaignIdx];
  const progressPercent = Math.min(100, Math.max(0, ((15 - timeLeft) / 15) * 100));

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Earn Dhoti Coins with Rewarded Ad"
      >
        {/* Top Glow Ambient */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />

        {/* Top Control Bar: Sponsor Info, Sound, Close */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Google AdMob • Rewarded Video Ad</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                SoundEffects.playTap();
              }}
              className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'ध्वनि चालू करें (Unmute)' : 'ध्वनि बंद करें (Mute)'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Close Button - Always available with tap feedback */}
            <button
              type="button"
              onClick={() => {
                SoundEffects.playTap();
                onClose();
              }}
              className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="बंद करें (Close)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Ad Player Screen Area */}
        <div className="w-full my-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-black border border-slate-800 relative overflow-hidden shadow-inner flex flex-col min-h-[260px] sm:min-h-[290px]">
          {/* Google AdSense container (Visible if Google iframe fills) */}
          <div
            className={`w-full h-full flex items-center justify-center p-2 ${
              hasGoogleAdFilled ? 'block' : 'hidden'
            }`}
          >
            <ins
              ref={adInsRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', textAlign: 'center' }}
              data-ad-client=""
              data-ad-slot="1466913269"
              data-ad-format="rectangle,horizontal"
              data-adtest="on"
              data-full-width-responsive="true"
            />
          </div>

          {/* Dynamic Rich Sponsored Video Ad Creative (Active during AdMob review or web playback) */}
          {!hasGoogleAdFilled && (
            <div className="w-full flex-1 flex flex-col justify-between p-4 sm:p-5 relative overflow-hidden text-left">
              {/* Background gradient & decorative shapes */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${campaign.colorFrom}/15 via-transparent ${campaign.colorTo}/15 pointer-events-none`}
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-amber-300">
                <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                <span>{timeLeft}s शेष</span>
              </div>

              {/* Sponsor Brand Bar */}
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400/90 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>{campaign.brand}</span>
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {campaign.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              {/* Animated Interactive Showcase Feature */}
              <div className="relative z-10 my-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md">
                    {campaign.id === 'battle' ? (
                      <Swords className="w-5 h-5 text-slate-950 animate-pulse" />
                    ) : campaign.id === 'reels' ? (
                      <Sparkles className="w-5 h-5 text-slate-950 animate-spin" />
                    ) : (
                      <Trophy className="w-5 h-5 text-slate-950 animate-bounce" />
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-amber-300 block">
                      {campaign.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {campaign.stats}
                    </span>
                  </div>
                </div>

                <a
                  href={campaign.ctaLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => SoundEffects.playTap()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  <span>{campaign.ctaText}</span>
                  <ExternalLink className="w-3 h-3 text-slate-950" />
                </a>
              </div>

              {/* Bottom Reward Countdown & Live Progress Bar */}
              <div className="relative z-10 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-200 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>सिक्के जुड़ने की प्रक्रिया...</span>
                  </span>
                  <span className="font-mono text-amber-400">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 h-full transition-all duration-1000 ease-linear rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)] relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Reward Status & Celebration Section */}
        {isCompleted ? (
          <div className="w-full space-y-3 mt-1 animate-in zoom-in-95 duration-300">
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2.5 shadow-lg">
              <CheckCircle className="h-6 w-6 text-emerald-400 animate-bounce shrink-0" />
              <div className="text-left leading-tight">
                <span className="text-sm font-black text-white block">
                  🎉 बधाई हो! +50 धोती सिक्के मिल गए!
                </span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {currentUser
                    ? 'सिक्के आपकी प्रोफ़ाइल में जुड़ चुके हैं।'
                    : 'सिक्के आपके डिवाइस में सुरक्षित हो गए हैं।'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                SoundEffects.playSuccess();
                onClose();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Coins className="h-5 w-5 text-slate-950" />
              <span>सिक्के प्राप्त हुए! (शानदार)</span>
            </button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>विज्ञापन पूरा देखने पर 50 सिक्के क्रेडिट होंगे</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">{timeLeft}s शेष</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EarnCoinsModal;
