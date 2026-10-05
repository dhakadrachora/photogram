'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string;
  className?: string;
  label?: string;
}

const FALLBACK_CAMPAIGNS = [
  {
    title: '⚔️ ढोटी गाँव 1v1 फोटो बैटल लीग',
    subtitle: 'अपनी सबसे शानदार फोटो अपलोड करें, लाइव वोट पाएं और इंस्टाग्राम विनर प्रमाणपत्र जीतें!',
    cta: 'मुकाबला शुरू करें',
    badge: 'प्रायोजित प्रतियोगिता',
    link: '/#battle',
  },
  {
    title: '🎁 100 मुफ़्त इंस्टाग्राम रील्स बूस्ट',
    subtitle: 'हर 3 घंटे में रील्स लिंक डालें और मुफ़्त ऑर्गेनिक रीच और व्यूज हासिल करें।',
    cta: 'बूस्ट क्लेम करें',
    badge: 'पार्टनर ऑफ़र',
    link: '/#rewards',
  },
  {
    title: '📲 DHOTI AALE सुपरफास्ट मोबाइल APK',
    subtitle: 'राजस्थान का #1 डिजिटल गाँव ऐप सीधे अपने फ़ोन में इंस्टॉल करें — 0% लैग, फुल स्पीड!',
    cta: 'APK डाउनलोड करें',
    badge: 'ऑफिशियल ऐप',
    link: '/dhoti-aale.apk',
  },
];

export function AdBanner({
  slot = '4567890123',
  format = 'auto',
  layoutKey,
  className = '',
  label = 'प्रायोजित / Sponsored by Google',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const [hasGoogleFilled, setHasGoogleFilled] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(FALLBACK_CAMPAIGNS[0]);

  useEffect(() => {
    // Randomize initial fallback campaign
    const randomIdx = Math.floor(Math.random() * FALLBACK_CAMPAIGNS.length);
    setActiveCampaign(FALLBACK_CAMPAIGNS[randomIdx]);

    // Push ad request to Google AdSense
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch (e) {
      console.warn('AdSense push notice:', e);
    }

    // Check if Google AdSense inserted an iframe or filled status
    const checkFilled = () => {
      if (adRef.current) {
        const iframe = adRef.current.querySelector('iframe');
        const status = adRef.current.getAttribute('data-ad-status');
        if (iframe || status === 'filled') {
          setHasGoogleFilled(true);
        }
      }
    };

    const interval = setInterval(checkFilled, 1500);
    const timeout = setTimeout(() => {
      checkFilled();
      clearInterval(interval);
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [slot]);

  return (
    <div
      className={`w-full my-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-slate-950 to-stone-900 border border-amber-500/30 p-2.5 sm:p-3 text-center transition-all shadow-md group ${className}`}
    >
      <div className="flex items-center justify-between w-full px-1 mb-1.5 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>{label}</span>
        </span>
        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] border border-amber-500/30 font-semibold">
          AdMob & AdSense Verified
        </span>
      </div>

      <div className="w-full relative flex items-center justify-center min-h-[90px] overflow-hidden">
        {/* Google AdSense Unit */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: hasGoogleFilled ? 'block' : 'none',
            width: '100%',
            textAlign: 'center',
          }}
          data-ad-client="ca-pub-2229349785904510"
          data-ad-slot={slot}
          data-ad-format={format}
          data-adtest="on"
          data-full-width-responsive="true"
          {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        />

        {/* Fallback Dynamic Sponsored Partner Banner (Shown while Google ad is in review or unfilled) */}
        {!hasGoogleFilled && (
          <a
            href={activeCampaign.link}
            onClick={() => SoundEffects.playTap()}
            className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 transition-all text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-white">
                    {activeCampaign.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold border border-amber-400/30">
                    {activeCampaign.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug line-clamp-2">
                  {activeCampaign.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shrink-0 shadow-md group-hover:translate-x-0.5 transition-transform">
              <span>{activeCampaign.cta}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

export default AdBanner;
