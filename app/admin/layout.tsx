'use client';

import React, { useState } from 'react';
import { ToastProvider } from '@/components/admin/Toast';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <AdminGuard>
        {(session) => (
          <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-amber-500/6 via-amber-600/3 to-transparent blur-3xl pointer-events-none rounded-full" />
            <div className="fixed bottom-0 left-64 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/4 via-sky-500/3 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Sidebar */}
            <AdminSidebar
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col flex-1 min-w-0 relative z-10">
              <AdminHeader
                session={session}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              />

              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-300">
                <AdminErrorBoundary fallbackTitle="Administrative Module Error">
                  {children}
                </AdminErrorBoundary>
              </main>
            </div>
          </div>
        )}
      </AdminGuard>
    </ToastProvider>
  );
}
