'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import {
  Grid3X3,
  Bookmark,
  Settings,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuth();
  const { posts, savedPosts } = usePosts();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const userPosts = posts.filter(
    (p) => p.user_id === user?.id || p.user.username === user?.username
  );
  const displayedPosts = userPosts.length > 0 ? userPosts : posts;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-16 pb-8 border-b border-neutral-800">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] insta-gradient-border cursor-pointer">
            <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5">
              <Image
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                alt={user?.username || 'Profile'}
                width={144}
                height={144}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          {/* Top Row: Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-lg md:text-xl font-normal text-white">
              {user?.username || 'aryan.visuals'}
            </span>
            {user?.is_verified && (
              <span className="text-[#0095f6] text-sm">●</span>
            )}

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-semibold px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Edit profile
            </button>

            <button
              onClick={handleShareProfile}
              className="text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : null}
              <span>{copiedLink ? 'Copied' : 'Share profile'}</span>
            </button>

            <button className="p-1.5 text-neutral-300 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="font-semibold text-white">{displayedPosts.length}</span>{' '}
              <span className="text-neutral-400 text-xs">posts</span>
            </div>
            <div>
              <span className="font-semibold text-white">
                {user?.followers_count?.toLocaleString() || '1,420'}
              </span>{' '}
              <span className="text-neutral-400 text-xs">followers</span>
            </div>
            <div>
              <span className="font-semibold text-white">
                {user?.following_count?.toLocaleString() || '284'}
              </span>{' '}
              <span className="text-neutral-400 text-xs">following</span>
            </div>
          </div>

          {/* Bio & Links */}
          <div className="text-xs space-y-1">
            <p className="font-semibold text-white">{user?.full_name || 'Antigravity Explorer'}</p>
            <p className="text-neutral-200 whitespace-pre-line leading-relaxed max-w-md">
              {user?.bio || 'Building the modern web 🚀 • Next.js & Cloudinary & Supabase • Living in the digital future ✨'}
            </p>
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
          className={`flex items-center gap-2 py-3 px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>POSTS</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 py-3 px-8 text-xs font-semibold tracking-wider transition-colors border-t -mt-[1px] ${
            activeTab === 'saved'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>SAVED</span>
        </button>
      </div>

      {/* Tab Contents: Media Grid */}
      <div className="pt-4">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {displayedPosts.map((post) => (
              <div
                key={post.id}
                className="relative group aspect-square bg-neutral-900 overflow-hidden cursor-pointer rounded-xs"
              >
                <Image
                  src={post.media[0]?.media_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600'}
                  alt={post.caption || 'Post image'}
                  fill
                  sizes="(max-width: 768px) 33vw, 300px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white text-xs md:text-sm font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white text-white" />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white text-white" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {savedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="relative group aspect-square bg-neutral-900 overflow-hidden cursor-pointer rounded-xs"
                  >
                    <Image
                      src={post.media[0]?.media_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600'}
                      alt={post.caption}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white text-xs md:text-sm font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-white text-white" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-5 h-5 fill-white text-white" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-400">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="text-sm font-semibold text-white">Save photos</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                  Save photos that you want to see again. No one is notified, and only you can see what you&apos;ve saved.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
