import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { VIRAL_20_TOOLS } from '@/lib/data/tools-data';

export const metadata: Metadata = {
  title: 'Free Online Tools & Social Media Downloader Hub | Dhotiaale',
  description: 'Access 20+ Free Online Tools: Instagram Reels Downloader, YouTube Shorts & 4K Thumbnail Saver, Solar Calculator, SIP Return Calculator, AI Text Humanizer and PDF Tools.',
  keywords: [
    'free online tools',
    'instagram reels download',
    'youtube shorts downloader',
    'youtube thumbnail download 4k',
    'pm surya ghar calculator',
    'sip calculator online',
    'ai text humanizer',
    'dhotiaale tools'
  ],
  openGraph: {
    title: 'Free Online Tools & Downloader Hub | Dhotiaale',
    description: 'Instant, free, and no-registration online tools for creators, developers, students, and citizens.',
    url: 'https://www.dhotiaale.online/tools',
    siteName: 'Dhotiaale'
  }
};

export default function ToolsHubPage() {
  const categories = [
    { id: 'all', label: 'All Tools (20)' },
    { id: 'video-downloader', label: 'Video & Audio Downloaders' },
    { id: 'media-editor', label: 'Image & PDF Utilities' },
    { id: 'calculators', label: 'Govt & Finance Calculators' },
    { id: 'ai-utilities', label: 'AI & Content Tools' },
    { id: 'developer-tools', label: 'Developer & Security' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-semibold">
          ⚡ 100% Free & No Registration Required
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
          Free Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Viral Tools & Utilities</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
          High-speed social video downloaders, 4K YouTube thumbnail extractors, AI content humanizers, and verified government calculators.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VIRAL_20_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group relative flex flex-col justify-between p-6 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </span>
                  {tool.badge && (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                  {tool.shortDesc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800/80 text-xs font-medium text-slate-500 group-hover:text-indigo-400">
                <span>{tool.categoryLabel}</span>
                <span className="flex items-center gap-1 font-bold text-indigo-400">
                  Open Tool →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
