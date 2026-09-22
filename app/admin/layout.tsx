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
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
            {/* Sidebar (desktop fixed, mobile drawer) */}
            <AdminSidebar
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main view container */}
            <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
              <AdminHeader
                session={session}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              />

              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                <AdminErrorBoundary fallbackTitle="Error loading admin section">
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
