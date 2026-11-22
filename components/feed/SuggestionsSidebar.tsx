'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified?: boolean;
}

export function SuggestionsSidebar() {
  const { user, updateProfile } = useAuth();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real users from Supabase profiles
  useEffect(() => {
    const fetchRealUsers = async () => {
      setIsLoading(true);
      if (!isSupabaseConfigured()) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .limit(5);

        if (user?.id) {
          query = query.neq('id', user.id);
        }

        const { data, error } = await query;
        if (!error && data) {
          setSuggestions(data as SuggestedUser[]);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.warn('Failed to fetch suggestions:', e);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealUsers();
  }, [user?.id]);

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
    } catch {
      setFollowingMap({});
    }
  }, [user]);

  const toggleFollow = async (targetUser: SuggestedUser) => {
    if (!user) return;
    const isFollowed = !!followingMap[targetUser.username];
    const newFollowingMap = { ...followingMap, [targetUser.username]: !isFollowed };
    setFollowingMap(newFollowingMap);

    const userKey = user.id || user.username;
    try {
      localStorage.setItem(`photogram_following_${userKey}`, JSON.stringify(newFollowingMap));
    } catch {}

    // Calculate real following count based on active follows
    const activeFollowsCount = Object.values(newFollowingMap).filter(Boolean).length;
    updateProfile({ following_count: activeFollowsCount });

    // Sync with Supabase followers table if configured
    if (isSupabaseConfigured() && user.id && user.id !== 'usr_me') {
      try {
        if (!isFollowed) {
          await supabase.from('followers').insert({
            follower_id: user.id,
            following_id: targetUser.id,
          });
        } else {
          await supabase
            .from('followers')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUser.id);
        }
      } catch (err) {
        console.warn('Supabase follower sync note:', err);
      }
    }
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

      {/* Suggested for You (100% Real Users) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-400">Suggested for you</span>
          <Link href="/explore" className="font-semibold hover:underline text-[11px] text-white">
            See All
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800" />
                  <div className="space-y-1.5">
                    <div className="w-20 h-3 rounded bg-neutral-800" />
                    <div className="w-14 h-2.5 rounded bg-neutral-800" />
                  </div>
                </div>
                <div className="w-12 h-4 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-4 px-3 text-center bg-neutral-900/40 rounded-xl border border-neutral-800/80">
            <p className="text-xs text-neutral-300 font-medium">No other creators yet</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Real creators will appear here as they register on Photogram.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {suggestions.map((item) => {
              const isFollowed = !!followingMap[item.username];
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <Link href={`/profile/${item.username}`} className="flex items-center gap-3 group">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800">
                      <Image
                        src={
                          item.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
                        }
                        alt={item.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h5 className="font-semibold text-xs text-white group-hover:underline cursor-pointer">
                          {item.username}
                        </h5>
                        {item.is_verified && (
                          <span className="text-[#0095f6] text-[10px]">●</span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 max-w-[130px] truncate">
                        {item.full_name || 'Photogram Creator'}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => toggleFollow(item)}
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
        )}
      </div>

      {/* Photogram Web Footer Links */}
      <div className="text-[11px] text-neutral-500 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/about" className="hover:underline">About</Link>
          <span>•</span>
          <Link href="/help" className="hover:underline">Help</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
          © 2026 PHOTOGRAM • PURE VISUAL WEB
        </p>
      </div>
    </aside>
  );
}

export default SuggestionsSidebar;
