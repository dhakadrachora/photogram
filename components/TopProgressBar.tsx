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
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (trickleTimerRef.current) clearInterval(trickleTimerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
  }, []);

  const done = useCallback(() => {
    clearAllTimers();
    setProgress(100);

    completeTimerRef.current = setTimeout(() => {
      setIsFading(true);

      resetTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
        setIsFading(false);
      }, 250);
    }, 120);
  }, [clearAllTimers]);

  const start = useCallback(() => {
    clearAllTimers();
    setIsFading(false);
    setIsVisible(true);
    setProgress(25);

    // Trickle progress forward
    trickleTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        if (prev < 50) return prev + Math.floor(Math.random() * 12) + 8;
        return prev + Math.floor(Math.random() * 4) + 2;
      });
    }, 120);

    // Automatic safety guard: NEVER stay stuck on screen for more than 1.8 seconds
    safetyTimeoutRef.current = setTimeout(() => {
      done();
    }, 1800);
  }, [clearAllTimers, done]);

  const setExplicit = useCallback((percent: number) => {
    clearAllTimers();
    setIsFading(false);
    setIsVisible(true);
    setProgress(Math.min(100, Math.max(0, percent)));
    if (percent >= 100) {
      done();
    }
  }, [clearAllTimers, done]);

  // Finish immediately on pathname or search parameter change
  useEffect(() => {
    done();
  }, [pathname, searchParams, done]);

  // Intercept global custom events and valid link navigations
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

      // Ignore hash links (/#battle, #worldchat, etc.) and external targets
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.includes('#') &&
        href !== pathname &&
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
  }, [clearAllTimers, start, done, setExplicit, pathname]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3px] overflow-hidden"
      style={{
        opacity: isFading ? 0 : 1,
        transition: 'opacity 250ms ease-out',
      }}
    >
      {/* Sleek Gradient Bar with Golden-Amber Glow */}
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 relative shadow-[0_0_12px_rgba(245,158,11,0.9)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 120ms ease-out' : 'width 200ms ease-out',
        }}
      >
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/80 to-white blur-[0.5px]" />
      </div>
    </div>
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
