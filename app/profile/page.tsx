'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { CreateModal } from '@/components/modals/CreateModal';
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
} from 'lucide-react';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { REAL_SUGGESTIONS } from '@/components/feed/SuggestionsSidebar';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { posts, savedPosts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploadingDp, setIsUploadingDp] = useState(false);

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
              <span className="text-[#0095f6] text-sm">●</span>
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
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="font-semibold text-white">{userPosts.length}</span>{' '}
              <span className="text-neutral-400 text-xs">posts</span>
            </div>
            <div>
              <span className="font-semibold text-white">
                {(user?.followers_count ?? 0).toLocaleString()}
              </span>{' '}
              <span className="text-neutral-400 text-xs">followers</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFollowingModalOpen(true)}
              className="hover:opacity-80 cursor-pointer"
            >
              <span className="font-semibold text-white">
                {(user?.following_count ?? 0).toLocaleString()}
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
          className={`flex items-center gap-2 py-3 px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] cursor-pointer ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>POSTS ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 py-3 px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] cursor-pointer ${
            activeTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>SAVED ({savedPosts.length})</span>
        </button>
      </div>

      {/* Posts Grid OR Official Instagram Empty State */}
      {displayedPosts.length > 0 ? (
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
                  {REAL_SUGGESTIONS.filter((s) => {
                    try {
                      const userKey = user?.id || user?.username;
                      const stored = localStorage.getItem(`photogram_following_${userKey}`);
                      if (!stored) return false;
                      const map = JSON.parse(stored);
                      return !!map[s.username];
                    } catch {
                      return false;
                    }
                  }).map((item) => (
                    <div key={item.username} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-800">
                          <Image src={item.avatar} alt={item.username} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-white">{item.username}</p>
                          <p className="text-[10px] text-neutral-400">{item.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!user) return;
                          const userKey = user.id || user.username;
                          try {
                            const stored = localStorage.getItem(`photogram_following_${userKey}`);
                            const map = stored ? JSON.parse(stored) : {};
                            map[item.username] = false;
                            localStorage.setItem(`photogram_following_${userKey}`, JSON.stringify(map));
                            const activeCount = Object.values(map).filter(Boolean).length;
                            updateProfile({ following_count: activeCount });
                          } catch {}
                        }}
                        className="text-xs font-semibold px-2.5 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg cursor-pointer"
                      >
                        Following
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
