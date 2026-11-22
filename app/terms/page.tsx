import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Photogram.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 max-w-3xl mx-auto select-none">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Photogram</span>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0095f6]/10 border border-[#0095f6]/30 flex items-center justify-center text-[#0095f6]">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-xs text-neutral-400">Last updated: November 2026</p>
        </div>
      </div>

      <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <h3 className="font-bold text-white text-sm">1. Community Guidelines</h3>
          <p>
            Users are expected to share original photography and visual content. Harassment, hate speech,
            copyright infringement, spam, and bot automation are strictly prohibited on Photogram.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <h3 className="font-bold text-white text-sm">2. Account Responsibility</h3>
          <p>
            You are responsible for keeping your login credentials safe. Each user must have a unique
            username and provide valid authentication details.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <h3 className="font-bold text-white text-sm">3. Content Ownership</h3>
          <p>
            You retain all rights and ownership to the photos and visual media you upload to Photogram.
            You can remove or delete your content at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
