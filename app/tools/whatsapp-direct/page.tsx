'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, Copy, Check } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function WhatsAppDirectPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('राम-राम सा!');

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedNumber = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

  const handleOpen = () => {
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सभी टूल्स (All Tools)</span>
        </Link>

        <div className="rounded-3xl bg-[#0B1220] border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                WhatsApp Direct Chat
              </h1>
              <p className="text-xs text-slate-400">
                बिना नंबर सेव किए सीधे किसी भी व्हाट्सएप नंबर पर चैट शुरू करें।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                मोबाइल नंबर (10 Digit Mobile Number):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                संदेश (Optional Message):
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="अपना संदेश यहाँ लिखें..."
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 font-hindi"
              />
            </div>

            <button
              onClick={handleOpen}
              className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp पर चैट खोलें</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
