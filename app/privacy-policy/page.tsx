import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | DHOTI AALE',
  description: 'Official Privacy Policy of DHOTI AALE - Learn how we protect resident data, cookies, and adhere to Google AdSense privacy compliance.',
  alternates: {
    canonical: 'https://www.dhotiaale.online/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <Shield className="h-3.5 w-3.5" />
            <span>गोपनीयता नीति (Privacy Policy)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            DHOTI AALE Privacy Policy
          </h1>
          <p className="text-xs text-stone-500 font-mono">
            Last Updated: September 2026 | Effective Date: Immediately
          </p>
        </div>

        {/* Body Content */}
        <div className="space-y-6 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>1. Introduction & Overview</span>
            </h2>
            <p>
              Welcome to <strong>DHOTI AALE</strong> (accessible at{' '}
              <a href="https://www.dhotiaale.online" className="text-amber-700 underline">
                https://www.dhotiaale.online
              </a>
              ). We value your privacy and are committed to safeguarding the personal information of all village residents, visitors, and participants who use our digital community portal, Photo Battles, AI Assistant, and Gaon Choupal.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how we use it, and how we comply with applicable digital privacy standards and <strong>Google AdSense Publisher Policies</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>2. Information We Collect</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Profile & Authentication Data:</strong> When you register or sign in via Google OAuth, we receive your name, email address, and profile photo avatar for account creation and verified resident badges.
              </li>
              <li>
                <strong>User Content:</strong> Photos submitted to the Photo Battle Arena, chat messages posted in Gaon Choupal (World Chat), and interaction feedback.
              </li>
              <li>
                <strong>Log Files & Technical Analytics:</strong> Standard log files including IP addresses, browser type, Internet Service Provider (ISP), date/time stamps, referring/exit pages, and device operating system to analyze trends and prevent spam.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>3. Cookies & Advertising Policy (Google AdSense Compliance)</span>
            </h2>
            <p>
              DHOTI AALE uses standard web cookies to enhance user sessions, preserve language preferences, and ensure seamless navigation.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <h3 className="font-bold text-amber-900 text-xs sm:text-sm">
                Google DoubleClick DART Cookies & Third-Party Advertising:
              </h3>
              <p className="text-xs text-amber-800">
                Google, as a third-party vendor, uses cookies to serve ads on our site. Google’s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
              </p>
              <p className="text-xs text-amber-800">
                Users may opt out of personalized advertising by visiting Google’s{' '}
                <a
                  href="https://adssettings.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                >
                  Ads Settings
                </a>{' '}
                or the Network Advertising Initiative opt-out page.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>4. How We Use Your Information</span>
            </h2>
            <p>We use the collected information exclusively to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and optimize the DHOTI AALE platform and PWA application.</li>
              <li>Operate fair, live public voting in the Photo Battle Arena.</li>
              <li>Enable real-time communication in the Gaon Choupal (World Chat).</li>
              <li>Deliver important village announcements, emergency circulars, and support assistance.</li>
              <li>Prevent unauthorized activity, spam, and platform abuse.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>5. Children's Privacy Protection (COPPA)</span>
            </h2>
            <p>
              Protecting the privacy of children is important to us. DHOTI AALE does not knowingly collect personally identifiable information from children under the age of 13. If you believe your child has provided such information, please contact us immediately and we will promptly remove it from our database.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <span>6. Contact Information</span>
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to our site administration:
            </p>
            <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs font-mono space-y-1 text-stone-700">
              <div><strong>Platform:</strong> DHOTI AALE (https://www.dhotiaale.online)</div>
              <div><strong>Site Owner & Administrator:</strong> DHOTI AALE Team</div>
              <div><strong>Official Email:</strong> rohitdhakaddhoti143@gmail.com</div>
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
