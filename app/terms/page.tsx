import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'Terms and Conditions | DHOTI AALE',
  description: 'Terms and Conditions of DHOTI AALE community portal, Photo Battles, AI Assistant, and Gaon Choupal.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/terms',
  },
};

export default function TermsPage() {
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
              <FileCheck className="h-3.5 w-3.5" />
              <span>नियम व शर्तें (Terms & Conditions)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-hindi">
              DHOTI AALE Terms & Conditions
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Last Updated: 2026 | Governing Law: India
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-hindi">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>1. Acceptance of Terms</span>
              </h2>
              <p>
                By accessing and using <strong>DHOTI AALE</strong> (accessible at{' '}
                <a href="https://www.dhotiaale.online" className="text-cyan-400 underline">
                  https://www.dhotiaale.online
                </a>
                ), you agree to comply with and be bound by these Terms and Conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>2. Community Guidelines</span>
              </h2>
              <p>
                गाँव चौपाल (World Chat) और फोटो बैटल में सभी सदस्यों को सम्मानजनक भाषा का प्रयोग करना अनिवार्य है। अभद्र भाषा, स्पैमिंग या दुर्भावनापूर्ण व्यवहार पर खाता ब्लॉक किया जा सकता है।
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
