import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | DHOTI AALE',
  description: 'Official Contact Us page of DHOTI AALE - Get in touch with our village administration and technical support.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/contact',
  },
};

export default function ContactPage() {
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
            <Mail className="h-3.5 w-3.5" />
            <span>संपर्क करें (Contact Us)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Contact DHOTI AALE Administration
          </h1>
          <p className="text-xs text-stone-500">
            Have questions, feedback, or need community assistance? We are here to help.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <Mail className="h-4 w-4" />
              <span>आधिकारिक ईमेल (Official Email)</span>
            </div>
            <p className="text-stone-900 font-mono font-bold text-xs select-all">
              rohitdhakaddhoti143@gmail.com
            </p>
            <p className="text-stone-500 text-[11px]">
              Response within 24 to 48 business hours.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <MapPin className="h-4 w-4" />
              <span>मुख्यालय पता (Location)</span>
            </div>
            <p className="text-stone-900 font-bold text-xs">
              ग्राम ढोटी (Village Dhoti)
            </p>
            <p className="text-stone-500 text-[11px]">
              जिला/राज्य: राजस्थान (Rajasthan), India - 325001
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <MessageSquare className="h-4 w-4" />
              <span>लाइव 24/7 सहायता (Live Support)</span>
            </div>
            <p className="text-stone-900 font-bold text-xs">
              पोर्टल सपोर्ट टिकट सिस्टम
            </p>
            <p className="text-stone-500 text-[11px]">
              वेबसाइट के <Link href="/support" className="text-amber-700 underline font-semibold">24/7 Support Desk</Link> पर तुरंत सहायता टिकट दर्ज करें।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <Clock className="h-4 w-4" />
              <span>संचालन समय (Operating Hours)</span>
            </div>
            <p className="text-stone-900 font-bold text-xs">
              सोमवार से रविवार (24x7 Digital Access)
            </p>
            <p className="text-stone-500 text-[11px]">
              गाँव चौपाल एवं बैटल एरीना 24 घंटे लाइव हैं।
            </p>
          </div>
        </div>

        {/* Founder statement */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-stone-700 space-y-1">
          <div className="font-black text-stone-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <span>प्रतिबद्धता (Our Commitment):</span>
          </div>
          <p>
            हम अपने समुदाय के प्रत्येक सदस्य के प्रश्नों और सुझावों का स्वागत करते हैं। किसी भी तकनीकी असुविधा, फोटो बैटल संबंधित समस्या या स्थानीय समाचार प्रसारण के लिए ऊपर दिए गए ईमेल पर बेझिझक संपर्क करें।
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} DHOTI AALE. All rights reserved.
        </div>
      </div>
    </div>
  );
}
