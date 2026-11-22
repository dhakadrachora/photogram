'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { CreateModal } from '@/components/modals/CreateModal';
import Link from 'next/link';
import {
  Grid3X3,
  Bookmark,
  Settings,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Check,
  Camera,
  Upload,
  UserCheck,
  UserPlus,
  X,
  Film,
  QrCode,
} from 'lucide-react';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { posts, savedPosts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'reels'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploadingDp, setIsUploadingDp] = useState(false);
  const [liveFollowersCount, setLiveFollowersCount] = useState<number>(user?.followers_count ?? 0);
  const [liveFollowingCount, setLiveFollowingCount] = useState<number>(user?.following_count ?? 0);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured() || user.id === 'usr_me') return;

    const fetchFollowCounts = async () => {
      try {
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        if (typeof followers === 'number') setLiveFollowersCount(followers);
        if (typeof following === 'number') setLiveFollowingCount(following);
      } catch (err) {
        console.warn('Could not fetch live follow counts:', err);
      }
    };

    fetchFollowCounts();
  }, [user?.id]);

  // Filter ONLY posts that belong to the current logged-in user
  const userPosts = posts.filter(
    (p) =>
      p.user_id === user?.id ||
      (user?.username && p.user?.username?.toLowerCase() === user?.username?.toLowerCase())
  );

  const displayedPosts = activeTab === 'saved' ? savedPosts : userPosts;

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Direct DP file change
  const handleDpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDp(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      updateProfile({ avatar_url: dataUrl });

      try {
        const res = await uploadToCloudinary(file);
        if (res?.secure_url) {
          updateProfile({ avatar_url: res.secure_url });
        }
      } catch (err) {}
      setIsUploadingDp(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 select-none">
      {/* Hidden file input for direct DP upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDpChange}
        className="hidden"
      />

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-16 pb-8 border-b border-neutral-800">
        {/* Avatar with click-to-upload */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] insta-gradient-border cursor-pointer relative"
            title="Click to upload profile photo (DP)"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5 relative">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.username || 'Profile'}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400">
                  <Camera className="w-10 h-10" />
                </div>
              )}

              {/* Hover Camera Icon Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity rounded-full">
                <Camera className="w-6 h-6 md:w-8 md:h-8 mb-1" />
                <span className="text-[10px] font-semibold">Change Photo</span>
              </div>

              {isUploadingDp && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          {/* Top Row: Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-lg md:text-xl font-normal text-white">
              {user?.username || 'user'}
            </span>
            {user?.is_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600/20 via-sky-500/20 to-purple-600/20 border border-blue-500/40 text-[11px] font-bold text-sky-400">
                <span className="text-[#0095f6]">●</span>
                <span>Founding Member</span>
              </span>
            )}

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-semibold px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              Edit profile
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change DP</span>
            </button>

            <button
              onClick={handleShareProfile}
              className="text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : null}
              <span>{copiedLink ? 'Copied' : 'Share profile'}</span>
            </button>

            <button
              onClick={() => {
                if (typeof window === 'undefined') return;
                const profileUrl = `${window.location.origin}/profile`;
                const text = `Follow my official profile @${user?.username || 'me'} on PHOTOGRAM! 📸✨\n\n👉 Join & follow me here: ${profileUrl}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Share profile on WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              title="QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <Link
              href="/settings"
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="font-semibold text-white">{userPosts.length}</span>{' '}
              <span className="text-neutral-400 text-xs">posts</span>
            </div>
            <div>
              <span className="font-semibold text-white">
                {liveFollowersCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-400 text-xs">followers</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFollowingModalOpen(true)}
              className="hover:opacity-80 cursor-pointer"
            >
              <span className="font-semibold text-white">
                {liveFollowingCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-400 text-xs">following</span>
            </button>
          </div>

          {/* Bio & Links */}
          <div className="text-xs space-y-1">
            <p className="font-semibold text-white">{user?.full_name || user?.username}</p>
            {user?.bio ? (
              <p className="text-neutral-200 whitespace-pre-line leading-relaxed max-w-md">
                {user.bio}
              </p>
            ) : (
              <p className="text-neutral-500 italic text-[11px]">No bio yet. Tap Edit profile to add one.</p>
            )}
            {user?.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#0095f6] hover:underline font-medium pt-0.5"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{user.website.replace('https://', '')}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation: POSTS and SAVED */}
      <div className="flex justify-center border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-6 md:px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] cursor-pointer ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>POSTS ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-2 py-3 px-6 md:px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] cursor-pointer ${
            activeTab === 'reels'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>REELS</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 py-3 px-6 md:px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] cursor-pointer ${
            activeTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>SAVED ({savedPosts.length})</span>
        </button>
      </div>

      {/* Posts Grid OR Reels OR Official Empty State */}
      {activeTab === 'reels' ? (
        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
            <Film className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Capture and share Reels</h3>
          <p className="text-xs text-neutral-400 max-w-sm mb-5 leading-relaxed">
            Create 9:16 vertical video reels with music and effects to express your creativity.
          </p>
          <Link
            href="/reels"
            className="text-xs font-semibold px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-lg transition-colors cursor-pointer"
          >
            Watch trending Reels
          </Link>
        </div>
      ) : displayedPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 md:gap-7 mt-4">
          {displayedPosts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square group bg-neutral-900 cursor-pointer overflow-hidden rounded-sm"
            >
              <Image
                src={post.media[0]?.media_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600'}
                alt="Post"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Overlay with Likes & Comments */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white font-bold text-sm transition-opacity">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-5 h-5 fill-white" />
                  <span>{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>{post.comments_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Official 1:1 Instagram Empty Profile State */
        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Share Photos</h3>
          <p className="text-xs text-neutral-400 max-w-sm mb-5 leading-relaxed">
            When you share photos, they will appear on your profile for your friends and followers.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2] transition-colors cursor-pointer py-1"
          >
            Share your first photo
          </button>
        </div>
      )}

      {/* QR Profile Code Modal */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Inner White QR Card */}
            <div className="bg-white rounded-2xl p-6 text-black flex flex-col items-center shadow-xl mt-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md mb-2 bg-neutral-900">
                <Image
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user?.username || 'User'}
                  fill
                  className="object-cover"
                />
              </div>

              <h4 className="font-bold text-base text-neutral-900">@{user?.username}</h4>
              <p className="text-xs text-neutral-500 mb-5">{user?.full_name}</p>

              {/* Stylized QR Code Representation */}
              <div className="w-44 h-44 border-4 border-black rounded-2xl p-3 flex flex-col justify-between bg-white relative">
                {/* 4 Corner Position Anchors */}
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black rounded-lg flex items-center justify-center p-1">
                    <div className="w-full h-full bg-black rounded-xs" />
                  </div>
                  <div className="w-10 h-10 border-4 border-black rounded-lg flex items-center justify-center p-1">
                    <div className="w-full h-full bg-black rounded-xs" />
                  </div>
                </div>

                {/* Center Brand Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow">
                    <Image src="/app-logo.png" alt="Logo" width={40} height={40} className="object-cover" />
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-black rounded-lg flex items-center justify-center p-1">
                    <div className="w-full h-full bg-black rounded-xs" />
                  </div>
                  {/* Subtle matrix dots */}
                  <div className="grid grid-cols-3 gap-1 w-9 h-9 p-0.5">
                    <div className="bg-black rounded-xs" />
                    <div className="bg-black rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-transparent" />
                    <div className="bg-black rounded-xs" />
                    <div className="bg-black rounded-xs" />
                    <div className="bg-black rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-black rounded-xs" />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 text-center mt-4">
                Scan to follow @{user?.username} on Photogram
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleShareProfile}
                className="w-full py-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <LinkIcon className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Profile Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Create Post Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Following Modal */}
      {isFollowingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsFollowingModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#262626] border border-neutral-700 rounded-2xl p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-semibold text-sm">Following</h3>
              <button
                onClick={() => setIsFollowingModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3">
              {(user?.following_count ?? 0) === 0 ? (
                <div className="py-6 text-center text-neutral-400 text-xs">
                  <p>You aren&apos;t following anyone yet. Discover creators from the home feed or search!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                  {(() => {
                    try {
                      const userKey = user?.id || user?.username;
                      const stored = localStorage.getItem(`photogram_following_${userKey}`);
                      if (!stored) return [];
                      const map = JSON.parse(stored);
                      return Object.keys(map).filter((k) => map[k]);
                    } catch {
                      return [];
                    }
                  })().map((followingUsername) => (
                    <div key={followingUsername} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-semibold text-white uppercase ring-1 ring-neutral-700">
                          {followingUsername[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white">{followingUsername}</p>
                          <p className="text-[10px] text-neutral-400">Following</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!user) return;
                          const userKey = user.id || user.username;
                          try {
                            const stored = localStorage.getItem(`photogram_following_${userKey}`);
                            const map = stored ? JSON.parse(stored) : {};
                            map[followingUsername] = false;
                            localStorage.setItem(`photogram_following_${userKey}`, JSON.stringify(map));
                            const activeCount = Object.values(map).filter(Boolean).length;
                            updateProfile({ following_count: activeCount });
                          } catch {}
                        }}
                        className="text-xs font-semibold px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg cursor-pointer"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
