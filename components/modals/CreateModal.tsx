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
  ChevronLeft,
  ChevronRight,
  Film,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { uploadToCloudinary, validateFreeTierMedia, FREE_TIER_LIMITS } from '@/lib/cloudinary';
import { usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { PostMedia } from '@/lib/types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost } = usePosts();
  const { user, updateProfile } = useAuth();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ url: string; isVideo: boolean }[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFiles = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(filesList);
    // Validate each file against Free Tier limits
    for (const f of filesArray) {
      const check = validateFreeTierMedia(f);
      if (!check.valid) {
        setErrorMessage(check.error || 'File exceeds Free Tier limits.');
        return;
      }
    }

    setSelectedFiles(filesArray);
    const previews = filesArray.map((f) => ({
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video'),
    }));
    setPreviewUrls(previews);
    setActivePreviewIdx(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 && previewUrls.length === 0) return;

    setIsSubmitting(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const mediaList: PostMedia[] = [];

      // Upload each file to Cloudinary with overall progress tracking
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const res = await uploadToCloudinary(file, (percent) => {
          const totalProgress = Math.round(
            ((i * 100) + percent) / selectedFiles.length
          );
          setUploadProgress(totalProgress);
        });

        mediaList.push({
          id: `m_${Date.now()}_${i}`,
          media_url: res.secure_url,
          media_type: res.resource_type,
          display_order: i,
        });
      }

      // If no files were uploaded but previewUrls exists (local mock)
      if (mediaList.length === 0 && previewUrls.length > 0) {
        previewUrls.forEach((p, idx) => {
          mediaList.push({
            id: `m_${Date.now()}_${idx}`,
            media_url: p.url,
            media_type: p.isVideo ? 'video' : 'image',
            display_order: idx,
          });
        });
      }

      createPost({
        user_id: user?.id || 'usr_me',
        user: user || ({} as any),
        caption,
        location,
        media: mediaList,
      });

      if (user) {
        updateProfile({ posts_count: (user.posts_count ?? 0) + 1 });
      }

      setIsDone(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setActivePreviewIdx(0);
    setCaption('');
    setLocation('');
    setIsDone(false);
    setUploadProgress(null);
    setErrorMessage(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#262626] border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Create new post or reel</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Free Tier Safe
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close create"
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isDone ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-white">Shared Successfully!</h3>
              <p className="text-xs text-neutral-400 mt-1">Your post is now live on the feed.</p>
            </div>
          ) : previewUrls.length === 0 ? (
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
                Drag photos or videos here
              </h4>
              <p className="text-xs text-neutral-400 mb-2 max-w-xs leading-relaxed">
                Supports single or multiple carousel images (JPG, PNG, WebP) and MP4 videos
              </p>
              <span className="text-[10px] text-neutral-500 mb-4">
                Cloudinary Free Tier Guard: Max 10MB per image, 50MB per video
              </span>

              <button
                type="button"
                className="px-4 py-2 bg-[#0095f6] hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                Select from computer
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview Carousel & Caption Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-700">
                {previewUrls[activePreviewIdx]?.isVideo ? (
                  <video
                    src={previewUrls[activePreviewIdx]?.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={previewUrls[activePreviewIdx]?.url || ''}
                    alt="Upload preview"
                    fill
                    className="object-contain"
                  />
                )}

                {/* Multiple carousel controls */}
                {previewUrls.length > 1 && (
                  <>
                    {activePreviewIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => setActivePreviewIdx((p) => p - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    {activePreviewIdx < previewUrls.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActivePreviewIdx((p) => p + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] text-white">
                      {activePreviewIdx + 1} / {previewUrls.length}
                    </div>
                  </>
                )}

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
                    <span>Optimizing & uploading to Free CDN...</span>
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
                  placeholder="Write a caption with #hashtags..."
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
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#0095f6] hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Share Post</span>
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
