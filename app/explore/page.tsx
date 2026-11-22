'use client';

import React, { useState, useEffect } from 'react';
import { usePosts } from '@/context/PostsContext';
import { Search, Heart, MessageCircle, Copy, X, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FormattedText } from '@/components/common/FormattedText';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const EXPLORE_TAGS = [
  'For you',
  'Architecture',
  'Travel',
  'Design',
  'Art',
  'Portraits',
  'Nature',
  'Street',
  'Technology',
];

export default function ExplorePage() {
  const { posts } = usePosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('For you');
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    author: string;
    likes: number;
    comments: number;
    caption: string;
  } | null>(null);

  const [matchedCreators, setMatchedCreators] = useState<
    Array<{ id?: string; username: string; full_name: string; avatar_url: string; is_verified?: boolean }>
  >([]);
  const [suggestedCreators, setSuggestedCreators] = useState<
    Array<{ id?: string; username: string; full_name: string; avatar_url: string; is_verified?: boolean }>
  >([]);

  // (b) Fetch real suggested creators on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setSuggestedCreators(data);
        });
    }
  }, []);

  // (b) Direct Live Supabase ILIKE Search on Query Change
  useEffect(() => {
    const clean = searchQuery.trim().replace(/^@/, '').replace(/^#/, '').toLowerCase();
    if (!clean) {
      setMatchedCreators([]);
      return;
    }

    if (isSupabaseConfigured()) {
      supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%`)
        .limit(12)
        .then(({ data }) => {
          if (data) setMatchedCreators(data);
        });
    }
  }, [searchQuery]);

  // Read URL query parameter (?q=hashtag or username) on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setSearchQuery(q);
      }
    }
  }, []);

  // 100% Real Community Posts - Zero Mock Photos
  const combinedPhotos = posts.flatMap((p) =>
    p.media.map((m, idx) => ({
      id: `${p.id}_${idx}`,
      url: m.media_url,
      likes: p.likes_count,
      comments: p.comments_count,
      author: p.user?.username || 'user',
      caption: p.caption || '',
    }))
  );

  const filteredPhotos = combinedPhotos.filter((item) => {
    // If tag is not 'For you', match against caption
    if (activeTag !== 'For you') {
      const tagMatch = item.caption.toLowerCase().includes(activeTag.toLowerCase());
      if (!tagMatch && !searchQuery.trim()) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().replace(/^#/, '').replace(/^@/, '');
    return (
      item.author.toLowerCase().includes(q) ||
      item.caption.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 py-4 md:py-8 select-none">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto mb-4 px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search #hashtags, @creators, or photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs pl-10 pr-9 py-2.5 rounded-xl outline-none focus:border-neutral-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Horizontal Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 px-2">
        {EXPLORE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setActiveTag(tag);
              if (tag !== 'For you') {
                setSearchQuery(tag);
              } else {
                setSearchQuery('');
              }
            }}
            className={`text-xs px-4 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              activeTag === tag
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Real-time Matching Creators (Direct from Supabase Profiles) */}
      {searchQuery.trim() && matchedCreators.length > 0 && (
        <div className="mb-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-3 px-1">
            Matching Creators ({matchedCreators.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {matchedCreators.map((creator) => (
              <Link
                key={creator.username}
                href={`/profile/${creator.username}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition-colors group cursor-pointer"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                  {creator.avatar_url ? (
                    <Image src={creator.avatar_url} alt={creator.username} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-white font-semibold text-xs">
                      {creator.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-xs truncate">
                  <div className="font-semibold text-white flex items-center gap-1 group-hover:underline">
                    <span>{creator.username}</span>
                    {creator.is_verified && <span className="text-[#0095f6] text-[10px]">●</span>}
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">{creator.full_name || 'Photogram Creator'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Explore Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {filteredPhotos.map((item, index) => {
          const isFeatured = index % 10 === 2;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className={`relative group cursor-pointer overflow-hidden bg-neutral-900 ${
                isFeatured ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
              }`}
            >
              <Image
                src={item.url}
                alt={item.caption || 'Explore photo'}
                fill
                sizes="(max-width: 768px) 33vw, 300px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {index % 3 === 0 && (
                <div className="absolute top-2 right-2 z-10 text-white drop-shadow-md">
                  <Copy className="w-4 h-4 fill-white" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-semibold text-xs md:text-sm z-10">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-5 h-5 fill-white text-white" />
                  <span>{item.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-5 h-5 fill-white text-white" />
                  <span>{item.comments}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="text-center py-20 px-4 bg-neutral-900/30 border border-neutral-800/60 rounded-2xl max-w-lg mx-auto my-8">
          <p className="text-sm font-semibold text-white">No photos found</p>
          <p className="text-xs text-neutral-400 mt-1.5">
            {searchQuery
              ? `No results matching "${searchQuery}". Try another hashtag or tag.`
              : 'Be the first creator to share an HD photo on Photogram!'}
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-xs font-semibold px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg transition-colors"
          >
            Create First Post
          </Link>
        </div>
      )}

      {/* Detail Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media side */}
            <div className="relative w-full md:w-3/5 bg-black aspect-square md:aspect-auto">
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                fill
                className="object-contain"
              />
            </div>

            {/* Details side */}
            <div className="w-full md:w-2/5 p-4 flex flex-col justify-between">
              <div>
                <Link
                  href={`/profile/${selectedPhoto.author}`}
                  onClick={() => setSelectedPhoto(null)}
                  className="flex items-center gap-2 pb-3 border-b border-neutral-800 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {selectedPhoto.author?.[0] || 'U'}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white group-hover:underline">
                      {selectedPhoto.author}
                    </span>
                    <p className="text-[10px] text-neutral-400">View profile</p>
                  </div>
                </Link>

                <div className="py-4 text-xs text-neutral-200 leading-relaxed border-b border-neutral-800 max-h-[200px] overflow-y-auto">
                  <span className="font-semibold text-white mr-1.5">
                    {selectedPhoto.author}
                  </span>
                  <FormattedText text={selectedPhoto.caption} />
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-4 text-xs font-semibold text-neutral-300">
                  <span>{selectedPhoto.likes.toLocaleString()} likes</span>
                  <span>{selectedPhoto.comments} comments</span>
                </div>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
