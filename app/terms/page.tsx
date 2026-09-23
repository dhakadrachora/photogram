import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | DHOTI AALE',
  description: 'Terms and Conditions of DHOTI AALE community portal, Photo Battles, AI Assistant, and Gaon Choupal.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/terms',
  },
};

export default function TermsPage() {
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
            <FileCheck className="h-3.5 w-3.5" />
            <span>नियम व शर्तें (Terms & Conditions)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            DHOTI AALE Terms & Conditions
          </h1>
          <p className="text-xs text-stone-500 font-mono">
            Last Updated: September 2026 | Governing Law: India
          </p>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing and using <strong>DHOTI AALE</strong> (accessible at{' '}
              <a href="https://www.dhotiaale.online" className="text-amber-700 underline">
                https://www.dhotiaale.online
              </a>
              ), you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>2. Community Guidelines & Code of Conduct</span>
            </h2>
            <p>DHOTI AALE is a proud community platform. All users must adhere to respectful community standards:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>No hate speech, abusive language, or harassment in the Gaon Choupal (World Chat) or battle comments.</li>
              <li>No uploading of offensive, vulgar, copyright-infringing, or unlawful photographs.</li>
              <li>Any user violating community peace or dignity will have their account and verification permanently suspended.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>3. Photo Battle Arena Rules & Voting</span>
            </h2>
            <p>
              Participation in Photo Battles is voluntary and intended for community entertainment.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Each resident agrees that their uploaded photo may be viewed and voted upon by community members.</li>
              <li>Votes are tracked in real-time. Automated bot voting, script manipulation, or fraudulent votes are strictly prohibited and will be disqualified.</li>
              <li>Battle rewards, certificates, and recognition are awarded at the sole discretion of the administration based on verified community votes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>4. Intellectual Property Rights</span>
            </h2>
            <p>
              The design, logos, trademarks, and source code of DHOTI AALE are the property of DHOTI AALE. Users retain ownership of their uploaded photographs but grant DHOTI AALE a non-exclusive license to display them for the purpose of community battles and user profiles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>5. Disclaimer & Limitation of Liability</span>
            </h2>
            <p>
              DHOTI AALE is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. While we endeavor to keep village news and AI assistance accurate, we do not warrant the absolute completeness or reliability of user-submitted content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>6. Contact Us</span>
            </h2>
            <p>
              For legal inquiries, terms clarification, or copyright reports, contact:
            </p>
            <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs font-mono space-y-1 text-stone-700">
              <div><strong>Platform:</strong> DHOTI AALE (https://www.dhotiaale.online)</div>
              <div><strong>Administrator:</strong> DHOTI AALE Team</div>
              <div><strong>Email:</strong> rohitdhakaddhoti143@gmail.com</div>
              <div><strong>Location:</strong> Dhoti, Rajasthan, India</div>
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
