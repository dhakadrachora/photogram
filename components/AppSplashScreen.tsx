'use client';

import React, { useState, useEffect } from 'react';

export function AppSplashScreen() {
  const [progress, setProgress] = useState(15);
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if splash was already shown this session
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('dhoti_splash_shown');
      if (alreadyShown) {
        setIsVisible(false);
        return;
      }
    }

    // Step progress forward smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        if (prev < 40) return prev + 25;
        if (prev < 80) return prev + 20;
        return prev + 15;
      });
    }, 220);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsFading(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dhoti_splash_shown', 'true');
        }
        setTimeout(() => {
          setIsVisible(false);
        }, 500);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div
      aria-label="App Loading Splash Screen"
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-between bg-[#0a0604] transition-all duration-500 ease-out select-none ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Village Splash Image */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center">
        <img
          src="/dhoti-splash.jpg"
          alt="DHOTI AALE - राजस्थान का डिजिटल गाँव समुदाय"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          priority="true"
        />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />
      </div>

      {/* Top Header Badge */}
      <div className="relative z-10 pt-10 px-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-black shadow-lg">
          <span>👑 राजस्थान का #1 डिजिटल गाँव मंच</span>
        </div>
      </div>

      {/* Bottom Working Progress Bar Section */}
      <div className="relative z-10 w-full max-w-sm px-6 pb-12 sm:pb-16 flex flex-col items-center text-center">
        {/* Progress Bar Container */}
        <div className="w-full bg-black/70 backdrop-blur-lg rounded-full p-1.5 border border-amber-500/50 shadow-2xl">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.9)] transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Status text & percentage */}
        <div className="flex items-center justify-between w-full mt-3 text-xs font-bold text-amber-200 px-1 drop-shadow-md">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>गाँव चौपाल लोड हो रही है...</span>
          </span>
          <span className="font-mono text-sm font-black text-amber-300">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

export default AppSplashScreen;
