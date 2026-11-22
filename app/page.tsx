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
