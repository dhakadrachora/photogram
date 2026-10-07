import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | DHOTI AALE',
  description: 'Official Privacy Policy of DHOTI AALE - Learn how we protect resident data, cookies, and adhere to Google AdSense privacy compliance.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>होमपेज पर वापस जाएँ (Back to Home)</span>
          </Link>
        </div>

        <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="space-y-2 border-b border-white/10 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Shield className="h-3.5 w-3.5" />
              <span>गोपनीयता नीति (Privacy Policy)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-hindi">
              DHOTI AALE Privacy Policy
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Last Updated: 2026 | Governing Law: India
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-hindi">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>1. Introduction & Overview</span>
              </h2>
              <p>
                Welcome to <strong>DHOTI AALE</strong> (accessible at{' '}
                <a href="https://www.dhotiaale.online" className="text-cyan-400 underline">
                  https://www.dhotiaale.online
                </a>
                ). We value your privacy and are committed to safeguarding the personal information of all village residents, visitors, and participants who use our digital community portal, Photo Battles, AI Assistant, and Gaon Choupal.
              </p>
              <p>
                This Privacy Policy explains what information we collect, how we use it, and how we comply with applicable digital privacy standards.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>2. Information We Collect</span>
              </h2>
              <p>
                - Profile details: Name, email address, optional avatar image, and community role.
                <br />
                - Community contributions: Battles voting history, 24-hour Choupal chat messages, and reward claims.
                <br />
                - Passwords are encrypted directly through Supabase Auth and never stored in plain text.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} DHOTI AALE. All rights reserved.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
