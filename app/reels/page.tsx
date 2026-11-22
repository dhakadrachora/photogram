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
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { Reel } from '@/lib/types';
import { getUploadPermissions, UploadPermissions, checkUploadPermission } from '@/lib/uploadPermissions';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { CreateModal, parseVideoUrl } from '@/components/modals/CreateModal';

interface ExtendedReel extends Reel {
  music_title?: string;
  is_verified?: boolean;
}

const SAMPLE_REELS: ExtendedReel[] = [
  {
    id: 'reel_1',
    user_id: 'official_photogram',
    user: {
      id: 'official_photogram',
      username: 'photogram.official',
      full_name: 'Photogram Official',
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    caption: 'Autumn winds through the mountain valleys. Nature never rushes, yet everything gets done 🍂✨ #mountains #nature #cinematic #peace',
    music_title: 'Original Audio • Photogram Official',
    likes_count: 48920,
    comments_count: 512,
    has_liked: false,
    has_saved: false,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'reel_2',
    user_id: 'official_visuals',
    user: {
      id: 'official_visuals',
      username: 'visuals.studio',
      full_name: 'Visuals Studio',
      avatar_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80',
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
    user_id: 'official_tokyo',
    user: {
      id: 'official_tokyo',
      username: 'tokyo.lens',
      full_name: 'Tokyo Lens',
      avatar_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=120&auto=format&fit=crop&q=80',
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
  const { posts } = usePosts();
  const [permissions, setPermissions] = useState<UploadPermissions>(getUploadPermissions());
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);

  // Combine live video posts with curated sample reels (Zero Storage)
  const combinedReels: ExtendedReel[] = React.useMemo(() => {
    const userVideoReels: ExtendedReel[] = [];
    posts.forEach((p) => {
      const vid = p.media.find((m) => m.media_type === 'video');
      if (vid) {
        userVideoReels.push({
          id: p.id,
          user_id: p.user_id,
          user: p.user,
          video_url: vid.media_url,
          caption: p.caption,
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          has_liked: p.has_liked,
          has_saved: p.has_saved,
          created_at: p.created_at,
          music_title: `Original Audio • ${p.user?.username || 'Creator'}`,
        });
      }
    });
    return [...userVideoReels, ...SAMPLE_REELS];
  }, [posts]);

  const [reels, setReels] = useState<ExtendedReel[]>(SAMPLE_REELS);

  useEffect(() => {
    setReels(combinedReels);
  }, [combinedReels]);

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

  const handleShareWhatsApp = (reel: ExtendedReel) => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const reelUrl = `${origin}/reels#${reel.id}`;
    const text = `Watch this trending Reel by @${reel.user.username} on PHOTOGRAM! 🎥✨\n\n"${reel.caption.slice(0, 80)}"\n\n👉 Watch here: ${reelUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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
              {/* Video Element (Supports Direct MP4 & Zero-Storage YouTube Shorts Embeds) */}
              {parseVideoUrl(reel.video_url).isYouTube ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center pointer-events-auto">
                  <iframe
                    src={parseVideoUrl(reel.video_url).embedUrl}
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
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
              )}

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

              {/* Top Reel Upload / Link Action */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => setIsCreateReelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-neutral-800 transition-colors border border-white/20 text-xs font-semibold cursor-pointer"
                  title="Add Reel / YouTube Link (Zero Storage)"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0095f6]" />
                  <span>Add Reel</span>
                </button>
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

                {/* Direct WhatsApp Share Button */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleShareWhatsApp(reel)}
                    className="p-2.5 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/40 backdrop-blur-md transition-all cursor-pointer text-[#25D366] active:scale-90"
                    title="Share Reel on WhatsApp"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>
                  <span className="text-[10px] font-bold text-[#25D366] drop-shadow">
                    WhatsApp
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
                  <Link href={`/profile/${reel.user.username}`} className="relative w-9 h-9 rounded-full overflow-hidden border border-white/40 shrink-0">
                    <Image
                      src={reel.user.avatar_url}
                      alt={reel.user.username}
                      fill
                      className="object-cover"
                    />
                  </Link>
                  <Link
                    href={`/profile/${reel.user.username}`}
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

      {/* Create Reel Modal (Zero-Storage YouTube / Link Embed) */}
      {isCreateReelOpen && (
        <CreateModal
          isOpen={isCreateReelOpen}
          onClose={() => setIsCreateReelOpen(false)}
          defaultMode="video_link"
        />
      )}
    </div>
  );
}
