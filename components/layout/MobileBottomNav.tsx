'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MobileBottomNavProps {
  onOpenCreate: () => void;
}

export function MobileBottomNav({ onOpenCreate }: MobileBottomNavProps) {
  const pathname = usePathname() || '';
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden h-14 bg-[#000000]/95 dark:bg-[#000000]/95 light:bg-[#ffffff]/95 backdrop-blur-md border-t border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] px-6 flex items-center justify-between pb-safe transition-colors">
      {/* 1. Home */}
      <Link href="/" className="p-2 text-white dark:text-white light:text-black">
        <Home
          className={`w-6 h-6 ${
            pathname === '/' ? 'stroke-[2.8]' : 'stroke-[1.8] opacity-70'
          }`}
        />
      </Link>

      {/* 2. Explore */}
      <Link href="/explore" className="p-2 text-white dark:text-white light:text-black">
        <Compass
          className={`w-6 h-6 ${
            pathname === '/explore' ? 'stroke-[2.8]' : 'stroke-[1.8] opacity-70'
          }`}
        />
      </Link>

      {/* 3. Create (+) Button */}
      <button
        onClick={onOpenCreate}
        className="p-1.5 rounded-xl text-white dark:text-white light:text-black active:scale-90 transition-transform cursor-pointer"
        aria-label="Create Photo Post"
      >
        <PlusSquare className="w-7 h-7 stroke-[1.8]" />
      </button>

      {/* 4. Messages (Direct) */}
      <Link href="/direct" className="p-2 text-white dark:text-white light:text-black">
        <MessageCircle
          className={`w-6 h-6 ${
            pathname.startsWith('/direct') ? 'stroke-[2.8]' : 'stroke-[1.8] opacity-70'
          }`}
        />
      </Link>

      {/* 5. Profile Avatar */}
      <Link href="/profile" className="p-1 text-white dark:text-white light:text-black">
        <div
          className={`relative w-7 h-7 rounded-full overflow-hidden p-[1px] ${
            pathname === '/profile' ? 'ring-2 ring-white dark:ring-white light:ring-black' : ''
          }`}
        >
          <Image
            src={
              user?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            }
            alt="Profile"
            width={28}
            height={28}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
