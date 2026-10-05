'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const trickleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef(0);

  const clearAllTimers = useCallback(() => {
    if (trickleTimerRef.current) clearInterval(trickleTimerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const start = useCallback(() => {
    clearAllTimers();
    setIsFading(false);
    setIsVisible(true);
    setProgress((prev) => (prev > 0 && prev < 90 ? prev : 18));

    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev < 40) return prev + Math.floor(Math.random() * 14) + 8;
        if (prev < 70) return prev + Math.floor(Math.random() * 6) + 4;
        return prev + Math.floor(Math.random() * 2) + 1;
      });
    }, 150);
  }, [clearAllTimers]);

  const done = useCallback(() => {
    clearAllTimers();
    setProgress(100);

    completeTimerRef.current = setTimeout(() => {
      setIsFading(true);

      resetTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setIsFading(false);
      }, 350);
    }, 200);
  }, [clearAllTimers]);

  const setExplicit = useCallback((percent: number) => {
    clearAllTimers();
    setIsFading(false);
    setIsVisible(true);
    setProgress(Math.min(100, Math.max(0, percent)));
    if (percent >= 100) {
      done();
    }
  }, [clearAllTimers, done]);

  // Trigger on route and search param changes
  useEffect(() => {
    done();
  }, [pathname, searchParams, done]);

  // Intercept global custom events, link clicks, and fetch requests
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStart = () => start();
    const handleDone = () => done();
    const handleSet = (e: Event) => {
      const customEvent = e as CustomEvent<{ percent: number }>;
      if (typeof customEvent.detail?.percent === 'number') {
        setExplicit(customEvent.detail.percent);
      }
    };

    window.addEventListener('app:progress:start', handleStart);
    window.addEventListener('app:progress:done', handleDone);
    window.addEventListener('app:progress:set', handleSet);

    // Intercept clicks on links for instant visual feedback
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        start();
      }
    };

    document.addEventListener('click', handleLinkClick, { passive: true });

    return () => {
      clearAllTimers();
      window.removeEventListener('app:progress:start', handleStart);
      window.removeEventListener('app:progress:done', handleDone);
      window.removeEventListener('app:progress:set', handleSet);
      document.removeEventListener('click', handleLinkClick);
    };
  }, [clearAllTimers, start, done, setExplicit]);

  if (!isVisible && progress === 0) return null;

  return (
    <>
      {/* 1. TOP PROGRESS BAR */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3.5px] overflow-hidden"
        style={{
          opacity: isFading ? 0 : 1,
          transition: 'opacity 300ms ease-out',
        }}
      >
        {/* Progress Track Background Glow */}
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 relative shadow-[0_0_16px_rgba(245,158,11,0.95),0_0_8px_rgba(234,88,12,0.9)]"
          style={{
            width: `${progress}%`,
            transition: progress === 100 ? 'width 150ms ease-out' : 'width 250ms ease-out',
          }}
        >
          {/* Leading edge glow peg */}
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-r from-transparent via-amber-200 to-white opacity-95 blur-[0.5px] shadow-[0_0_16px_#f59e0b,0_0_10px_#fbbf24]" />
        </div>
      </div>

      {/* 2. TOP RIGHT SUBTLE PULSE SPINNER */}
      {isVisible && !isFading && (
        <div
          aria-hidden="true"
          className="fixed top-3 right-3 z-[999999] pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-amber-500/40 shadow-lg backdrop-blur-md text-[10px] font-bold text-amber-400 animate-in fade-in zoom-in-95 duration-200"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
      )}
    </>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}

export default TopProgressBar;
