'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Coins, CheckCircle, Clock, Volume2 } from 'lucide-react';
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
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const adInsRef = useRef<HTMLModElement | null>(null);

  // Initialize AdSense push for the rewarded ad unit
  useEffect(() => {
    if (isOpen && !isCompleted) {
      setTimeLeft(15);
      setIsCompleted(false);
      setClaimedReward(null);

      // Trigger ad render
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (e) {
        console.warn('AdMob rewarded render notice:', e);
      }

      // Start 15s countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleRewardCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const handleRewardCompletion = async () => {
    setIsCompleted(true);
    setIsClaiming(true);
    SoundEffects.playSuccess();

    try {
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
        if (onCoinsRewarded && data.newCoins) {
          onCoinsRewarded(data.newCoins);
        }
      } else {
        setClaimedReward(50);
      }
    } catch (e) {
      console.error('Error claiming reward:', e);
      setClaimedReward(50);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-950 border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
        role="dialog"
        aria-modal="true"
        aria-label="Earn Dhoti Coins"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />

        {/* Close Button (Enabled after completion or with confirmation) */}
        <button
          onClick={() => {
            SoundEffects.playTap();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="बंद करें (Close)"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>रिवॉर्डेड वीडियो ऐड (AdMob Rewarded)</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>🎁 फ्री +50 धोती सिक्के पाएं!</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          प्रायोजित विज्ञापन पूरा देखें और लाइव बैटल व प्रोफाइल के लिए 50 सिक्के तुरंत कमाएं।
        </p>

        {/* Ad Container Box */}
        <div className="w-full my-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 relative flex flex-col items-center justify-center min-h-[220px]">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">
            प्रायोजित विज्ञापन / Sponsored Ad
          </span>

          {/* Google AdMob / AdSense Rewarded Placement */}
          <div className="w-full flex items-center justify-center min-h-[160px] overflow-hidden">
            <ins
              ref={adInsRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', textAlign: 'center' }}
              data-ad-client="ca-pub-2229349785904510"
              data-ad-slot="1466913269"
              data-ad-format="rectangle,horizontal"
              data-full-width-responsive="true"
            />
          </div>

          {/* Reward Status Banner */}
          {!isCompleted ? (
            <div className="w-full mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="h-4 w-4 animate-spin text-amber-400" />
                <span>सिक्के जुड़ रहे हैं: {timeLeft}s बाकी</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">15s Rewarded</span>
            </div>
          ) : (
            <div className="w-full mt-3 pt-3 border-t border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-400 text-xs font-black animate-bounce">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>विज्ञापन पूरा हुआ! +50 Coins क्रेडिट हो गए!</span>
            </div>
          )}
        </div>

        {/* Action Button & Feedback */}
        {isCompleted ? (
          <div className="w-full space-y-2 mt-1">
            <button
              onClick={() => {
                SoundEffects.playTap();
                onClose();
              }}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Coins className="h-5 w-5 text-slate-950" />
              <span>सिक्के प्राप्त हुए! (शानदार)</span>
            </button>
            <p className="text-[11px] text-slate-400">
              आप और सिक्के कमाने के लिए दोबारा विज्ञापन देख सकते हैं।
            </p>
          </div>
        ) : (
          <div className="w-full space-y-2 mt-1">
            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((15 - timeLeft) / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              कृपया विज्ञापन पूरा होने तक इंतज़ार करें... ({timeLeft} सेकंड)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
