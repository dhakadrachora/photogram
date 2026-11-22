'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Check, User, BadgeCheck } from 'lucide-react';
import { usePosts } from '@/context/PostsContext';
import { useAuth, StoredAccount } from '@/context/AuthContext';
import { REAL_SUGGESTIONS } from '@/components/feed/SuggestionsSidebar';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const { posts } = usePosts();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [registeredAccounts, setRegisteredAccounts] = useState<StoredAccount[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      if (raw) setRegisteredAccounts(JSON.parse(raw));
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  // Combined creators & accounts
  const allAccounts = [
    ...(user ? [{ username: user.username, full_name: user.full_name, avatar_url: user.avatar_url, is_verified: user.is_verified }] : []),
    ...registeredAccounts.map((a) => ({
      username: a.username,
      full_name: a.full_name,
      avatar_url: a.avatar_url,
      is_verified: a.is_verified,
    })),
    ...REAL_SUGGESTIONS.map((s) => ({
      username: s.username,
      full_name: s.name,
      avatar_url: s.avatar,
      is_verified: s.is_verified,
    })),
  ].filter((v, idx, arr) => arr.findIndex((t) => t.username.toLowerCase() === v.username.toLowerCase()) === idx);

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
          p.user.username.toLowerCase().includes(query.toLowerCase()) ||
          p.caption.toLowerCase().includes(query.toLowerCase()) ||
          (p.location || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-start bg-black/60 backdrop-blur-sm animate-in fade-in select-none"
    >
      <div
        className="w-full sm:w-96 h-screen bg-[#121212] border-r border-[#262626] p-5 shadow-2xl flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Search</h2>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mt-4 relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accounts, tags, places..."
              className="w-full bg-transparent text-white text-xs placeholder:text-neutral-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5 text-neutral-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-neutral-900 no-scrollbar">
          {query.trim() ? (
            <>
              {/* Users Header */}
              {matchedUsers.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    Accounts
                  </span>
                  {matchedUsers.map((u) => (
                    <Link
                      key={u.username}
                      href="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                        <Image
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <span>{u.username}</span>
                          {u.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
                        </div>
                        <p className="text-neutral-400 text-[11px] truncate max-w-[180px]">
                          {u.full_name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Posts Header */}
              {matchedPosts.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2">
                    Photos & Posts
                  </span>
                  {matchedPosts.map((p) => (
                    <Link
                      key={p.id}
                      href="/"
                      onClick={onClose}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                        <Image
                          src={p.media[0]?.media_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100'}
                          alt="Post thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs flex-1 min-w-0">
                        <span className="font-semibold text-white truncate block">
                          @{p.user.username}
                        </span>
                        <p className="text-neutral-400 text-[11px] truncate max-w-[200px]">
                          {p.caption}
                        </p>
                      </div>
                    </Link>
                  ))}
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
              {REAL_SUGGESTIONS.map((s) => (
                <Link
                  key={s.username}
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-neutral-900 transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                    <Image src={s.avatar} alt={s.username} fill className="object-cover" />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-white flex items-center gap-1">
                      <span>{s.username}</span>
                      {s.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
                    </div>
                    <p className="text-neutral-400 text-[11px]">{s.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchDrawer;
