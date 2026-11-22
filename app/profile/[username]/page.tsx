'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Send,
  Share2,
  BadgeCheck,
} from 'lucide-react';
import Image from 'next/image';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, Post } from '@/lib/types';
import { FormattedText } from '@/components/common/FormattedText';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params?.username as string;
  const targetUsername = decodeURIComponent(rawUsername || '').toLowerCase();

  const { user: currentUser, updateProfile } = useAuth();
  const { posts, savedPosts, toggleLike, addComment } = usePosts();

  const isOwner =
    Boolean(currentUser?.username) &&
    currentUser!.username.toLowerCase() === targetUsername;

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'reels'>('posts');

  const [liveFollowersCount, setLiveFollowersCount] = useState<number>(0);
  const [liveFollowingCount, setLiveFollowingCount] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Fetch target profile from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;
    setIsLoadingProfile(true);

    const resolveProfile = async () => {
      // 1. If viewing own profile
      if (currentUser && currentUser.username.toLowerCase() === targetUsername) {
        if (isMounted) {
          setProfileData(currentUser);
          setIsLoadingProfile(false);
        }
        return;
      }

      // 2. Query Supabase profiles table
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', targetUsername)
            .maybeSingle();

          if (!error && data && isMounted) {
            setProfileData({
              id: data.id,
              username: data.username,
              full_name: data.full_name || data.username,
              avatar_url:
                data.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              bio: data.bio || '',
              website: data.website || '',
              is_verified: !!data.is_verified,
              posts_count: 0,
              followers_count: 0,
              following_count: 0,
            });
            setIsLoadingProfile(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase profile query note:', e);
        }
      }

      // 3. Check locally registered accounts registry
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('photogram_registered_accounts');
          if (raw) {
            const accounts = JSON.parse(raw);
            const found = accounts.find(
              (a: any) => a.username.toLowerCase() === targetUsername
            );
            if (found && isMounted) {
              setProfileData({
                id: found.id,
                username: found.username,
                full_name: found.full_name || found.username,
                avatar_url:
                  found.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                bio: found.bio || '',
                is_verified: !!found.is_verified,
                posts_count: found.posts_count || 0,
                followers_count: found.followers_count || 0,
                following_count: found.following_count || 0,
              });
              setIsLoadingProfile(false);
              return;
            }
          }
        } catch {}
      }

      // 4. Check if any post matches this username
      const matchingPost = posts.find(
        (p) => p.user?.username?.toLowerCase() === targetUsername
      );
      if (matchingPost && isMounted) {
        setProfileData(matchingPost.user);
        setIsLoadingProfile(false);
        return;
      }

      if (isMounted) {
        setProfileData(null);
        setIsLoadingProfile(false);
      }
    };

    resolveProfile();
    return () => {
      isMounted = false;
    };
  }, [targetUsername, currentUser, posts]);

  // Check follow state & follow counts
  useEffect(() => {
    if (!profileData?.id || !currentUser?.id) return;

    // Check localStorage follow state
    try {
      const userKey = currentUser.id || currentUser.username;
      const stored = localStorage.getItem(`photogram_following_${userKey}`);
      if (stored) {
        const map = JSON.parse(stored);
        setIsFollowing(Boolean(map[profileData.username]));
      }
    } catch {}

    // Live follow counts from Supabase
    if (isSupabaseConfigured() && profileData.id !== 'usr_me') {
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id)
        .then(({ count }) => {
          if (typeof count === 'number') setLiveFollowersCount(count);
        });

      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id)
        .then(({ count }) => {
          if (typeof count === 'number') setLiveFollowingCount(count);
        });
    }
  }, [profileData, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser || !profileData) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setLiveFollowersCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    // Save locally
    const userKey = currentUser.id || currentUser.username;
    try {
      const stored = localStorage.getItem(`photogram_following_${userKey}`);
      const map = stored ? JSON.parse(stored) : {};
      map[profileData.username] = nextState;
      localStorage.setItem(`photogram_following_${userKey}`, JSON.stringify(map));
      const activeCount = Object.values(map).filter(Boolean).length;
      updateProfile({ following_count: activeCount });
    } catch {}

    // Sync with Supabase follows table
    if (isSupabaseConfigured() && currentUser.id && profileData.id) {
      try {
        if (nextState) {
          await supabase.from('follows').insert({
            follower_id: currentUser.id,
            following_id: profileData.id,
          });
        } else {
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUser.id)
            .eq('following_id', profileData.id);
        }
      } catch (err) {
        console.warn('Supabase follow sync note:', err);
      }
    }
  };

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window === 'undefined' || !profileData) return;
    const url = window.location.href;
    const text = `Check out @${profileData.username}'s profile on PHOTOGRAM! 📸✨\n\n👉 View profile: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter posts belonging to this profile
  const targetPosts = posts.filter(
    (p) =>
      p.user_id === profileData?.id ||
      p.user?.username?.toLowerCase() === targetUsername
  );

  const targetReels = targetPosts.filter((p) =>
    p.media?.some((m) => m.media_type === 'video')
  );

  const displayedPosts =
    activeTab === 'reels'
      ? targetReels
      : activeTab === 'saved' && isOwner
      ? savedPosts
      : targetPosts;

  if (isLoadingProfile) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 text-center select-none">
        <h2 className="text-xl font-bold text-white mb-2">Sorry, this page isn&apos;t available.</h2>
        <p className="text-xs text-neutral-400 mb-6">
          The link you followed may be broken, or the user @{targetUsername} may have been removed.
        </p>
        <Link
          href="/explore"
          className="px-5 py-2.5 bg-[#0095f6] hover:bg-sky-500 text-xs font-semibold text-white rounded-xl transition-colors"
        >
          Explore Photogram
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-10 select-none">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-16 pb-8 border-b border-neutral-800">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] insta-gradient-border relative">
            <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5 relative">
              <Image
                src={profileData.avatar_url}
                alt={profileData.username}
                width={144}
                height={144}
                priority
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
              {profileData.username}
            </span>

            {profileData.is_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600/20 via-sky-500/20 to-purple-600/20 border border-blue-500/40 text-[11px] font-bold text-sky-400">
                <span className="text-[#0095f6]">●</span>
                <span>Founding Member</span>
              </span>
            )}

            {isOwner ? (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-semibold px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Edit profile
                </button>
                <button
                  onClick={handleShareProfile}
                  className="text-xs font-semibold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : null}
                  <span>{copiedLink ? 'Copied' : 'Share profile'}</span>
                </button>
                <Link
                  href="/settings"
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                {/* Follow Button */}
                <button
                  onClick={handleToggleFollow}
                  className={`text-xs font-semibold px-5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isFollowing
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      : 'bg-[#0095f6] hover:bg-sky-500 text-white'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                {/* Direct Message Button (Seamless Flow) */}
                <Link
                  href={`/direct?user=${profileData.id}&username=${profileData.username}`}
                  className="text-xs font-semibold px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Message</span>
                </Link>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="text-xs font-semibold px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Share profile on WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
              </>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center md:justify-start gap-8 text-sm">
            <span>
              <strong className="font-semibold text-white">{targetPosts.length}</strong>{' '}
              <span className="text-neutral-400">posts</span>
            </span>
            <span>
              <strong className="font-semibold text-white">
                {liveFollowersCount || profileData.followers_count || 0}
              </strong>{' '}
              <span className="text-neutral-400">followers</span>
            </span>
            <span>
              <strong className="font-semibold text-white">
                {liveFollowingCount || profileData.following_count || 0}
              </strong>{' '}
              <span className="text-neutral-400">following</span>
            </span>
          </div>

          {/* Bio & Links */}
          <div className="text-xs space-y-1 max-w-md">
            <h1 className="font-semibold text-white text-sm">{profileData.full_name}</h1>
            {profileData.bio && (
              <p className="whitespace-pre-line text-neutral-300 leading-relaxed">
                <FormattedText text={profileData.bio} />
              </p>
            )}
            {profileData.website && (
              <a
                href={
                  profileData.website.startsWith('http')
                    ? profileData.website
                    : `https://${profileData.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-[#0095f6] hover:underline font-semibold flex items-center justify-center md:justify-start gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{profileData.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-12 border-b border-neutral-800 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 py-3.5 border-t -mt-[1px] transition-colors cursor-pointer ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Posts</span>
        </button>

        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-1.5 py-3.5 border-t -mt-[1px] transition-colors cursor-pointer ${
            activeTab === 'reels'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Reels ({targetReels.length})</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 py-3.5 border-t -mt-[1px] transition-colors cursor-pointer ${
              activeTab === 'saved'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="pt-4">
        {displayedPosts.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 space-y-2">
            <Camera className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm font-semibold text-white">No Posts Yet</p>
            <p className="text-xs text-neutral-500">
              {isOwner
                ? 'Share your first photo or reel to appear here.'
                : `@${profileData.username} hasn't posted anything yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {displayedPosts.map((post) => {
              const firstMedia = post.media?.[0];
              const isVideo = firstMedia?.media_type === 'video';

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square group cursor-pointer overflow-hidden bg-neutral-900 rounded-sm md:rounded-lg"
                >
                  {isVideo ? (
                    <div className="w-full h-full relative bg-black flex items-center justify-center">
                      <video
                        src={firstMedia.media_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute top-2 right-2 text-white drop-shadow z-10">
                        <Film className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={firstMedia?.media_url || ''}
                      alt={post.caption || 'Post'}
                      fill
                      priority
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5 text-white font-semibold text-xs md:text-sm z-10">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 fill-white text-white" />
                      <span>{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Post Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media side */}
            <div className="relative w-full md:w-3/5 bg-black aspect-square md:aspect-auto flex items-center justify-center">
              {selectedPost.media?.[0]?.media_type === 'video' ? (
                <video
                  src={selectedPost.media[0].media_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={selectedPost.media?.[0]?.media_url || ''}
                  alt={selectedPost.caption}
                  fill
                  className="object-contain"
                />
              )}
            </div>

            {/* Details side */}
            <div className="w-full md:w-2/5 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-800">
                    <Image
                      src={selectedPost.user?.avatar_url || profileData.avatar_url}
                      alt={selectedPost.user?.username || profileData.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-white">
                      {selectedPost.user?.username || profileData.username}
                    </span>
                    {selectedPost.location && (
                      <p className="text-[10px] text-neutral-400">{selectedPost.location}</p>
                    )}
                  </div>
                </div>

                <div className="py-4 text-xs text-neutral-200 leading-relaxed border-b border-neutral-800 max-h-[160px] overflow-y-auto">
                  <span className="font-semibold text-white mr-1.5">
                    {selectedPost.user?.username || profileData.username}
                  </span>
                  <FormattedText text={selectedPost.caption} />
                </div>
              </div>

              {/* Likes & Actions */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-4 text-xs font-semibold text-neutral-300">
                  <span>{selectedPost.likes_count} likes</span>
                  <span>{selectedPost.comments_count} comments</span>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal for Owner */}
      {isOwner && isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
