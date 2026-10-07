'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, RefreshCw, Maximize2 } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function ImageResizerPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [aspectRatio, setAspectRatio] = useState<number>(800 / 600);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
        resize(file, img.width, img.height);
      };
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio) {
      const newH = Math.round(val / aspectRatio);
      setHeight(newH);
      if (imageFile) resize(imageFile, val, newH);
    } else if (imageFile) {
      resize(imageFile, val, height);
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio) {
      const newW = Math.round(val * aspectRatio);
      setWidth(newW);
      if (imageFile) resize(imageFile, newW, val);
    } else if (imageFile) {
      resize(imageFile, width, val);
    }
  };

  const resize = (file: File, w: number, h: number) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setResizedUrl(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
    };
  };

  const handleDownload = () => {
    if (!resizedUrl) return;
    const link = document.createElement('a');
    link.href = resizedUrl;
    link.download = `dhoti-resized-${width}x${height}.jpg`;
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
              📐
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Photo Resizer & Dimension Tool
              </h1>
              <p className="text-xs text-slate-400">
                फोटो की चौड़ाई और ऊंचाई अपनी पसंद अनुसार सेट करें।
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
                <span className="text-xs text-slate-400 mt-1">PNG या JPG</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      चौड़ाई (Width px):
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      ऊंचाई (Height px):
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ratio"
                    checked={lockRatio}
                    onChange={(e) => setLockRatio(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <label htmlFor="ratio" className="text-xs text-slate-300 cursor-pointer">
                    आस्पेक्ट रेशियो लॉक रखें (Lock Aspect Ratio)
                  </label>
                </div>

                {resizedUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-64 flex items-center justify-center bg-black">
                    <img
                      src={resizedUrl}
                      alt="Resized Preview"
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>रीसाइज़ फोटो डाउनलोड करें ({width}x{height})</span>
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
