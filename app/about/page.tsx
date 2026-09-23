import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Sparkles, Award, Heart, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | DHOTI AALE',
  description: 'About DHOTI AALE - The story, vision, and team behind Rajasthan’s digital village community portal.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-xl">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>होमपेज पर वापस जाएँ (Back to Home)</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2 border-b border-stone-200 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Users className="h-3.5 w-3.5" />
            <span>हमारे बारे में (About Us)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            About DHOTI AALE (ढोटी आले)
          </h1>
          <p className="text-xs text-stone-500">
            Connecting tradition with innovation in rural Rajasthan.
          </p>
        </div>

        {/* Story Section */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <Sparkles className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-black text-stone-900">
                हमारा संकल्प (Our Mission)
              </h2>
              <p className="text-stone-700 leading-relaxed">
                <strong>DHOTI AALE</strong> की स्थापना राजस्थान के ढोटी गाँव और आसपास के क्षेत्रों को एक आधुनिक, सुरक्षित और आत्मनिर्भर डिजिटल मंच देने के उद्देश्य से की गई है। यहाँ हर ग्रामीण नागरिक, युवा और प्रवासी अपनी बात रख सकते हैं, गाँव की खबरें पा सकते हैं और अपनी प्रतिभा दिखा सकते हैं।
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900">
              1. हम क्या प्रदान करते हैं (Core Offerings)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <span>⚔️ फोटो बैटल (Photo Battles)</span>
                </div>
                <p className="text-xs text-stone-500">
                  युवाओं के लिए स्वस्थ और मनोरंजक 1v1 फोटो मुकाबला, जिसमें पूरा गाँव वोट देकर विजेता चुनता है।
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <span>🤖 DHOTI AALE AI असिस्टेंट</span>
                </div>
                <p className="text-xs text-stone-500">
                  आधुनिक एआई तकनीक जो हिंदी और क्षेत्रीय भाषा में सवालों के जवाब और सरकारी योजनाओं की जानकारी देती है।
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <span>💬 गाँव चौपाल (World Chat)</span>
                </div>
                <p className="text-xs text-stone-500">
                  24 घंटे खुली रहने वाली डिजिटल चौपाल जहाँ देश-विदेश के ग्रामीण आपस में जुड़े रहते हैं।
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <span>📰 गाँव समाचार व नोटिस</span>
                </div>
                <p className="text-xs text-stone-500">
                  ग्राम पंचायत की सूचनाएँ, मौसम, कृषि मंडियों के भाव और त्यौहारों का लाइव अपडेट।
                </p>
              </div>
            </div>
          </section>

          {/* Founder Profile */}
          <section className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-stone-900">
              2. नेतृत्व एवं संस्थापक (Leadership & Team)
            </h2>
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shrink-0">
                DA
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-base font-black text-stone-900">DHOTI AALE Team</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Administrator & Community 👑
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  ढोटी गाँव के डिजिटल सशक्तिकरण के स्वप्नदृष्टा। हमारा लक्ष्य राजस्थान के हर गाँव को हाई-टेक, पारदर्शी और आपस में जुड़ा हुआ बनाना है।
                </p>
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    <span>Dhoti, Rajasthan</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    <span>rohitdhakaddhoti143@gmail.com</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} DHOTI AALE. All rights reserved.
        </div>
      </div>
    </div>
  );
}
