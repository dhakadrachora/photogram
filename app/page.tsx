'use client';

import React from 'react';
import { usePosts } from '@/context/PostsContext';
import { PostCard } from '@/components/feed/PostCard';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { SuggestionsSidebar } from '@/components/feed/SuggestionsSidebar';
import { CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function HomePage() {
  const { posts } = usePosts();

  return (
    <div className="flex justify-center w-full max-w-5xl mx-auto px-0 sm:px-4 py-4 md:py-8">
      {/* Center Feed Column */}
      <div className="w-full max-w-[470px] sm:max-w-[500px] flex flex-col items-center">
        {/* Horizontal Stories Tray */}
        <StoriesBar />

        {/* Zero-Algorithm Chronological Feed Banner */}
        <div className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-neutral-900/60 to-purple-950/40 border border-blue-500/25 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-[11px]">
                  Zero-Algorithm Chronological Feed
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-300 font-bold uppercase tracking-wider">
                  100% Reach
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Every photo reaches 100% of your followers in real time. Zero suppression.
              </p>
            </div>
          </div>
        </div>

        {/* Posts Stream */}
        <div className="w-full space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400 bg-neutral-950">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
              <p className="text-sm font-semibold text-white">No photos in your feed yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Share your first photo using the Create (+) button on the sidebar!
              </p>
            </div>
          )}

          {/* End of Feed "All Caught Up" Instagram Badge */}
          {posts.length > 0 && (
            <div className="py-10 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-base font-semibold text-white">You&apos;re all caught up</h3>
              <p className="text-xs text-neutral-400 max-w-xs mt-1">
                You&apos;ve seen all new photos from the accounts you follow.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Desktop Suggestions Sidebar */}
      <div className="hidden lg:block w-[320px] pl-10">
        <SuggestionsSidebar />
      </div>
    </div>
  );
}
