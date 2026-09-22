'use client';

import React, { useEffect, useState } from 'react';
import { getClientAdminSession } from '@/lib/admin/auth';
import { AdminUserSession } from '@/lib/admin/types';
import { ShieldAlert, ArrowLeft, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface AdminGuardProps {
  children: (session: AdminUserSession) => React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [session, setSession] = useState<AdminUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      setIsLoading(true);
      setError(null);

      try {
        const adminSession = await getClientAdminSession();
        if (!isMounted) return;

        if (adminSession) {
          setSession(adminSession);
        } else {
          setError('Admin authorization required. Your account is not recognized as an authorized site owner or administrator.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to authenticate admin session.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
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

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-400">DHOTI AALE Secure Administration Portal</p>
          </div>

          <p className="text-xs sm:text-sm text-red-300/90 leading-relaxed bg-red-950/40 p-3 rounded-xl border border-red-900/30 text-left">
            {error || 'Access Denied: You do not possess administrator credentials.'}
          </p>

          <div className="pt-2 space-y-2">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
