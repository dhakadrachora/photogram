import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Sparkles, Award, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { AppShell } from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'About Us | DHOTI AALE',
  description: 'About DHOTI AALE - The story, vision, and team behind Rajasthan’s digital village community portal.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/about',
  },
};

export default function AboutPage() {
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
              <Users className="h-3.5 w-3.5" />
              <span>हमारे बारे में (About Us)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-hindi">
              About DHOTI AALE (ढोटी आले)
            </h1>
            <p className="text-xs text-slate-400">
              ढोटी गांव की खबरें, लोग, जानकारी और गतिविधियां एक जगह।
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-hindi">
            <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3.5">
              <Sparkles className="h-6 w-6 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-black text-white">
                  हमारा संकल्प (Our Mission)
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  <strong>DHOTI AALE</strong> की स्थापना राजस्थान के ढोटी गाँव और आसपास के क्षेत्रों को एक आधुनिक, सुरक्षित और आत्मनिर्भर डिजिटल मंच देने के उद्देश्य से की गई है। यहाँ हर ग्रामीण नागरिक, युवा और प्रवासी अपनी बात रख सकते हैं, गाँव की खबरें पा सकते हैं और अपनी प्रतिभा दिखा सकते हैं।
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-white">
                1. हम क्या प्रदान करते हैं (Core Offerings)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-xl border border-white/10 bg-[#0D1726] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>⚔️ फोटो बैटल (Photo Battles)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    युवाओं के लिए 1v1 फोटो मुकाबला, जिसमें पूरा गाँव वोट देकर विजेता चुनता है।
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0D1726] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>🎙️ DHOTI AALE AI असिस्टेंट</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    हाड़ौती, राजस्थानी व हिंदी में बात करने वाला आधुनिक देसी AI साथी।
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0D1726] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>💬 गाँव चौपाल (World Chat)</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    24 घंटे खुली रहने वाली डिजिटल चौपाल जहाँ ग्रामीण आपस में जुड़े रहते हैं।
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-white/10 bg-[#0D1726] space-y-1">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>📰 गाँव समाचार व 20+ टूल्स</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    सत्यापित ग्राम पंचायत समाचार और सोशल मीडिया के लिए उपयोगी टूल्स।
                  </p>
                </div>
              </div>
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
