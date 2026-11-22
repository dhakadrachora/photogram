'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Check, User, BadgeCheck } from 'lucide-react';
import { usePosts } from '@/context/PostsContext';
import { useAuth, StoredAccount } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const { posts } = usePosts();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [registeredAccounts, setRegisteredAccounts] = useState<StoredAccount[]>([]);
  const [dbAccounts, setDbAccounts] = useState<
    Array<{ username: string; full_name: string; avatar_url: string; is_verified?: boolean }>
  >([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      if (raw) setRegisteredAccounts(JSON.parse(raw));
    } catch {}

    // Fetch real registered profiles from Supabase
    if (isSupabaseConfigured()) {
      supabase
        .from('profiles')
        .select('username, full_name, avatar_url, is_verified')
        .limit(25)
        .then(({ data }) => {
          if (data) {
            setDbAccounts(
              data.map((p) => ({
                username: p.username,
                full_name: p.full_name || '',
                avatar_url: p.avatar_url || '',
                is_verified: !!p.is_verified,
              }))
            );
          }
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real creators & registered accounts only - Zero fake accounts
  const allAccounts = [
    ...(user
      ? [
          {
            username: user.username,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
          },
        ]
      : []),
    ...registeredAccounts.map((a) => ({
      username: a.username,
      full_name: a.full_name,
      avatar_url: a.avatar_url,
      is_verified: a.is_verified,
    })),
    ...dbAccounts,
  ].filter(
    (v, idx, arr) =>
      arr.findIndex((t) => t.username.toLowerCase() === v.username.toLowerCase()) === idx
  );

  const matchedUsers = query.trim()
    ? allAccounts.filter(
        (a) =>
          a.username.toLowerCase().includes(query.toLowerCase()) ||
          a.full_name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedPosts = query.trim()
    ? posts.filter(
        (p) =>
          p.user?.username?.toLowerCase().includes(query.toLowerCase()) ||
          p.caption?.toLowerCase().includes(query.toLowerCase()) ||
          (p.location || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const suggestedAccounts = allAccounts
    .filter((a) => a.username.toLowerCase() !== user?.username?.toLowerCase())
    .slice(0, 5);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-start bg-black/60 backdrop-blur-sm animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm md:w-96 h-full bg-[#121212] border-r border-neutral-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white tracking-tight">Search</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="relative my-4">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search #hashtags, creators, places..."
            className="w-full pl-10 pr-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results / Suggestions */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          {query.trim() ? (
            <>
              {/* Accounts Matches */}
              {matchedUsers.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    Accounts
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {matchedUsers.map((acc) => (
                      <Link
                        key={acc.username}
                        href={`/profile/${acc.username}`}
                        onClick={onClose}
                        className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-neutral-900 transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                          {acc.avatar_url ? (
                            <Image
                              src={acc.avatar_url}
                              alt={acc.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white font-semibold text-xs">
                              {acc.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs">
                          <div className="font-semibold text-white flex items-center gap-1">
                            <span>{acc.username}</span>
                            {acc.is_verified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6] fill-[#0095f6]" />
                            )}
                          </div>
                          <p className="text-neutral-400 text-[11px]">{acc.full_name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Matches */}
              {matchedPosts.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    Posts ({matchedPosts.length})
                  </span>
                  <div className="mt-1.5 space-y-1.5">
                    {matchedPosts.slice(0, 8).map((p) => {
                      const firstMedia = p.media?.[0]?.media_url;
                      return (
                        <div
                          key={p.id}
                          onClick={onClose}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
                        >
                          {firstMedia && (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                              <Image
                                src={firstMedia}
                                alt="Post thumb"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="text-xs flex-1 truncate">
                            <span className="font-semibold text-white mr-1.5">
                              {p.user?.username}
                            </span>
                            <span className="text-neutral-400 text-[11px]">
                              {p.caption}
                            </span>
                            {p.location && (
                              <p className="text-[10px] text-neutral-500 truncate mt-0.5">
                                📍 {p.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedUsers.length === 0 && matchedPosts.length === 0 && (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No accounts or photos found for &quot;{query}&quot;
                </div>
              )}
            </>
          ) : (
            <div className="py-3">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                Suggested Accounts
              </span>
              {suggestedAccounts.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500">
                  No other registered creators yet
                </div>
              ) : (
                suggestedAccounts.map((s) => (
                  <Link
                    key={s.username}
                    href="/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-neutral-900 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                      {s.avatar_url ? (
                        <Image
                          src={s.avatar_url}
                          alt={s.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white font-semibold text-xs">
                          {s.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-white flex items-center gap-1">
                        <span>{s.username}</span>
                        {s.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
                      </div>
                      <p className="text-neutral-400 text-[11px]">{s.full_name || 'Creator'}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchDrawer;
