'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Swords, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { signOutSupabase } from '@/lib/supabase';

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Battles', href: '/admin/battles', icon: Swords },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-stone-950 text-stone-200 border-r border-stone-800 transition-transform lg:translate-x-0">
      <div className="flex h-16 items-center justify-between px-6 border-b border-stone-800/60">
        <span className="text-lg font-black text-white tracking-tight">Admin<span className="text-amber-500">Panel</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-amber-500' : 'text-stone-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800/60">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-stone-400 transition-colors hover:bg-stone-900 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5 text-stone-500" />
          Back to Website
        </Link>
        <button
          onClick={() => {
            signOutSupabase();
            window.location.href = '/';
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/30 hover:text-red-300 mt-2"
        >
          <LogOut className="h-5 w-5 text-red-500/70" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
