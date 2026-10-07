'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode, Download, Copy, Check, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function QRGeneratorPage() {
  const [text, setText] = useState('https://www.dhotiaale.online');
  const [size, setSize] = useState('300');
  const [copied, setCopied] = useState(false);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text || 'DHOTI AALE'
  )}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `dhoti-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              📱
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                QR Code Generator
              </h1>
              <p className="text-xs text-slate-400">
                वेबसाइट, व्हाट्सएप या टेक्स्ट का एचडी क्यूआर कोड बनाएं।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                लिंक या संदेश दर्ज करें (URL or Text):
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://example.com या कोई भी संदेश..."
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                साइज़ (Resolution):
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="200">200 x 200 (Compact)</option>
                <option value="300">300 x 300 (Standard HD)</option>
                <option value="500">500 x 500 (Print Quality)</option>
              </select>
            </div>

            {/* QR Preview Card */}
            <div className="p-6 rounded-2xl bg-[#070B14] border border-white/10 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <img
                  src={qrUrl}
                  alt="Generated QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>PNG डाउनलोड करें</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'कॉपी हो गया' : 'कॉपी लिंक'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
