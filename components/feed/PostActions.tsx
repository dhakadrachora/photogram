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
  onShareWhatsApp?: () => void;
}

export function PostActions({
  hasLiked = false,
  hasSaved = false,
  likesCount,
  onToggleLike,
  onToggleSave,
  onOpenComments,
  onShare,
  onShareWhatsApp,
}: PostActionsProps) {
  return (
    <div className="px-3 pt-3 select-none">
      {/* Action Icons Row */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3.5 text-white dark:text-white light:text-black">
          <button
            onClick={onToggleLike}
            className="group active:scale-75 transition-transform cursor-pointer"
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
            className="hover:text-neutral-400 active:scale-75 transition-transform cursor-pointer"
            aria-label="Comment on post"
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          <button
            onClick={onShare}
            className="hover:text-neutral-400 active:scale-75 transition-transform cursor-pointer"
            aria-label="Share post"
          >
            <Send className="w-6 h-6" />
          </button>

          {/* Direct WhatsApp Share Button */}
          {onShareWhatsApp && (
            <button
              onClick={onShareWhatsApp}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] transition-all cursor-pointer active:scale-90 border border-[#25D366]/30"
              title="Share on WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="text-[11px] font-bold">WhatsApp</span>
            </button>
          )}
        </div>

        <button
          onClick={onToggleSave}
          className="text-white dark:text-white light:text-black hover:text-neutral-400 active:scale-75 transition-transform cursor-pointer"
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
