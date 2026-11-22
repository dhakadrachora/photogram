'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Check,
  MoreVertical,
  X,
  Send,
  Camera,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Reel } from '@/lib/types';
import { getUploadPermissions, UploadPermissions, checkUploadPermission } from '@/lib/uploadPermissions';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface ExtendedReel extends Reel {
  music_title?: string;
  is_verified?: boolean;
}

const SAMPLE_REELS: ExtendedReel[] = [
  {
    id: 'reel_1',
    user_id: 'usr_kabir',
    user: {
      id: 'usr_kabir',
      username: 'kabir.explores',
      full_name: 'Kabir Mehta',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    caption: 'Autumn winds through the mountain valleys. Nature never rushes, yet everything gets done 🍂✨ #mountains #nature #cinematic #peace',
    music_title: 'Original Audio • Kabir Mehta',
    likes_count: 48920,
    comments_count: 512,
    has_liked: false,
    has_saved: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'reel_2',
    user_id: 'usr_ananya',
    user: {
      id: 'usr_ananya',
      username: 'ananya.lens',
      full_name: 'Ananya Roy',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    caption: 'Golden hour along the shoreline. Nothing beats Mediterranean water clarity 🌊🍋 #ocean #coastal #goldenhour #summer',
    music_title: 'Ocean Sounds • Coastal Vibes',
    likes_count: 73400,
    comments_count: 830,
    has_liked: false,
    has_saved: false,
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 'reel_3',
    user_id: 'usr_vikram',
    user: {
      id: 'usr_vikram',
      username: 'vikram.aerials',
      full_name: 'Vikram Aditya',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    caption: 'Tokyo night traffic light trails from above. The city looks like a living motherboard 🌃🚗 #tokyo #hyperlapse #aerial #cyberpunk',
    music_title: 'Midnight Drive • Synthwave',
    likes_count: 91200,
    comments_count: 1240,
    has_liked: false,
    has_saved: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export default function ReelsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UploadPermissions>(getUploadPermissions());
  const [reels, setReels] = useState<ExtendedReel[]>(SAMPLE_REELS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCommentsReel, setActiveCommentsReel] = useState<ExtendedReel | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({});
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);

  // Sync permissions
  useEffect(() => {
    setPermissions(getUploadPermissions());
    const handlePermChange = (e: any) => {
      if (e?.detail) setPermissions(e.detail);
    };
    window.addEventListener('photogram_permissions_changed', handlePermChange);
    return () => window.removeEventListener('photogram_permissions_changed', handlePermChange);
  }, []);

  const handleReelUploadClick = () => {
    if (!permissions.allow_reels_uploads) {
      setUploadNotice(
        'Reels video uploads are temporarily paused by admin settings. All existing reels remain playable.'
      );
      setTimeout(() => setUploadNotice(null), 4000);
      return;
    }
    reelInputRef.current?.click();
  };

  const handleReelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = checkUploadPermission('allow_reels_uploads', file);
    if (!check.allowed) {
      setUploadNotice(check.reason || 'Reels upload disabled.');
      setTimeout(() => setUploadNotice(null), 4000);
      return;
    }

    try {
      const res = await uploadToCloudinary(file, undefined, 'allow_reels_uploads');
      if (res?.secure_url) {
        const newReel: ExtendedReel = {
          id: `reel_${Date.now()}`,
          user_id: user?.id || 'usr_me',
          user: user || ({} as any),
          video_url: res.secure_url,
          caption: 'New visual reel ✨',
          likes_count: 1,
          comments_count: 0,
          has_liked: true,
          has_saved: false,
          created_at: new Date().toISOString(),
        };
        setReels((prev) => [newReel, ...prev]);
        setCurrentIdx(0);
        setUploadNotice('Reel uploaded successfully!');
        setTimeout(() => setUploadNotice(null), 3000);
      }
    } catch (err: any) {
      setUploadNotice(err?.message || 'Failed to upload reel.');
      setTimeout(() => setUploadNotice(null), 4000);
    }
  };

  // Play current video and pause others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === currentIdx) {
        video.currentTime = 0;
        video.muted = isMuted;
        video.play().catch(() => {});
        setIsPlaying(true);
      } else {
        video.pause();
      }
    });
  }, [currentIdx, isMuted]);

  // Handle keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIdx < reels.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else if (e.key === 'ArrowUp' && currentIdx > 0) {
        setCurrentIdx((prev) => prev - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, reels.length]);

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIdx];
    if (!currentVideo) return;

    if (currentVideo.paused) {
      currentVideo.play().catch(() => {});
      setIsPlaying(true);
    } else {
      currentVideo.pause();
      setIsPlaying(false);
    }
  };

  const toggleLike = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const nextLiked = !r.has_liked;
          return {
            ...r,
            has_liked: nextLiked,
            likes_count: nextLiked ? r.likes_count + 1 : r.likes_count - 1,
          };
        }
        return r;
      })
    );
  };

  const toggleSave = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, has_saved: !r.has_saved } : r
      )
    );
  };

  const handleShare = (reelId: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/reels#${reelId}`);
      setCopiedId(reelId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentsReel) return;

    const reelId = activeCommentsReel.id;
    setCommentsMap((prev) => ({
      ...prev,
      [reelId]: [...(prev[reelId] || []), commentText.trim()],
    }));

    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId ? { ...r, comments_count: r.comments_count + 1 } : r
      )
    );
    setCommentText('');
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[calc(100vh-64px)] md:h-screen flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Centered 9:16 Video Feed Reel */}
      <div className="relative w-full max-w-[420px] h-full md:h-[calc(100vh-32px)] my-0 md:my-4 rounded-none md:rounded-2xl overflow-hidden bg-neutral-950 flex shadow-2xl border-0 md:border md:border-neutral-800">
        {reels.map((reel, idx) => {
          const isActive = idx === currentIdx;
          if (!isActive) return null;

          return (
            <div key={reel.id} className="relative w-full h-full bg-black">
              {/* Video Element */}
              <video
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={reel.video_url}
                loop
                playsInline
                muted={isMuted}
                onClick={togglePlayPause}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Pause/Play Center Overlay Icon */}
              {!isPlaying && (
                <div
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-auto cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                    <Play className="w-8 h-8 fill-white translate-x-0.5" />
                  </div>
                </div>
              )}

              {/* Top Mute / Sound Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors z-20 cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Top Reel Upload / Restriction Action */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <input
                  ref={reelInputRef}
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={handleReelFileSelected}
                  className="hidden"
                />
                <button
                  onClick={handleReelUploadClick}
                  className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors cursor-pointer"
                  title={
                    permissions.allow_reels_uploads
                      ? 'Upload Reel Video'
                      : 'Reel uploads temporarily paused'
                  }
                >
                  <Camera className="w-5 h-5" />
                </button>
                {!permissions.allow_reels_uploads && (
                  <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Upload Paused
                  </span>
                )}
              </div>

              {/* Upload Restriction Notice Banner */}
              {uploadNotice && (
                <div className="absolute top-16 left-4 right-4 z-30 p-2.5 bg-neutral-900/90 border border-amber-500/40 text-amber-200 text-xs rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{uploadNotice}</span>
                </div>
              )}

              {/* Right Action Icons Column */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20 text-white">
                {/* Like Button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleLike(reel.id)}
                    className="p-2.5 rounded-full bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-transform active:scale-125 cursor-pointer"
                  >
                    <Heart
                      className={`w-7 h-7 transition-colors ${
                        reel.has_liked ? 'fill-[#ff3040] text-[#ff3040]' : 'text-white'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] font-semibold drop-shadow">
                    {reel.likes_count.toLocaleString()}
                  </span>
                </div>

                {/* Comment Button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setActiveCommentsReel(reel)}
                    className="p-2.5 rounded-full bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-7 h-7 text-white" />
                  </button>
                  <span className="text-[11px] font-semibold drop-shadow">
                    {reel.comments_count.toLocaleString()}
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleShare(reel.id)}
                    className="p-2.5 rounded-full bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  >
                    {copiedId === reel.id ? (
                      <Check className="w-6 h-6 text-green-400" />
                    ) : (
                      <Share2 className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <span className="text-[11px] font-semibold drop-shadow">
                    {copiedId === reel.id ? 'Copied' : 'Share'}
                  </span>
                </div>

                {/* Save Bookmark */}
                <button
                  onClick={() => toggleSave(reel.id)}
                  className="p-2.5 rounded-full bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800/60 transition-colors cursor-pointer"
                >
                  <Bookmark
                    className={`w-6 h-6 transition-colors ${
                      reel.has_saved ? 'fill-white text-white' : 'text-white'
                    }`}
                  />
                </button>

                {/* Rotating Music Disc Icon */}
                <div className="w-9 h-9 rounded-full border-2 border-white/60 bg-black/80 flex items-center justify-center animate-spin duration-[4000ms]">
                  <Music className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Bottom Creator Info & Caption */}
              <div className="absolute left-4 right-18 bottom-4 z-20 text-white space-y-2 pointer-events-auto">
                {/* Creator Avatar & Username */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/40 shrink-0">
                    <Image
                      src={reel.user.avatar_url}
                      alt={reel.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Link
                    href="/profile"
                    className="font-semibold text-sm hover:underline flex items-center gap-1 drop-shadow"
                  >
                    <span>{reel.user.username}</span>
                    {reel.user.is_verified && <span className="text-[#0095f6] text-xs">●</span>}
                  </Link>
                  <button className="text-xs font-semibold px-3 py-1 rounded-lg border border-white/40 hover:bg-white/20 transition-colors ml-1 cursor-pointer">
                    Follow
                  </button>
                </div>

                {/* Caption */}
                <p className="text-xs text-neutral-100 leading-relaxed line-clamp-2 drop-shadow">
                  {reel.caption}
                </p>

                {/* Audio Track Ticker */}
                {reel.music_title && (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                    <Music className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{reel.music_title}</span>
                  </div>
                )}
              </div>

              {/* Subtle Bottom Gradient */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Up/Down Arrow Stepper Controls (Desktop only) */}
      <div className="hidden lg:flex flex-col gap-3 ml-4">
        <button
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Previous reel (Up Arrow)"
        >
          ▲
        </button>
        <button
          onClick={() => setCurrentIdx((p) => Math.min(reels.length - 1, p + 1))}
          disabled={currentIdx === reels.length - 1}
          className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Next reel (Down Arrow)"
        >
          ▼
        </button>
      </div>

      {/* Comments Drawer Modal */}
      {activeCommentsReel && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setActiveCommentsReel(null)}
        >
          <div
            className="w-full max-w-md h-[60vh] md:h-[500px] bg-[#262626] border border-neutral-700 rounded-t-2xl md:rounded-2xl p-4 flex flex-col text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
              <h3 className="font-semibold text-sm">Comments</h3>
              <button
                onClick={() => setActiveCommentsReel(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 py-2">
              <div className="py-2.5 flex items-start gap-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-700 shrink-0">
                  <Image
                    src={activeCommentsReel.user.avatar_url}
                    alt={activeCommentsReel.user.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white">
                    {activeCommentsReel.user.username}
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">{activeCommentsReel.caption}</p>
                </div>
              </div>

              {(commentsMap[activeCommentsReel.id] || []).map((c, i) => (
                <div key={i} className="py-2.5 flex items-start gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                    <Image
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt="User"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white">{user?.username || 'user'}</span>
                    <p className="text-xs text-neutral-200 mt-0.5">{c}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-neutral-700 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full text-xs text-white px-3.5 py-2 outline-none focus:border-neutral-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-semibold text-[#0095f6] hover:text-sky-400 disabled:opacity-40 px-2"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
