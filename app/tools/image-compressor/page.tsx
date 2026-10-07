'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function ImageCompressorPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.7);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      const url = URL.createObjectURL(file);
      setOriginalPreview(url);
      compressImage(file, quality);
    }
  };

  const compressImage = (file: File, q: number) => {
    setIsCompressing(true);
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setCompressedBlob(blob);
                setCompressedPreview(URL.createObjectURL(blob));
              }
              setIsCompressing(false);
            },
            'image/jpeg',
            q
          );
        }
      };
    };
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (originalFile) {
      compressImage(originalFile, newQ);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    link.download = `dhoti-compressed-${originalFile?.name || 'image.jpg'}`;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
              🗜️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                Image Compressor (MB to KB)
              </h1>
              <p className="text-xs text-slate-400">
                फोटो का साइज़ तुरंत कम करें, क्वालिटी बनाए रखें।
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            {!originalFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-2xl bg-[#0D1726] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.02]"
              >
                <Upload className="w-10 h-10 text-cyan-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold text-white">फोटो चुनें या यहाँ छोड़ें</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG या WebP</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quality Slider */}
                <div className="p-4 rounded-xl bg-[#070B14] border border-white/10">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>कंप्रेशन क्वालिटी: {Math.round(quality * 100)}%</span>
                    <span className="text-cyan-400">
                      {quality > 0.7 ? 'उच्च क्वालिटी' : quality > 0.4 ? 'मध्यम' : 'अधिकतम बचत'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={quality}
                    onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Compare Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#0D1726] border border-white/5 text-center">
                    <span className="text-xs text-slate-400 block mb-1">मूल साइज़</span>
                    <span className="text-base font-bold text-white font-mono">
                      {formatSize(originalFile.size)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <span className="text-xs text-cyan-400 block mb-1">कंप्रेस्ड साइज़</span>
                    <span className="text-base font-bold text-cyan-300 font-mono">
                      {compressedBlob ? formatSize(compressedBlob.size) : '...'}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                {compressedPreview && (
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-64 flex items-center justify-center bg-black">
                    <img
                      src={compressedPreview}
                      alt="Compressed Preview"
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={isCompressing || !compressedBlob}
                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>कंप्रेस्ड फोटो डाउनलोड करें</span>
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
