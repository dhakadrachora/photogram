'use client';

import React, { useEffect, useState } from 'react';
import { checkAdminDetailedSession } from '@/lib/admin/auth';
import { AdminUserSession } from '@/lib/admin/types';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface AdminGuardProps {
  children: (session: AdminUserSession) => React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [session, setSession] = useState<AdminUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Direct login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const checkAuth = async () => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await checkAdminDetailedSession();
      if (result.status === 'authenticated_admin' && result.session) {
        setSession(result.session);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
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
      const cleanPassword = loginPassword;

      if (!cleanEmail || !cleanPassword) {
        setLoginError('कृपया ईमेल और पासवर्ड दर्ज करें।');
        setIsSubmitting(false);
        return;
      }

      // Perform authentication with Supabase
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (signInErr || !data?.session) {
        setLoginError('अमान्य क्रेडेंशियल्स। कृपया सही ईमेल और पासवर्ड दर्ज करें।');
        setIsSubmitting(false);
        return;
      }

      // Re-check admin session verification
      const verifyResult = await checkAdminDetailedSession();
      if (verifyResult.status === 'authenticated_admin' && verifyResult.session) {
        setSession(verifyResult.session);
      } else {
        // Log out immediately if the user is authenticated in Auth but not authorized as the sole site owner
        await supabase.auth.signOut();
        try {
          localStorage.removeItem('dhoti_admin_token');
        } catch {}
        setSession(null);
        setLoginError('अनाधिकृत खाता। यह टर्मिनल केवल अधिकृत सिस्टम एडमिनिस्ट्रेटर के लिए है।');
      }
    } catch {
      setLoginError('सत्यापन के दौरान त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080E] flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 animate-pulse">
          <Shield className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <span>सुरक्षित टर्मिनल प्रारंभ हो रहा है...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated / Locked Admin Login Screen (No emails revealed, No forgot/signup links)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#06080E] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient Glows */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">DHOTI AALE Control Terminal</h2>
            <p className="text-xs text-slate-400 tracking-wide">अधिकृत सिस्टम एडमिनिस्ट्रेटर लॉगिन</p>
          </div>

          {/* Login Error Alert */}
          {loginError && (
            <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-900/50 text-left flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Login Form: ONLY Login, No signup, No forgot password */}
          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                एडमिनिस्ट्रेटर ईमेल (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="username"
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
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
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
                  <span>प्रमाणीकरण किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-slate-950" />
                  <span>सुरक्षित लॉगिन करें (Authenticate & Enter)</span>
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
              <span>वेबसाइट पर वापस जाएँ (Return to Home)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Session!
  return <>{children(session)}</>;
}
