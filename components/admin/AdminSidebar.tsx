'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Users2,
  Building2,
  Swords,
  UserCog,
  Image,
  Video,
  MessageSquareWarning,
  Bell,
  HardDrive,
  BarChart3,
  Bot,
  ScrollText,
  ShieldCheck,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'News', href: '/admin/news', icon: Newspaper },
  { name: 'People', href: '/admin/people', icon: Users2 },
  { name: 'Businesses', href: '/admin/businesses', icon: Building2 },
  { name: 'Battles', href: '/admin/battles', icon: Swords },
  { name: 'Users', href: '/admin/users', icon: UserCog },
  { name: 'Gallery', href: '/admin/gallery', icon: Image },
  { name: 'Videos', href: '/admin/videos', icon: Video },
  { name: 'Comments & Reports', href: '/admin/comments', icon: MessageSquareWarning },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Storage', href: '/admin/storage', icon: HardDrive },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'AI Assistant', href: '/admin/ai', icon: Bot },
  { name: 'Activity Logs', href: '/admin/activity', icon: ScrollText },
  { name: 'Security', href: '/admin/security', icon: ShieldCheck },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-in fade-in-0"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              👑
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight">DHOTI AALE</span>
              <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">Control Panel</span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-500">
            Core Modules
          </div>

          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Public site link footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
