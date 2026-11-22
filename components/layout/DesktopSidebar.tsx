'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SidebarBrand } from './SidebarBrand';
import { SidebarItem } from './SidebarItem';
import { SidebarMoreMenu } from './SidebarMoreMenu';

interface DesktopSidebarProps {
  onOpenCreate: () => void;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
}

export function DesktopSidebar({
  onOpenCreate,
  onOpenNotifications,
  onOpenSearch,
}: DesktopSidebarProps) {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <aside className="hidden md:flex flex-col justify-between fixed top-0 left-0 h-screen w-18 xl:w-60 border-r border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] px-3 py-5 z-40 transition-all select-none">
      <div className="space-y-6">
        <SidebarBrand />

        <nav className="space-y-1">
          <SidebarItem label="Home" href="/" icon={Home} isActive={pathname === '/'} />
          <SidebarItem label="Search" action={onOpenSearch} icon={Search} />
          <SidebarItem label="Explore" href="/explore" icon={Compass} isActive={pathname === '/explore'} />
          <SidebarItem
            label="Messages"
            href="/direct"
            icon={MessageCircle}
            isActive={pathname.startsWith('/direct')}
            badge={2}
          />
          <SidebarItem label="Notifications" action={onOpenNotifications} icon={Heart} hasNotification />
          <SidebarItem label="Create" action={onOpenCreate} icon={PlusSquare} />
          <SidebarItem label="Profile" href="/profile" isProfile isActive={pathname === '/profile'} user={user} />
        </nav>
      </div>

      <div className="relative">
        <SidebarMoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />

        <button
          onClick={() => setShowMoreMenu((prev) => !prev)}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:text-white dark:hover:text-white light:hover:text-black transition-all cursor-pointer"
        >
          <Menu className="w-6 h-6 stroke-[1.8]" />
          <span className="hidden xl:inline text-sm font-normal tracking-tight">More</span>
        </button>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
