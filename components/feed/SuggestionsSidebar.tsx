'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export const REAL_SUGGESTIONS = [
  {
    username: 'kabir.explores',
    name: 'Kabir Mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    relation: 'Suggested for you',
    is_verified: true,
  },
  {
    username: 'ananya.lens',
    name: 'Ananya Roy',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    relation: 'Popular creator in Photography',
    is_verified: true,
  },
  {
    username: 'zoya.spaces',
    name: 'Zoya Khan',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    relation: 'Popular creator in Architecture',
    is_verified: true,
  },
  {
    username: 'rohan.raw',
    name: 'Rohan Sen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    relation: 'Suggested for you',
    is_verified: true,
  },
  {
    username: 'vikram.aerials',
    name: 'Vikram Aditya',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    relation: 'New to Photogram',
    is_verified: true,
  },
];

export function SuggestionsSidebar() {
  const { user, updateProfile } = useAuth();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    try {
      const userKey = user.id || user.username;
      const stored = localStorage.getItem(`photogram_following_${userKey}`);
      if (stored) {
        setFollowingMap(JSON.parse(stored));
      } else {
        setFollowingMap({});
      }
    } catch (e) {
      setFollowingMap({});
    }
  }, [user]);

  const toggleFollow = (username: string) => {
    if (!user) return;
    const isFollowed = !!followingMap[username];
    const newFollowingMap = { ...followingMap, [username]: !isFollowed };
    setFollowingMap(newFollowingMap);

    const userKey = user.id || user.username;
    try {
      localStorage.setItem(`photogram_following_${userKey}`, JSON.stringify(newFollowingMap));
    } catch (e) {}

    // Calculate real following count based on active follows
    const activeFollowsCount = Object.values(newFollowingMap).filter(Boolean).length;
    updateProfile({ following_count: activeFollowsCount });
  };

  return (
    <aside className="hidden lg:block w-80 pl-8 pt-4 space-y-6 flex-shrink-0 select-none">
      {/* Current User Summary */}
      <div className="flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-neutral-700">
            <Image
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
              }
              alt={user?.username || 'User'}
              fill
              className="object-cover"
            />
          </div>
          <div className="truncate max-w-[140px]">
            <h4 className="font-semibold text-xs text-white hover:underline truncate">
              {user?.username}
            </h4>
            <p className="text-[11px] text-neutral-400 truncate">{user?.full_name}</p>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold text-[#0095f6] hover:text-sky-400 cursor-pointer"
        >
          Switch
        </Link>
      </div>

      {/* Suggested for You */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-400">Suggested for you</span>
          <Link href="/explore" className="font-semibold hover:underline text-[11px] text-white">
            See All
          </Link>
        </div>

        <div className="space-y-3.5">
          {REAL_SUGGESTIONS.map((item) => {
            const isFollowed = !!followingMap[item.username];
            return (
              <div key={item.username} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800">
                    <Image
                      src={item.avatar}
                      alt={item.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h5 className="font-semibold text-xs text-white hover:underline cursor-pointer">
                        {item.username}
                      </h5>
                      {item.is_verified && (
                        <span className="text-[#0095f6] text-[10px]">●</span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 max-w-[130px] truncate">
                      {item.relation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleFollow(item.username)}
                  className={`text-xs font-semibold transition-all cursor-pointer ${
                    isFollowed
                      ? 'text-neutral-400 hover:text-neutral-300'
                      : 'text-[#0095f6] hover:text-sky-400'
                  }`}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instagram Web Footer Links */}
      <div className="text-[11px] text-neutral-500 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:underline">About</a>
          <span>•</span>
          <a href="#" className="hover:underline">Help</a>
          <span>•</span>
          <a href="#" className="hover:underline">Press</a>
          <span>•</span>
          <a href="#" className="hover:underline">API</a>
          <span>•</span>
          <a href="#" className="hover:underline">Jobs</a>
          <span>•</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
          © 2026 PHOTOGRAM • PURE VISUAL WEB
        </p>
      </div>
    </aside>
  );
}

export default SuggestionsSidebar;
