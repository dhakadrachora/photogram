'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { PostMedia } from '@/lib/types';

interface PostMediaCarouselProps {
  media: PostMedia[];
  activeIndex: number;
  onIndexChange: (idx: number) => void;
  showHeartPop: boolean;
  onDoubleTap: () => void;
  priority?: boolean;
}

export function PostMediaCarousel({
  media,
  activeIndex,
  onIndexChange,
  showHeartPop,
  onDoubleTap,
  priority = false,
}: PostMediaCarouselProps) {
  const current = media[activeIndex] || media[0];

  return (
    <div
      className="relative aspect-square w-full bg-neutral-950 overflow-hidden cursor-pointer select-none"
      onClick={onDoubleTap}
    >
      {current && (
        <Image
          src={current.media_url}
          alt="Post media"
          fill
          priority={priority || activeIndex === 0}
          loading={priority || activeIndex === 0 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 100vw, 470px"
          className="object-cover"
        />
      )}

      {/* Heart pop animation on double tap */}
      {showHeartPop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-24 h-24 fill-[#ff3040] text-[#ff3040] animate-heart-pop drop-shadow-2xl" />
        </div>
      )}

      {/* Multiple media arrows */}
      {media.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(activeIndex - 1);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {activeIndex < media.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(activeIndex + 1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {media.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === activeIndex ? 'bg-[#0095f6] scale-125' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PostMediaCarousel;
