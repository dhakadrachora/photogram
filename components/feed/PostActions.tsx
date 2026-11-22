'use client';

import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

interface PostActionsProps {
  hasLiked?: boolean;
  hasSaved?: boolean;
  likesCount: number;
  commentsCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onOpenComments: () => void;
  onShare: () => void;
}

export function PostActions({
  hasLiked = false,
  hasSaved = false,
  likesCount,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onShare,
}: PostActionsProps) {
  return (
    <div className="px-3 pt-3">
      {/* Action Icons Row */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-4 text-white dark:text-white light:text-black">
          <button
            onClick={onToggleLike}
            className="group active:scale-75 transition-transform"
            aria-label="Like post"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                hasLiked
                  ? 'fill-[#ff3040] text-[#ff3040]'
                  : 'hover:text-neutral-400'
              }`}
            />
          </button>

          <button
            onClick={onOpenComments}
            className="hover:text-neutral-400 active:scale-75 transition-transform"
            aria-label="Comment on post"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          <button
            onClick={onShare}
            className="hover:text-neutral-400 active:scale-75 transition-transform"
            aria-label="Share post"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={onToggleSave}
          className="text-white dark:text-white light:text-black hover:text-neutral-400 active:scale-75 transition-transform"
          aria-label="Save post"
        >
          <Bookmark
            className={`w-6 h-6 ${
              hasSaved ? 'fill-white dark:fill-white light:fill-black' : ''
            }`}
          />
        </button>
      </div>

      {/* Likes Count */}
      <p className="text-xs font-semibold text-white dark:text-white light:text-black">
        {likesCount.toLocaleString()} likes
      </p>
    </div>
  );
}

export default PostActions;
