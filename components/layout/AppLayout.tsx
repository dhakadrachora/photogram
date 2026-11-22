'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
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
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/accounts');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (isAuthPage) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
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
