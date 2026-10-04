'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, Radio, CheckCircle2, ShieldAlert } from 'lucide-react';

export function NetworkGuard() {
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const initialCheckDone = useRef(false);

  // Ping backend to test real packet transmission
  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true;

    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      // Fallback: check if navigator says online
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    setCheckError(null);

    const hasNet = await verifyConnectivity();
    setIsChecking(false);

    if (hasNet) {
      setIsOffline(false);
      setShowRestoredNotice(true);
      document.body.style.overflow = '';
      setTimeout(() => setShowRestoredNotice(false), 3500);
    } else {
      setIsOffline(true);
      setCheckError('इंटरनेट अभी भी बंद है। कृपया अपने फोन का मोबाइल डेटा या Wi-Fi ऑन करें।');
    }
  };

  useEffect(() => {
    setMounted(true);

    const updateStatus = async (online: boolean) => {
      if (!online) {
        setIsOffline(true);
        document.body.style.overflow = 'hidden';
      } else {
        const reallyOnline = await verifyConnectivity();
        if (reallyOnline) {
          setIsOffline(false);
          document.body.style.overflow = '';
          if (initialCheckDone.current) {
            setShowRestoredNotice(true);
            setTimeout(() => setShowRestoredNotice(false), 3500);
          }
        } else {
          setIsOffline(true);
          document.body.style.overflow = 'hidden';
        }
      }
      initialCheckDone.current = true;
    };

    // Check status immediately on mount
    if (!navigator.onLine) {
      setIsOffline(true);
      document.body.style.overflow = 'hidden';
    } else {
      void verifyConnectivity().then((online) => {
        if (!online) {
          setIsOffline(true);
          document.body.style.overflow = 'hidden';
        }
        initialCheckDone.current = true;
      });
    }

    const onOnline = () => void updateStatus(true);
    const onOffline = () => void updateStatus(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Periodic heartbeat check
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setIsOffline(true);
        document.body.style.overflow = 'hidden';
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
      document.body.style.overflow = '';
    };
  }, [verifyConnectivity]);

  if (!mounted) return null;

  return (
    <>
      {/* 1. RESTORED ONLINE TOAST */}
      {showRestoredNotice && !isOffline && (
        <div
          role="status"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999999] px-4 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span>इंटरनेट कनेक्ट हो गया! ऐप सुचारू रूप से चालू है।</span>
        </div>
      )}

      {/* 2. STRICT FULL-SCREEN OFFLINE BLOCKER (BINA NET KE APP OPEN NAHI HOGA) */}
      {isOffline && (
        <div
          id="offline-blocker-overlay"
          aria-modal="true"
          role="alertdialog"
          className="fixed inset-0 z-[99999999] bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          {/* Ambient Glow Effects */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl" />

          {/* Offline Card */}
          <div className="relative max-w-md w-full bg-stone-900/90 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Animated Radar Pulse Icon */}
            <div className="relative mx-auto flex items-center justify-center h-20 w-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500/30 opacity-75" />
              <span className="absolute inline-flex rounded-full h-16 w-16 bg-red-500/20 border border-red-500/40" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/40">
                <WifiOff className="h-7 w-7" />
              </div>
            </div>

            {/* Title & Badge */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>नेटवर्क डिस्कनेक्टेड (Offline)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                इंटरनेट कनेक्शन नहीं है
              </h2>
              <p className="text-xs text-stone-400 font-medium leading-relaxed">
                Active Internet Connection Required
              </p>
            </div>

            {/* Description Warning Box */}
            <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 text-left space-y-2 text-xs text-stone-300">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                <span>ऐप एक्सेस लॉक है</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-stone-300">
                <strong className="text-white">DHOTI AALE</strong> एक लाइव डिजिटल समुदाय है। लाइव फोटो बैटल, गाँव चौपाल चैट और पंचायत समाचारों के लिए सक्रिय इंटरनेट कनेक्शन आवश्यक है।
              </p>
              <p className="text-[11px] text-stone-400">
                👉 कृपया अपने फोन या कंप्यूटर में <strong className="text-stone-200">मोबाइल डेटा</strong> या <strong className="text-stone-200">Wi-Fi</strong> चालू करें।
              </p>
            </div>

            {checkError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{checkError}</span>
              </div>
            )}

            {/* Retry Button */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isChecking}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-stone-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'नेटवर्क जाँचा जा रहा है...' : '🔄 कनेक्शन पुनः जाँचे (Retry Now)'}</span>
              </button>

              <p className="text-[10px] text-stone-500 font-medium">
                जैसे ही इंटरनेट आएगा, ऐप अपने आप खुल जाएगी।
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NetworkGuard;
