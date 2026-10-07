'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Download, Copy, Check } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';

export default function UPIQRPage() {
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('Dhoti Shop');
  const [amount, setAmount] = useState('');

  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}${amount ? `&am=${encodeURIComponent(amount)}` : ''}&cu=INR`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiId ? upiString : 'upi://pay?pa=demo@upi'
  )}`;

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
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-hindi">
                UPI Payment QR Generator
              </h1>
              <p className="text-xs text-slate-400">
                अपनी दुकान या खाते के लिए तुरंत PhonePe, Paytm, GooglePay QR बनाएं।
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                UPI ID (VPA):
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@okhdfcbank या 9876543210@paytm"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  दुकान / खाताधारक का नाम:
                </label>
                <input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="रोहित किराना स्टोर"
                  className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  रुपये (वैकल्पिक Fixed Amount):
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ 100"
                  className="w-full px-4 py-3 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {upiId && (
              <div className="p-6 rounded-2xl bg-[#070B14] border border-white/10 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-xl text-center">
                  <span className="text-xs font-bold text-slate-800 block mb-2 font-mono">
                    {payeeName}
                  </span>
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain mx-auto"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block mt-2">
                    {upiId}
                  </span>
                </div>

                <a
                  href={qrUrl}
                  target="_blank"
                  download="upi-qr.png"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  QR कोड इमेज डाउनलोड करें
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
