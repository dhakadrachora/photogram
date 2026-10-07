'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Instagram, Copy, Check, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

const FANCY_MAPS: Record<string, (text: string) => string> = {
  bold: (t) => t.replace(/[a-zA-Z]/g, (c) => String.fromCodePoint((c.charCodeAt(0) > 96 ? 0x1d5ee : 0x1d5d4) + c.charCodeAt(0) - (c.charCodeAt(0) > 96 ? 97 : 65))),
  italic: (t) => t.replace(/[a-zA-Z]/g, (c) => String.fromCodePoint((c.charCodeAt(0) > 96 ? 0x1d622 : 0x1d608) + c.charCodeAt(0) - (c.charCodeAt(0) > 96 ? 97 : 65))),
  monospace: (t) => t.replace(/[a-zA-Z]/g, (c) => String.fromCodePoint((c.charCodeAt(0) > 96 ? 0x1d68a : 0x1d670) + c.charCodeAt(0) - (c.charCodeAt(0) > 96 ? 97 : 65))),
};

export default function InstagramToolsPage() {
  const [inputText, setInputText] = useState('Dhoti Aale King');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-2xl">
              📸
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Instagram Caption & Font Styler
              </h1>
              <p className="text-xs text-slate-400">
                अपने इंस्टाग्राम टेक्स्ट को स्टाइलिश और बोल्ड फॉन्ट्स में बदलें।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                अपना नाम या कैप्शन लिखें:
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="यहाँ टाइप करें..."
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(FANCY_MAPS).map(([name, transform]) => {
                const transformed = transform(inputText || 'Dhoti');
                const isCopied = copiedKey === name;

                return (
                  <div
                    key={name}
                    className="p-4 rounded-xl bg-[#0D1726] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] text-pink-400 uppercase tracking-wider block font-bold">
                        {name} Font
                      </span>
                      <span className="text-sm sm:text-base text-white font-mono break-all">
                        {transformed}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(name, transformed)}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                      title="Copy"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
