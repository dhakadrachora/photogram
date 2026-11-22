'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Pause, Play, Heart, Send } from 'lucide-react';
import { Story } from '@/lib/types';

export interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories?: Story[];
  initialIndex?: number;
}

export function StoryViewerModal({
  isOpen,
  onClose,
  stories = [],
  initialIndex = 0,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
    setIsLiked(false);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setIsLiked(false);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setIsLiked(false);
    }
  }, [currentIndex]);

  // Progress timer for auto-advance (5 seconds per story)
  useEffect(() => {
    if (!isOpen || stories.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, stories.length, isPaused, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused((p) => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Top Close Button */}
      <button
        onClick={onClose}
        aria-label="Close story viewer"
        className="absolute top-4 right-4 z-50 p-2 text-white/80 hover:text-white rounded-full bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Story Container (Instagram 9:16 vertical card) */}
      <div
        className="relative w-full max-w-[420px] h-[90vh] max-h-[820px] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* User Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80">
              <Image
                src={
                  currentStory.user?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={currentStory.user?.username || 'User'}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-white">
                  {currentStory.user?.username || 'story_user'}
                </span>
                {currentStory.user?.is_verified && (
                  <span className="text-[#0095f6] text-[10px]">●</span>
                )}
              </div>
              <span className="text-[10px] text-white/70">Recently</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-1 text-white/80 hover:text-white"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Media (Image) */}
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <Image
            src={currentStory.media_url}
            alt={currentStory.caption || 'Story'}
            fill
            priority
            className="object-cover"
          />

          {/* Left/Right Tap Areas */}
          <div
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-16 bottom-20 w-2/3 z-20 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {/* Story Bottom Reply & Like Bar */}
        <div className="absolute bottom-4 left-3 right-3 z-30 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs">
            <input
              type="text"
              placeholder={`Reply to ${currentStory.user?.username || 'story'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-transparent text-white placeholder-white/60 outline-none"
            />
            {replyText.trim() && (
              <button
                onClick={() => setReplyText('')}
                className="text-xs font-semibold text-[#0095f6] ml-2"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsLiked((l) => !l)}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:text-red-500 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
          </button>
        </div>

        {/* Navigation Arrows for Desktop */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white items-center justify-center transition-colors z-40"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white items-center justify-center transition-colors z-40"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export default StoryViewerModal;
