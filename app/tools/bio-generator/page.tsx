'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

interface BioTemplate {
  id: string;
  category: string;
  bio: string;
}

const BIO_TEMPLATES: BioTemplate[] = [
  {
    id: '1',
    category: 'रॉयल धाकड़ 👑',
    bio: `👑 Official Account 👑
🔥 Dhoti Clan • Dhakad Blood
📍 Rajasthan (28) 🇮🇳
📸 Photo Battle Champion
🚜 Farmer Pride • Desi Vibe
💯 Real & Humble`,
  },
  {
    id: '2',
    category: 'गाँव का शेर 🦁',
    bio: `🦁 गाँव की मिट्टी, देसी अंदाज़
🌾 ढोटी गाँव के निवासी
💪 मेहनत खुद की, नाम खानदान का
⚔️ बैटल का शौकीन
❤️ Respect All • Fear None`,
  },
  {
    id: '3',
    category: 'एटीट्यूड किंग ⚡',
    bio: `⚡ Badshah of My Own Life
😎 शौक पूरे करो, जिंदगी तो खुद पूरी हो जाएगी
📍 ढोटी वाले • Rajasthan
🎶 Desi Music & Bullet Lover
🔥 100% Systumm`,
  },
  {
    id: '4',
    category: 'किसान वीर 🌾',
    bio: `🌾 अन्नदाता का बेटा • गर्व से किसान
🚜 जमींदार ठाठ • हाड़ौती की शान
📍 ढोटी (राजस्थान)
😇 सादगी में ही असली ठाठ है
🙏 राम-राम सा!`,
  },
];

export default function BioGeneratorPage() {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
              ✍️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Desi Bio Generator
              </h1>
              <p className="text-xs text-slate-400">
                इंस्टाग्राम और व्हाट्सएप के लिए रॉयल व देसी बायो एक क्लिक में कॉपी करें।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {BIO_TEMPLATES.map((item) => {
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#0D1726] border border-white/10 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.category}
                    </span>

                    <button
                      onClick={() => handleCopy(item.id, item.bio)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'कॉपी हो गया' : 'Copy Bio'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#070B14] font-sans text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed border border-white/5">
                    {item.bio}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
