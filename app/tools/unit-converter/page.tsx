'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function UnitConverterPage() {
  const [bigha, setBigha] = useState<number>(1);

  // Rajasthan standard pakka bigha is approx 27,225 sq ft or 3,025 sq yards (approx 0.625 acre)
  // Standard kachha bigha in eastern Rajasthan is approx 17,424 sq ft or 1,936 sq yards
  const sqFeet = bigha * 27225;
  const sqYards = bigha * 3025; // Gaj
  const biswa = bigha * 20;
  const acre = bigha * 0.625;
  const hectare = bigha * 0.2529;

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
              🌾
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Rajasthan Land & Bigha Converter
              </h1>
              <p className="text-xs text-slate-400">
                बीघा, बिस्वा, एकड़, हेक्टेयर और गज का प्रामाणिक देसी ज़मीनी कैलकुलेटर।
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                बीघा दर्ज करें (Enter Bigha):
              </label>
              <input
                type="number"
                value={bigha}
                onChange={(e) => setBigha(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white text-lg font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">बिस्वा (Biswa)</span>
                <span className="text-lg font-bold text-amber-300 font-mono">
                  {biswa.toFixed(1)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">वर्ग गज (Gaj)</span>
                <span className="text-lg font-bold text-white font-mono">
                  {sqYards.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">वर्ग फीट (Sq. Ft)</span>
                <span className="text-lg font-bold text-white font-mono">
                  {sqFeet.toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">एकड़ (Acre)</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">
                  {acre.toFixed(3)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#070B14] border border-white/5 text-center col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-400 block mb-1">हेक्टेयर (Hectare)</span>
                <span className="text-lg font-bold text-emerald-300 font-mono">
                  {hectare.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
