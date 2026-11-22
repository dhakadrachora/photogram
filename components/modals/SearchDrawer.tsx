'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Check } from 'lucide-react';
import { MOCK_POSTS } from '@/lib/mock-data';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = MOCK_POSTS.filter(
    (p) =>
      p.user.username.toLowerCase().includes(query.toLowerCase()) ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-start bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="w-full sm:w-96 h-screen bg-[#121212] dark:bg-[#121212] light:bg-[#ffffff] border-r border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] p-5 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 light:border-black/10">
          <h2 className="text-xl font-bold text-white dark:text-white light:text-black">Search</h2>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-full text-slate-400 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mt-4 relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 dark:bg-white/10 light:bg-black/5 text-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accounts, tags, places..."
              className="w-full bg-transparent text-white dark:text-white light:text-black placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-white/5 dark:divide-white/5 light:divide-black/5">
          {query ? (
            results.map((p) => (
              <Link
                key={p.id}
                href={`/#post-${p.id}`}
                onClick={onClose}
                className="flex items-center gap-3 py-3 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 px-2 rounded-xl transition-colors"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-800">
                  <Image src={p.user.avatar_url} alt={p.user.username} fill className="object-cover" unoptimized />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-white dark:text-white light:text-black flex items-center gap-1">
                    <span>{p.user.username}</span>
                    {p.user.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
                  </h4>
                  <p className="text-slate-400 truncate max-w-[200px]">{p.caption}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Recent searches will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
