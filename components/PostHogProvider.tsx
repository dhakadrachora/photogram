'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, trackEvent } from '@/lib/posthog';
import { NetworkGuard } from '@/components/NetworkGuard';

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      trackEvent('$pageview', {
        $current_url: url,
        path: pathname,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      <NetworkGuard />
      {children}
    </>
  );
}
