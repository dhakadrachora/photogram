'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import { Profile } from '@/lib/types';

interface SidebarItemProps {
  label: string;
  href?: string;
  action?: () => void;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: number;
  hasNotification?: boolean;
  isProfile?: boolean;
  user?: Profile | null;
}

export function SidebarItem({
  label,
  href,
  action,
  icon: Icon,
  isActive = false,
  badge,
  hasNotification = false,
  isProfile = false,
  user,
}: SidebarItemProps) {
  const content = (
    <div
      className={`group flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
        isActive
          ? 'font-bold text-white dark:text-white light:text-black bg-white/10 dark:bg-white/10 light:bg-black/5'
          : 'text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 hover:text-white dark:hover:text-white light:hover:text-black'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {isProfile ? (
          <div
            className={`w-6 h-6 rounded-full overflow-hidden p-[1.5px] ${
              isActive ? 'ring-2 ring-white dark:ring-white light:ring-black' : ''
            }`}
          >
            <Image
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.username || 'Profile'}
              width={24}
              height={24}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        ) : (
          Icon && (
            <Icon
              className={`w-6 h-6 transition-transform group-hover:scale-105 ${
                isActive ? 'stroke-[2.8]' : 'stroke-[1.8]'
              }`}
            />
          )
        )}

        {/* Badge Notification */}
        {badge ? (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#ff3040] text-white ring-2 ring-black">
            {badge}
          </span>
        ) : null}

        {hasNotification ? (
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#ff3040] ring-2 ring-black" />
        ) : null}
      </div>

      <span className="hidden xl:inline text-sm font-normal group-hover:font-medium tracking-tight transition-all">
        {label}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        data-testid={`nav-${label.toLowerCase()}`}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action}
      aria-label={label}
      data-testid={`nav-${label.toLowerCase()}`}
      className="w-full text-left cursor-pointer"
    >
      {content}
    </button>
  );
}

export default SidebarItem;
