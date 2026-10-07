import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'Contact Us | DHOTI AALE',
  description: 'Official Contact Us page of DHOTI AALE - Get in touch with our village administration and technical support.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/contact',
  },
};

export default function ContactPage() {
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
              <Mail className="h-3.5 w-3.5" />
              <span>संपर्क करें (Contact Us)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-hindi">
              Contact DHOTI AALE
            </h1>
            <p className="text-xs text-slate-400 font-hindi">
              गाँव प्रशासन, तकनीकी सहायता या प्रतिक्रिया के लिए हमसे संपर्क करें।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Mail className="h-4 w-4" />
                <span>आधिकारिक ईमेल (Email)</span>
              </div>
              <p className="text-white font-mono font-bold text-xs select-all">
                rohitdhakaddhoti143@gmail.com
              </p>
              <p className="text-slate-400 text-[11px]">
                24 से 48 घंटे के भीतर उत्तर दिया जाता है।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1726] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <MapPin className="h-4 w-4" />
                <span>स्थान (Location)</span>
              </div>
              <p className="text-white font-bold text-xs">
                ढोटी गाँव, हाड़ौती संभाग, राजस्थान (323803)
              </p>
              <p className="text-slate-400 text-[11px]">
                Village Digital Help Desk
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-3">
            <h3 className="font-bold text-white text-sm font-hindi flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>सीधी सहायता चाहते हैं?</span>
            </h3>
            <p className="text-xs text-slate-300 font-hindi leading-relaxed">
              आप ऐप में <strong>गाँव चौपाल (World Chat)</strong> या <strong>Dhoti AI वॉइस असिस्टेंट</strong> के ज़रिए भी सवाल पूछ सकते हैं।
            </p>
            <div className="flex gap-3 pt-1">
              <Link
                href="/chat"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all active:scale-95"
              >
                चौपाल चैट खोलें
              </Link>
              <Link
                href="/ai"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all"
              >
                AI से बात करें
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} DHOTI AALE. All rights reserved.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
