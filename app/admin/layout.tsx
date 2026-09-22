'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isSiteAdmin } from '@/lib/admin-auth';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsChecking(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isSiteAdmin(session.user.email)) {
          if (isMounted) setIsAuthorized(true);
        }
      } catch (err) {
        console.warn('Admin route protection error:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }

    checkAuth();
    return () => { isMounted = false; };
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-stone-900 mb-2">Unauthorized Access</h1>
        <p className="text-stone-500 text-center max-w-md mb-8">
          Only the Super Admin can access the admin dashboard. If you believe this is an error, please log in with the correct credentials.
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto min-h-screen">
        <div className="mx-auto max-w-6xl w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
