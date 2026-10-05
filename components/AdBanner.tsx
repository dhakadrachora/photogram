'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string;
  className?: string;
  label?: string;
}

export function AdBanner({
  slot = '1234567890', // Default slot or customizable
  format = 'auto',
  layoutKey,
  className = '',
  label = 'विज्ञापन / Sponsored',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.warn('AdSense render notice:', e);
      setAdError(true);
    }
  }, []);

  return (
    <div
      className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-stone-100/60 border border-stone-200/80 p-2 text-center transition-all ${className}`}
    >
      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
        {label}
      </span>

      <div className="w-full flex items-center justify-center min-h-[90px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', textAlign: 'center' }}
          data-ad-client="ca-pub-2229349785904510"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />
      </div>
    </div>
  );
}

export default AdBanner;
