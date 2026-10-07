'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Youtube, Download, ExternalLink, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function YouTubeThumbnailPage() {
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [videoId, setVideoId] = useState<string | null>('dQw4w9WgXcQ');

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleUrlChange = (val: string) => {
    setVideoUrl(val);
    const id = extractVideoId(val);
    setVideoId(id);
  };

  const downloadImage = (url: string, quality: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `youtube-thumbnail-${quality}.jpg`;
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
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl">
              🎬
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                YouTube Thumbnail Downloader
              </h1>
              <p className="text-xs text-slate-400">
                किसी भी यूट्यूब वीडियो का फुल एचडी व 4K थंबनेल डाउनलोड करें।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                यूट्यूब वीडियो लिंक पेस्ट करें (Paste YouTube URL):
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... या https://youtu.be/..."
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-400"
              />
            </div>

            {videoId ? (
              <div className="space-y-6 pt-4">
                {/* 1080p Max Resolution */}
                <div className="rounded-2xl bg-[#070B14] border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                        Ultra HD (1080p)
                      </span>
                      <span>Max Resolution</span>
                    </span>

                    <button
                      onClick={() =>
                        downloadImage(
                          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                          '1080p'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>डाउनलोड</span>
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-72">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="1080p thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                    />
                  </div>
                </div>

                {/* High Quality (HQ) */}
                <div className="rounded-2xl bg-[#070B14] border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Standard Quality (HQ 720p)
                    </span>

                    <button
                      onClick={() =>
                        downloadImage(
                          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                          'hq'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>डाउनलोड</span>
                    </button>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-60">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                      alt="HQ thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#070B14] border border-white/10 text-center text-xs text-slate-400">
                कृपया सही यूट्यूब वीडियो लिंक दर्ज करें।
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
