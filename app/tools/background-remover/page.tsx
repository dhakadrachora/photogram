'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, RefreshCw, Scissors } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function BackgroundRemoverPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(30);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      processBackground(file, threshold);
    }
  };

  const processBackground = (file: File, thresh: number) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample top-left pixel as background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const diff = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          if (diff < thresh) {
            data[i + 3] = 0; // Transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        setResultUrl(canvas.toDataURL('image/png'));
      };
    };
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `dhoti-transparent-${Date.now()}.png`;
    link.click();
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
              ✂️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Color Background Remover
              </h1>
              <p className="text-xs text-slate-400">
                सफेद, हरे या ठोस बैकग्राउंड को हटाकर पारदर्शी (Transparent PNG) बनाएं।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFile}
              accept="image/*"
              className="hidden"
            />

            {!imageFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-2xl bg-[#0D1726] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.02]"
              >
                <Upload className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold text-white">फोटो चुनें</span>
                <span className="text-xs text-slate-400 mt-1">
                  (सफेद या ठोस बैकग्राउंड वाली फोटो सबसे अच्छी काम करती है)
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#070B14] border border-white/10">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>सेंसिटिविटी थ्रेशोल्ड (Threshold): {threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={threshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setThreshold(val);
                      if (imageFile) processBackground(imageFile, val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {resultUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-72 flex items-center justify-center bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px] bg-[#070B14]">
                    <img
                      src={resultUrl}
                      alt="Transparent Result"
                      className="max-h-72 object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>पारदर्शी PNG डाउनलोड करें</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    title="दूसरी फोटो चुनें"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
