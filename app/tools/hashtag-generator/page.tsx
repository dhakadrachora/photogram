'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Hash, Copy, Check, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

interface HashtagGroup {
  id: string;
  title: string;
  category: string;
  tags: string[];
}

const HASHTAG_GROUPS: HashtagGroup[] = [
  {
    id: 'rajasthan',
    title: '🌾 राजस्थानी व देसी कल्चर (Rajasthani Vibes)',
    category: 'देसी',
    tags: [
      '#dhoti_aale',
      '#rajasthani',
      '#rajasthan',
      '#marwadi',
      '#hadoti',
      '#desivibes',
      '#gaon_ki_zindagi',
      '#village_life',
      '#dhakad',
      '#rajasthaniculture',
      '#desistyle',
    ],
  },
  {
    id: 'viral-reels',
    title: '🔥 वायरल इंस्टाग्राम रील्स (Trending Viral Reels)',
    category: 'वायरल',
    tags: [
      '#reelsindia',
      '#trendingreels',
      '#viralreels',
      '#reelsvideo',
      '#explorepage',
      '#foryou',
      '#viralpost',
      '#trendingsongs',
      '#reelitfeelit',
      '#instadaily',
    ],
  },
  {
    id: 'attitude-royal',
    title: '👑 रॉयल व धाकड़ एटीट्यूड (Royal Attitude)',
    category: 'रॉयल',
    tags: [
      '#attitude',
      '#royalattitude',
      '#banna',
      '#dhakadboy',
      '#sher',
      '#systumm',
      '#rajputana',
      '#kingvibes',
      '#swagger',
      '#desiking',
    ],
  },
  {
    id: 'photo-battle',
    title: '⚔️ फोटो बैटल व गेमिंग (Battle & Photoshoot)',
    category: 'बैटल',
    tags: [
      '#photobattle',
      '#dhoti_battle',
      '#photoshoot',
      '#portraitphotography',
      '#modelphotography',
      '#desimodel',
      '#competition',
      '#champion',
    ],
  },
];

export default function HashtagGeneratorPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyTags = (group: HashtagGroup) => {
    const text = group.tags.join(' ');
    navigator.clipboard.writeText(text);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सभी टूल्स (All Tools)</span>
        </Link>

        <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl">
              #️⃣
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Viral Hashtag Generator
              </h1>
              <p className="text-xs text-slate-400">
                रील्स और शॉर्ट्स के लिए 100% ट्रेंडिंग और रिच वाले हैशटैग।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {HASHTAG_GROUPS.map((group) => {
              const isCopied = copiedId === group.id;

              return (
                <div
                  key={group.id}
                  className="rounded-2xl bg-[#0D1726] border border-white/10 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block mb-0.5">
                        {group.category}
                      </span>
                      <h3 className="font-bold text-white text-sm font-hindi">
                        {group.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleCopyTags(group)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'कॉपी हो गया' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-[#070B14] text-xs font-mono text-cyan-300 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
