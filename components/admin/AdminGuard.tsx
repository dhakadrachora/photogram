'use client';

import React, { useEffect, useState } from 'react';
import { checkAdminDetailedSession, PRIMARY_OWNER_EMAIL } from '@/lib/admin/auth';
import { AdminUserSession } from '@/lib/admin/types';
import { supabase } from '@/lib/supabase';
import {
  ShieldAlert,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Crown,
  KeyRound,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface AdminGuardProps {
  children: (session: AdminUserSession) => React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [session, setSession] = useState<AdminUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<
    'authenticated_admin' | 'unauthenticated' | 'unauthorized_user'
  >('unauthenticated');
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Direct login form state
  const [loginEmail, setLoginEmail] = useState(PRIMARY_OWNER_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const checkAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await checkAdminDetailedSession();
      setAuthStatus(result.status);
      setCurrentEmail(result.currentEmail);
      setSession(result.session);
      if (result.error) setError(result.error);
    } catch (err: any) {
      setAuthStatus('unauthenticated');
      setError(err?.message || 'Failed to authenticate admin session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      if (cleanEmail !== PRIMARY_OWNER_EMAIL.toLowerCase()) {
        setLoginError(`केवल मुख्य एडमिन (${PRIMARY_OWNER_EMAIL}) ही इस पोर्टल में लॉगिन कर सकते हैं।`);
        setIsSubmitting(false);
        return;
      }

      if (!loginPassword) {
        setLoginError('कृपया पासवर्ड दर्ज करें।');
        setIsSubmitting(false);
        return;
      }

      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (signInErr || !data?.session) {
        setLoginError(
          signInErr?.message === 'Invalid login credentials'
            ? 'गलत पासवर्ड या ईमेल। कृपया सही पासवर्ड दर्ज करें।'
            : (signInErr?.message || 'लॉगिन विफल रहा। कृपया पुनः प्रयास करें।')
        );
        setIsSubmitting(false);
        return;
      }

      // Successful login! Re-verify and unlock
      await checkAuth();
    } catch (err: any) {
      setLoginError(err?.message || 'लॉगिन के दौरान त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      try {
        localStorage.removeItem('dhoti_user');
        localStorage.removeItem('dhoti_admin_token');
      } catch {}
      setSession(null);
      setAuthStatus('unauthenticated');
      setCurrentEmail(null);
      setLoginEmail(PRIMARY_OWNER_EMAIL);
      setLoginPassword('');
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 animate-pulse">
          <Lock className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <span>Verifying Admin Authorization...</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Checking session token against authorized admin directory</p>
      </div>
    );
  }

  // 2. Unauthorized screen (user is logged in, but with a different non-owner email)
  if (authStatus === 'unauthorized_user') {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-400">DHOTI AALE Secure Administration Portal</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>वर्तमान लॉगिन अकाउंट:</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-amber-400 truncate bg-slate-900 p-2 rounded-xl border border-slate-800">
              {currentEmail || 'Unknown Account'}
            </p>
            <p className="text-[11px] text-red-300/80 leading-relaxed">
              यह एडमिन पोर्टल केवल अधिकृत साइट ओनर (<span className="text-amber-300 font-semibold">{PRIMARY_OWNER_EMAIL}</span>) के लिए आरक्षित है।
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-slate-950" />
              <span>खाता बदलें और एडमिन लॉगिन करें</span>
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>वेबसाइट पर वापस जाएँ (Return to Public Site)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated screen (direct interactive login form right on /admin)
  if (authStatus === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Crown className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">DHOTI AALE Admin</h2>
            <p className="text-xs text-slate-400">साइट ओनर क्रेडेंशियल्स दर्ज करके प्रवेश करें</p>
          </div>

          {/* Login Error Alert */}
          {loginError && (
            <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-900/50 text-left flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                एडमिन ईमेल (Admin Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="rohitdhakaddhoti132@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                पासवर्ड (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>सत्यापन किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-slate-950" />
                  <span>एडमिन लॉगिन करें (Sign In)</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>वेबसाइट पर वापस जाएँ (Return to Public Site)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated admin!
  return <>{children(session)}</>;
}
