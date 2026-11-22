'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Link as LinkIcon,
  Play,
  Hash,
} from 'lucide-react';
import { uploadToCloudinary, validateFreeTierMedia } from '@/lib/cloudinary';
import { usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { PostMedia } from '@/lib/types';
import { getUploadPermissions, UploadPermissions } from '@/lib/uploadPermissions';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'photo' | 'video_link';
}

/**
 * Extracts YouTube embed URL from various YouTube and video link formats
 */
export function parseVideoUrl(input: string): {
  isYouTube: boolean;
  embedUrl: string;
  videoId?: string;
  directUrl: string;
} {
  const trimmed = input.trim();
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]+)/
  );

  const videoId = shortsMatch?.[1] || ytMatch?.[1];

  if (videoId) {
    return {
      isYouTube: true,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&controls=0&modestbranding=1`,
      directUrl: trimmed,
    };
  }

  return {
    isYouTube: false,
    embedUrl: trimmed,
    directUrl: trimmed,
  };
}

export function CreateModal({ isOpen, onClose, defaultMode = 'photo' }: CreateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost } = usePosts();
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'photo' | 'video_link'>(defaultMode);
  const [permissions, setPermissions] = useState<UploadPermissions>(getUploadPermissions());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ url: string; isVideo: boolean }[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  // Video Link State (Zero Storage Reels)
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [parsedVideo, setParsedVideo] = useState<{
    isYouTube: boolean;
    embedUrl: string;
    directUrl: string;
  } | null>(null);

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPermissions(getUploadPermissions());
    const handlePermChange = (e: any) => {
      if (e?.detail) setPermissions(e.detail);
    };
    window.addEventListener('photogram_permissions_changed', handlePermChange);
    return () => window.removeEventListener('photogram_permissions_changed', handlePermChange);
  }, [isOpen]);

  useEffect(() => {
    if (defaultMode) setActiveTab(defaultMode);
  }, [defaultMode, isOpen]);

  // Handle URL change for video link embed
  const handleVideoLinkChange = (value: string) => {
    setVideoLinkInput(value);
    setErrorMessage(null);
    if (!value.trim()) {
      setParsedVideo(null);
      return;
    }
    const parsed = parseVideoUrl(value);
    setParsedVideo(parsed);
  };

  if (!isOpen) return null;

  const processFiles = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setErrorMessage(null);

    const filesArray = Array.from(filesList);

    // Validate each file
    for (const f of filesArray) {
      const isVid = f.type.startsWith('video');
      const cat = isVid
        ? 'allow_video_posts'
        : filesArray.length > 1
        ? 'allow_carousel_images'
        : 'allow_image_posts';

      const check = validateFreeTierMedia(f, cat);
      if (!check.valid) {
        setErrorMessage(check.error || 'File exceeds upload policy.');
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

  const addHashtag = (tag: string) => {
    setCaption((prev) => (prev ? `${prev} #${tag}` : `#${tag}`));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const mediaList: PostMedia[] = [];

      // =========================================================
      // CASE A: ZERO-STORAGE VIDEO / REEL LINK EMBED
      // =========================================================
      if (activeTab === 'video_link') {
        if (!videoLinkInput.trim() || !parsedVideo) {
          setErrorMessage('Please enter a valid YouTube Shorts or video link.');
          setIsSubmitting(false);
          return;
        }

        mediaList.push({
          id: `m_${Date.now()}_0`,
          media_url: parsedVideo.directUrl,
          media_type: 'video',
          display_order: 0,
        });
      }
      // =========================================================
      // CASE B: CLIENT-COMPRESSED WEBP PHOTO UPLOADS (< 150KB)
      // =========================================================
      else {
        if (selectedFiles.length === 0 && previewUrls.length === 0) {
          setErrorMessage('Please select a photo to share.');
          setIsSubmitting(false);
          return;
        }

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const res = await uploadToCloudinary(file, (percent) => {
            const totalProgress = Math.round(((i * 100) + percent) / selectedFiles.length);
            setUploadProgress(totalProgress);
          });

          mediaList.push({
            id: `m_${Date.now()}_${i}`,
            media_url: res.secure_url,
            media_type: res.resource_type,
            display_order: i,
          });
        }

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
      setErrorMessage(err.message || 'Creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setActivePreviewIdx(0);
    setVideoLinkInput('');
    setParsedVideo(null);
    setCaption('');
    setLocation('');
    setIsDone(false);
    setUploadProgress(null);
    setErrorMessage(null);
  };

  const POPULAR_TAGS = ['photogram', 'reels', 'photography', 'trending', 'lifestyle', 'viral'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#262626] border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-neutral-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'photo'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Share Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video_link')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'video_link'
                  ? 'bg-[#0095f6] text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Reel / Video Link (0 MB)</span>
            </button>
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
        <div className="p-5 max-h-[85vh] overflow-y-auto no-scrollbar">
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
              <h3 className="text-lg font-bold text-white">Post Live on Photogram!</h3>
              <p className="text-xs text-neutral-400 mt-1">Your content is now visible to all creators.</p>
            </div>
          ) : activeTab === 'video_link' ? (
            /* ================================================== */
            /* ZERO STORAGE VIDEO REEL / YOUTUBE SHORTS FORM      */
            /* ================================================== */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-neutral-900/70 border border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-[#0095f6]" />
                  <span className="text-xs font-semibold text-white">
                    Paste YouTube Shorts or Video Link
                  </span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold ml-auto">
                    Zero Storage
                  </span>
                </div>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={videoLinkInput}
                    onChange={(e) => handleVideoLinkChange(e.target.value)}
                    placeholder="https://youtube.com/shorts/... or https://youtu.be/..."
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 outline-none focus:border-[#0095f6]"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Plays in 9:16 full-screen Reel format on Photogram without consuming your storage!
                </p>
              </div>

              {/* Video Embed Live Preview */}
              {parsedVideo && (
                <div className="relative w-full aspect-[9/14] max-h-[280px] bg-black rounded-xl overflow-hidden border border-neutral-700 mx-auto">
                  {parsedVideo.isYouTube ? (
                    <iframe
                      src={parsedVideo.embedUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={parsedVideo.directUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}

              {/* Caption & Hashtags */}
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption with #hashtags and @mentions..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#0095f6] resize-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => addHashtag(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Input */}
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location (e.g. Mumbai, Goa)"
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parsedVideo}
                  className="px-5 py-2 bg-[#0095f6] hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Share Reel</span>
                  )}
                </button>
              </div>
            </form>
          ) : previewUrls.length === 0 ? (
            /* ================================================== */
            /* PHOTO UPLOAD DROP AREA (SMART 150KB WEBP COMPRESSION)*/
            /* ================================================== */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-600 hover:border-[#0095f6] rounded-xl p-8 py-12 text-center cursor-pointer transition-colors bg-neutral-900/50"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">
                Select photos from your device
              </h4>
              <p className="text-xs text-neutral-400 mb-2 max-w-xs leading-relaxed">
                Supports single or multi-photo carousels (JPG, PNG, WebP)
              </p>
              <span className="text-[10px] text-emerald-400 font-medium mb-4 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auto-compressed to WebP (&lt; 150KB) for instant loading</span>
              </span>

              <button
                type="button"
                className="px-4 py-2 bg-[#0095f6] hover:bg-sky-500 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
              >
                Choose Photos
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Photo Preview Carousel & Caption Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative aspect-square max-h-[300px] w-full rounded-xl overflow-hidden bg-black border border-neutral-700 mx-auto">
                <Image
                  src={previewUrls[activePreviewIdx]?.url || ''}
                  alt="Upload preview"
                  fill
                  className="object-contain"
                />

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

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
                    <span>Compressing & uploading to CDN...</span>
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

              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption with #hashtags and @mentions..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#0095f6] transition-colors resize-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => addHashtag(tag)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

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
                      <span>Optimizing...</span>
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
