'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  UploadCloud,
  Check,
  MapPin,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost } = usePosts();
  const { user, updateProfile } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) return;

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      let mediaUrl = previewUrl || '';

      // Direct upload to Cloudinary Free Tier with progress callback
      if (selectedFile) {
        const result = await uploadToCloudinary(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        mediaUrl = result.secure_url;
      }

      createPost({
        user_id: user?.id || 'usr_me',
        user: user || ({} as any),
        caption,
        location,
        media: [
          {
            id: `m_${Date.now()}`,
            media_url: mediaUrl,
            media_type: 'image',
            display_order: 0,
          },
        ],
      });
      updateProfile({ posts_count: (user?.posts_count ?? 0) + 1 });

      setIsDone(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Photo upload error:', err);
      // Local fallback
      createPost({
        user_id: user?.id || 'usr_me',
        user: user || ({} as any),
        caption,
        location,
        media: [
          {
            id: `m_${Date.now()}`,
            media_url: previewUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
            media_type: 'image',
            display_order: 0,
          },
        ],
      });
      setIsDone(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setLocation('');
    setIsDone(false);
    setUploadProgress(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#262626] border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-900">
          <span className="text-sm font-semibold text-white">Create new photo post</span>
          <button
            onClick={onClose}
            aria-label="Close create"
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {isDone ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-white">Photo Shared!</h3>
              <p className="text-xs text-neutral-400 mt-1">Your photo post has been published to the feed.</p>
            </div>
          ) : !previewUrl ? (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-600 hover:border-[#0095f6] rounded-xl p-8 py-14 text-center cursor-pointer transition-colors bg-neutral-900/50"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">
                Drag photos here
              </h4>
              <p className="text-xs text-neutral-400 mb-4 max-w-xs">
                Supports JPG, PNG, WebP with free fast Cloudinary compression
              </p>

              <button
                type="button"
                className="px-4 py-2 bg-[#0095f6] hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition-colors"
              >
                Select from computer
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview & Caption Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-700">
                <Image
                  src={previewUrl}
                  alt="Upload preview"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                    <span>Uploading photo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0095f6] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Caption Input */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#0095f6] transition-colors resize-none"
                />
              </div>

              {/* Location Input */}
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#0095f6] hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <span>Share Photo</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateModal;
