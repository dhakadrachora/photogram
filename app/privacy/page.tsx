import React from 'react';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Server, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & Zero-Knowledge Security',
  description: 'Understand how Photogram protects user data with Zero-Knowledge End-to-End Encryption.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 max-w-3xl mx-auto select-none">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Photogram</span>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Privacy Policy &amp; Security Model</h1>
          <p className="text-xs text-neutral-400">Zero-Knowledge Architecture • No Admin Access</p>
        </div>
      </div>

      <div className="space-y-6 text-xs text-neutral-300 leading-relaxed">
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Lock className="w-4 h-4" />
            <span>1. Zero-Knowledge Direct Messaging (E2EE)</span>
          </div>
          <p>
            Photogram implements a zero-knowledge communication model. Private direct messages are encrypted
            directly on your device using client-side Web Crypto algorithms (ECDH + AES-GCM 256).
            The private key stays strictly in your browser and is never transmitted to our servers.
            Even database administrators cannot view or decipher the contents of your messages.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <EyeOff className="w-4 h-4" />
            <span>2. Data Minimization &amp; No Third-Party Tracking</span>
          </div>
          <p>
            We do not sell your personal information or track your online activity across other websites.
            Data stored is limited to your public profile (username, avatar, bio), your published media posts,
            and your follows/likes to provide core social functionality.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <Server className="w-4 h-4" />
            <span>3. Cloud Storage &amp; Encryption in Transit</span>
          </div>
          <p>
            All network communication takes place over HTTPS/TLS 1.3 encryption. Public images and videos are
            delivered via high-speed global Content Delivery Networks with auto-compression. You have the right
            at any time to delete any post, story, or your entire account.
          </p>
        </div>
      </div>
    </div>
  );
}
