'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Profile } from '@/lib/types';

interface PostHeaderProps {
  user: Profile;
  location?: string;
  onOpenMenu?: () => void;
}

export function PostHeader({ user, location, onOpenMenu }: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3">
      <Link href="/profile" className="flex items-center gap-3 group">
        <div className="relative w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]">
          <div className="w-full h-full rounded-full overflow-hidden bg-black p-[1.5px]">
            <Image
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user.username}
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white dark:text-white light:text-black group-hover:opacity-75">
              {user.username}
            </span>
            {user.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
          </div>
          {location && (
            <span className="text-[10px] text-neutral-400 -mt-0.5">{location}</span>
          )}
        </div>
      </Link>

      <button
        onClick={onOpenMenu}
        className="p-1 rounded-full text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer"
        aria-label="More options"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}

export default PostHeader;
