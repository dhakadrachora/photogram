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
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavGroup {
  groupTitle: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Control Center',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'AI Assistant', href: '/admin/ai', icon: Bot, badge: 'AI ⚡', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
      { name: 'Activity Feed', href: '/admin/activity', icon: ScrollText },
    ],
  },
  {
    groupTitle: 'Community & Action',
    items: [
      { name: 'Battles Arena', href: '/admin/battles', icon: Swords, badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30' },
      { name: 'Resident Users', href: '/admin/users', icon: UserCog },
      { name: 'Reports & Support', href: '/admin/comments', icon: MessageSquareWarning },
      { name: 'Broadcast Notices', href: '/admin/notifications', icon: Bell },
    ],
  },
  {
    groupTitle: 'Content & Directory',
    items: [
      { name: 'Village News', href: '/admin/news', icon: Newspaper },
      { name: 'Hall of Fame', href: '/admin/people', icon: Users2 },
      { name: 'Local Businesses', href: '/admin/businesses', icon: Building2 },
      { name: 'Photo Gallery', href: '/admin/gallery', icon: Image },
      { name: 'Video Showcase', href: '/admin/videos', icon: Video },
    ],
  },
  {
    groupTitle: 'System & Infra',
    items: [
      { name: 'Cloud Storage', href: '/admin/storage', icon: HardDrive },
      { name: 'Security & RLS', href: '/admin/security', icon: ShieldCheck },
      { name: 'Portal Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden animate-in fade-in-0 duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#090D16] border-r border-white/8 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/6 shrink-0 bg-gradient-to-r from-amber-500/5 to-transparent">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
                👑
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-tight">DHOTI AALE</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold uppercase">
                  PRO
                </span>
              </div>
              <span className="block text-[10px] font-bold text-slate-400 tracking-wider">Super Admin Console</span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span>{group.groupTitle}</span>
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      {!isActive && (
                        <ChevronRight className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Public site pill */}
        <div className="p-3 border-t border-white/6 shrink-0 bg-[#070A11]">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Visit Live Portal</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </Link>
        </div>
      </aside>
    </>
  );
}
