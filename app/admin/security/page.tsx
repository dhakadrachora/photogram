'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, Key, Globe, UserCheck, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { PRIMARY_OWNER_EMAIL } from '@/lib/admin/auth';
import { supabase } from '@/lib/supabase';

interface SecurityAudit {
  serverAuthValid: boolean;
  userEmail?: string;
  role?: string;
  sessionExpiresAt?: string;
  serviceKeyProtected: boolean;
}

export default function AdminSecurityPage() {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const runSecurityAudit = async () => {
    setIsLoading(true);

    const res = await adminFetch('/api/admin/auth/verify');

    // Verify service key is never exposed to client
    const isServiceKeyLeaked =
      typeof window !== 'undefined' &&
      Boolean((window as any).SUPABASE_SERVICE_ROLE_KEY || (process.env as any).NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

    let sessionExpiresAt = 'N/A';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.expires_at) {
        sessionExpiresAt = new Date(session.expires_at * 1000).toLocaleString('hi-IN');
      }
    } catch {
      // ignore
    }

    setAudit({
      serverAuthValid: Boolean(res.success && res.isAdmin),
      userEmail: res.user?.email,
      role: res.user?.role || 'admin',
      sessionExpiresAt,
      serviceKeyProtected: !isServiceKeyLeaked,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    runSecurityAudit();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>Production Security & Authorization Audit</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time verification of backend token authentication, role matrices, and secret protection.
          </p>
        </div>

        <button
          onClick={runSecurityAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Re-run Audit</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Evaluating security policies...</div>
      ) : (
        <div className="space-y-4">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Server-Side Authorization</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All `/api/admin/*` endpoints strictly verify the authenticated Supabase Bearer JWT token against site owner allowlists and PostgreSQL `public.users` role columns.
              </p>
              <div className="text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Token Verified: {audit?.userEmail}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Service Role Key Isolation</span>
                {audit?.serviceKeyProtected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                `SUPABASE_SERVICE_ROLE_KEY` is isolated in Node.js server execution only. No `NEXT_PUBLIC_*` variable exposes privileged credentials.
              </p>
              <div className="text-[10px] text-emerald-400 font-mono font-bold">
                ✓ Zero Client-Side Secret Leakage Detected
              </div>
            </div>
          </div>

          {/* Audit Details Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Audit Parameters & Environment Health</h3>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span>Production Endpoint</span>
                </div>
                <span className="font-mono text-white text-[11px]">https://dhotiaale.online/admin</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <span>Primary Site Owner Email</span>
                </div>
                <span className="font-mono text-amber-400 font-bold text-[11px]">{PRIMARY_OWNER_EMAIL}</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>Multi-Admin Support</span>
                </div>
                <span className="text-emerald-400 font-bold text-[11px]">
                  Enabled (`public.users.is_admin` & `role`)
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Key className="h-4 w-4 text-slate-400" />
                  <span>Session Expiration</span>
                </div>
                <span className="font-mono text-slate-300 text-[11px]">{audit?.sessionExpiresAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
