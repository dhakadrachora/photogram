'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, Swords, MessageSquare, User } from 'lucide-react';

export function AppBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      hindiLabel: 'होम',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'News',
      hindiLabel: 'खबरें',
      href: '/news',
      icon: Newspaper,
      isActive: pathname.startsWith('/news'),
    },
    {
      label: 'Battle',
      hindiLabel: 'बैटल',
      href: '/battle',
      icon: Swords,
      isActive: pathname.startsWith('/battle'),
      hasBadge: true,
      badgeText: 'Live',
    },
    {
      label: 'Chat',
      hindiLabel: 'चौपाल',
      href: '/chat',
      icon: MessageSquare,
      isActive: pathname.startsWith('/chat'),
    },
    {
      label: 'Profile',
      hindiLabel: 'प्रोफ़ाइल',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile') || pathname.startsWith('/login'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bottom-nav-glass pb-safe">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-300 ${
                active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Glow Pill */}
              {active && (
                <div className="absolute -top-1 w-8 h-1 rounded-full bg-cyan-400 shadow-[0_0_12px_#00E5FF] transition-all" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`p-1 rounded-lg transition-transform duration-300 ${
                    active ? 'scale-110' : 'scale-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      active
                        ? 'text-cyan-400 stroke-[2.4] drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]'
                        : 'stroke-[1.8]'
                    }`}
                  />
                </div>

                {/* Optional Live Badge */}
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-red-600 text-white ring-2 ring-[#05070D] animate-pulse">
                    {item.badgeText}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-all font-medium ${
                  active ? 'font-bold text-cyan-300' : 'text-slate-400'
                }`}
              >
                {item.hindiLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
