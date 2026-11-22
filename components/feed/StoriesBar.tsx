'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Story } from '@/lib/types';
import { StoryViewerModal } from '@/components/instagram/StoryViewerModal';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { checkUploadPermission } from '@/lib/uploadPermissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function StoriesBar() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userStory, setUserStory] = useState<Story | null>(null);
  const [communityStories, setCommunityStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Load real active 24h stories from Supabase
  const loadLiveStories = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          caption,
          created_at,
          expires_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false });

      if (!error && data) {
        let currentUserStory: Story | null = null;
        const otherStoriesList: Story[] = [];

        data.forEach((row: any) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const storyItem: Story = {
            id: row.id,
            user_id: row.user_id,
            user: profile || {
              id: row.user_id,
              username: 'user',
              full_name: '',
              avatar_url: '',
              is_verified: false,
            },
            media_url: row.media_url,
            caption: row.caption || '',
            created_at: row.created_at,
            expires_at: row.expires_at,
          };

          if (user?.id && row.user_id === user.id) {
            if (!currentUserStory) {
              currentUserStory = storyItem;
            }
          } else {
            otherStoriesList.push(storyItem);
          }
        });

        if (currentUserStory) {
          setUserStory(currentUserStory);
        }
        setCommunityStories(otherStoriesList);
        return;
      }
    } catch (e) {
      console.warn('Could not fetch Supabase stories:', e);
    }

    // Fallback to local storage for current user if offline
    if (user) {
      try {
        const userKey = user.id || user.username;
        const raw = localStorage.getItem(`photogram_story_${userKey}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (new Date(parsed.expires_at).getTime() > Date.now()) {
            setUserStory(parsed);
          } else {
            localStorage.removeItem(`photogram_story_${userKey}`);
            setUserStory(null);
          }
        }
      } catch {
        setUserStory(null);
      }
    }
  }, [user]);

  useEffect(() => {
    loadLiveStories();

    // Supabase Realtime subscription for live stories
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('stories_live_feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stories' },
          () => {
            loadLiveStories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadLiveStories]);

  // Handle uploading user's new 24h story
  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isVid = file.type.startsWith('video');
    const cat = isVid ? 'allow_video_stories' : 'allow_photo_stories';

    const check = checkUploadPermission(cat, file);
    if (!check.allowed) {
      alert(check.reason || 'Story upload is currently disabled.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingStory(true);
    try {
      let mediaUrl = '';
      const res = await uploadToCloudinary(file, undefined, cat);
      if (res?.secure_url) {
        mediaUrl = res.secure_url;
      }

      if (!mediaUrl) {
        throw new Error('Upload failed');
      }

      // Insert directly into Supabase 'stories' table
      let storyId = `story_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 86400000).toISOString();

      if (isSupabaseConfigured() && user.id && user.id !== 'usr_me') {
        const { data: storyRow, error: storyErr } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            media_url: mediaUrl,
            media_type: isVid ? 'video' : 'image',
            caption: isVid ? 'Visual video story ✨' : 'My 24-hour visual story ✨',
          })
          .select('id, created_at, expires_at')
          .single();

        if (!storyErr && storyRow) {
          storyId = storyRow.id;
        }
      }

      const newStory: Story = {
        id: storyId,
        user_id: user.id,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url || '',
          is_verified: !!user.is_verified,
        },
        media_url: mediaUrl,
        caption: isVid ? 'Visual video story ✨' : 'My 24-hour visual story ✨',
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      setUserStory(newStory);
      const userKey = user.id || user.username;
      localStorage.setItem(`photogram_story_${userKey}`, JSON.stringify(newStory));
    } catch (err) {
      console.warn('Story upload error:', err);
    } finally {
      setIsUploadingStory(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const allActiveStories: Story[] = userStory
    ? [userStory, ...communityStories]
    : communityStories;

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
  };

  return (
    <div className="w-full bg-[#000000] border-y md:border md:rounded-xl border-[#262626] py-3.5 px-3 mb-4 overflow-x-auto no-scrollbar select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleStoryFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        {/* Current User Story bubble */}
        <div className="flex flex-col items-center shrink-0 cursor-pointer">
          <div
            onClick={() => {
              if (userStory) {
                handleOpenStory(0);
              } else {
                fileInputRef.current?.click();
              }
            }}
            className={`relative w-16 h-16 rounded-full p-[2.5px] transition-transform hover:scale-105 ${
              userStory
                ? 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]'
                : 'border border-neutral-700'
            }`}
            title={userStory ? 'View your story' : 'Add to your story'}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5 relative">
              <Image
                src={
                  user?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt="Your story"
                fill
                className="object-cover rounded-full"
              />

              {isUploadingStory && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Blue Plus Icon when no story exists */}
            {!userStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095f6] text-white flex items-center justify-center ring-2 ring-black"
                title="Add to story"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-neutral-300 mt-1.5 truncate max-w-[70px]">
            Your story
          </span>
        </div>

        {/* Real Community Stories (100% Real Users) */}
        {communityStories.map((story, idx) => {
          const adjustedIdx = userStory ? idx + 1 : idx;
          return (
            <div
              key={story.id}
              onClick={() => handleOpenStory(adjustedIdx)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5 relative">
                  <Image
                    src={
                      story.user.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={story.user.username}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
              </div>
              <span className="text-[11px] text-neutral-300 mt-1.5 truncate max-w-[70px]">
                {story.user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal
          isOpen={true}
          onClose={() => setSelectedStoryIndex(null)}
          stories={allActiveStories}
          initialIndex={selectedStoryIndex}
        />
      )}
    </div>
  );
}

export default StoriesBar;
