'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileTopNav } from './MobileTopNav';
import { MobileBottomNav } from './MobileBottomNav';
import { CreateModal } from '@/components/modals/CreateModal';
import { NotificationsModal } from '@/components/modals/NotificationsModal';
import { SearchDrawer } from '@/components/modals/SearchDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/accounts');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Authentication Guard: If not logged in and not on auth page, redirect to /login
  useEffect(() => {
    if (!isLoading && !user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, isLoading, isAuthPage, router]);

  // Auth pages (login, signup, reset) render without the main app chrome
  if (isAuthPage) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  // Splash loading screen while verifying persistent session
  if (isLoading || (!user && !isAuthPage)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white select-none">
        <h1 className="text-3xl font-serif italic mb-4">Photogram</h1>
        <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] text-white dark:text-white light:text-[#262626] font-sans antialiased transition-colors">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Mobile Top Navigation */}
      <MobileTopNav onOpenNotifications={() => setIsNotificationsOpen(true)} />

      {/* Main Content Area */}
      <main className="md:pl-18 xl:pl-60 min-h-screen pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenCreate={() => setIsCreateOpen(true)} />

      {/* Global Modals & Drawers */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <SearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export default AppLayout;
