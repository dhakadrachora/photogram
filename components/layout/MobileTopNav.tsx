'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface MobileTopNavProps {
  onOpenNotifications: () => void;
}

export function MobileTopNav({ onOpenNotifications }: MobileTopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 md:hidden w-full h-14 bg-[#000000]/95 dark:bg-[#000000]/95 light:bg-[#ffffff]/95 backdrop-blur-md border-b border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] px-4 flex items-center justify-between transition-colors">
      {/* Brand Name & App Icon */}
      <Link href="/" className="flex items-center gap-2.5 font-serif font-black text-2xl tracking-tight text-white dark:text-white light:text-black select-none">
        <div className="w-7 h-7 rounded-lg overflow-hidden shadow ring-1 ring-white/10 shrink-0">
          <Image
            src="/app-logo.png"
            alt="Photogram"
            width={28}
            height={28}
            priority
            className="object-cover w-full h-full"
          />
        </div>
        <span>Photogram</span>
      </Link>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        {/* Quick Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-full text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Heart Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 rounded-full text-white dark:text-white light:text-black hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
        >
          <Heart className="w-6 h-6 stroke-[1.8]" />
        </button>

        {/* Messenger Direct Link */}
        <Link
          href="/direct"
          className="relative p-1.5 rounded-full text-white dark:text-white light:text-black hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
        >
          <MessageCircle className="w-6 h-6 stroke-[1.8]" />
        </Link>
      </div>
    </header>
  );
}
