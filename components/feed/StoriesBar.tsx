'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Camera, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Story } from '@/lib/types';
import { StoryViewerModal } from '@/components/instagram/StoryViewerModal';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { checkUploadPermission } from '@/lib/uploadPermissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const CREATOR_STORIES: Story[] = [
  {
    id: 'story_kabir',
    user_id: 'usr_kabir',
    user: {
      id: 'usr_kabir',
      username: 'kabir.explores',
      full_name: 'Kabir Mehta',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=85',
    caption: 'Sunrise hitting the peak in the Swiss Alps 🏔️✨',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'story_ananya',
    user_id: 'usr_ananya',
    user: {
      id: 'usr_ananya',
      username: 'ananya.lens',
      full_name: 'Ananya Roy',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=85',
    caption: 'Mediterranean summer golden hour overlooking cliffs 🍋🌊',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'story_zoya',
    user_id: 'usr_zoya',
    user: {
      id: 'usr_zoya',
      username: 'zoya.spaces',
      full_name: 'Zoya Khan',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1080&auto=format&fit=crop&q=85',
    caption: 'Minimalist living pavilion in Kyoto 📐✨',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'story_rohan',
    user_id: 'usr_rohan',
    user: {
      id: 'usr_rohan',
      username: 'rohan.raw',
      full_name: 'Rohan Sen',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    media_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1080&auto=format&fit=crop&q=85',
    caption: 'Tokyo rain reflections through Shinjuku alleys 🏮🌧️',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'story_vikram',
    user_id: 'usr_vikram',
    user: {
      id: 'usr_vikram',
      username: 'vikram.aerials',
      full_name: 'Vikram Aditya',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      is_verified: true,
    },
    media_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=85',
    caption: 'Crystal turquoise waters from 500ft 🏝️🚁',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

export function StoriesBar() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userStory, setUserStory] = useState<Story | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Load user's active 24h story from Supabase and local cache
  useEffect(() => {
    if (!user) return;

    const loadLiveStories = async () => {
      if (isSupabaseConfigured() && user.id && user.id !== 'usr_me') {
        try {
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
            .eq('user_id', user.id)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) {
            const row = data[0];
            const liveStory: Story = {
              id: row.id,
              user_id: row.user_id,
              user: (row.profiles as any) || user,
              media_url: row.media_url,
              caption: row.caption || '',
              created_at: row.created_at,
              expires_at: row.expires_at,
            };
            setUserStory(liveStory);
            return;
          }
        } catch (e) {
          console.warn('Could not fetch Supabase story:', e);
        }
      }

      // Fallback to local storage if offline or pending
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
    };

    loadLiveStories();
  }, [user]);

  // Handle uploading user's new 24h story (Photo or Video Stories permitted)
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

  const allActiveStories: Story[] = userStory ? [userStory, ...CREATOR_STORIES] : CREATOR_STORIES;

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

        {/* Creator Stories */}
        {CREATOR_STORIES.map((story, idx) => {
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
                    src={story.user.avatar_url}
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
