import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Zap, Heart, ArrowLeft, Camera } from 'lucide-react';

export const metadata = {
  title: 'About Photogram',
  description: 'About Photogram - A fast, modern, visual photo-sharing platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 max-w-3xl mx-auto select-none">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Photogram</span>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-xl">
          <Image src="/app-logo.png" alt="Photogram" width={56} height={56} className="object-cover w-full h-full" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-serif italic">Photogram</h1>
          <p className="text-xs text-neutral-400">Capture • Share • Connect</p>
        </div>
      </div>

      <div className="space-y-6 text-xs text-neutral-300 leading-relaxed">
        <p>
          <strong>Photogram (photogramweb.online)</strong> is a clean, modern, and lightweight visual photo-sharing
          platform engineered for creators, photographers, and communities who value speed, privacy, and simplicity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <h4 className="font-bold text-white text-xs">Lightning Fast</h4>
            <p className="text-[11px] text-neutral-400">Zero bloat, instant web load without needing an app store download.</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <Sparkles className="w-5 h-5 text-[#0095f6]" />
            <h4 className="font-bold text-white text-xs">Pure Photography</h4>
            <p className="text-[11px] text-neutral-400">High-fidelity photo carousels, 24h stories, and creator discovery.</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <Heart className="w-5 h-5 text-rose-500" />
            <h4 className="font-bold text-white text-xs">Zero Ads</h4>
            <p className="text-[11px] text-neutral-400">No sponsored posts interrupting your feed or tracking your data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
