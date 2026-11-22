'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Check, MapPin, Hash, Sparkles } from 'lucide-react';
import { Post } from '@/lib/types';
import { usePosts } from '@/context/PostsContext';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const { updatePost } = usePosts();
  const [caption, setCaption] = useState(post.caption || '');
  const [location, setLocation] = useState(post.location || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const firstMedia = post.media?.[0]?.media_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const res = await updatePost(post.id, {
      caption: caption.trim(),
      location: location.trim(),
    });

    setIsSaving(false);
    if (!res.success) {
      setError(res.error || 'Failed to update post.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 600);
  };

  const addHashtag = (tag: string) => {
    setCaption((prev) => (prev ? `${prev} #${tag}` : `#${tag}`));
  };

  const POPULAR_TAGS = ['photography', 'lifestyle', 'reels', 'travel', 'vibes', 'explore'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#262626] border border-neutral-700 rounded-2xl p-5 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <h3 className="font-semibold text-sm">Edit Post</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="mt-3 p-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Post updated successfully! ✨</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Post preview thumbnail */}
          {firstMedia && (
            <div className="flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                <Image src={firstMedia} alt="Thumbnail" fill className="object-cover" />
              </div>
              <div className="text-xs text-neutral-400 leading-snug">
                <p className="font-semibold text-white">Editing media caption</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Only you (the post author) can modify this post.
                </p>
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Caption & Hashtags
              </label>
              <span className="text-[10px] text-neutral-500">{caption.length}/2200</span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption... Use #hashtags and @mentions"
              maxLength={2200}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none focus:border-[#0095f6] resize-none"
            />
          </div>

          {/* Quick Hashtag Pills */}
          <div>
            <p className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#0095f6]" />
              <span>Tap to add trending hashtags:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => addHashtag(tag)}
                  className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location (e.g. Mumbai, India)"
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white outline-none focus:border-[#0095f6]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPostModal;
