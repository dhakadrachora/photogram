'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Post, Comment } from '@/lib/types';
import { MOCK_POSTS } from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface PostsContextType {
  posts: Post[];
  savedPosts: Post[];
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleSave: (postId: string) => void;
  createPost: (newPost: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'created_at'>) => void;
  updatePost: (postId: string, data: { caption?: string; location?: string }) => Promise<{ success: boolean; error?: string }>;
  deletePost: (postId: string) => void;
  refreshPosts: () => void;
}

const PostsContext = createContext<PostsContextType>({
  posts: [],
  savedPosts: [],
  toggleLike: () => {},
  addComment: () => {},
  toggleSave: () => {},
  createPost: () => {},
  updatePost: async () => ({ success: true }),
  deletePost: () => {},
  refreshPosts: () => {},
});

const getActiveUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored =
      localStorage.getItem('photogram_active_session') ||
      localStorage.getItem('insta_current_user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export function PostsProvider({ children }: { children: React.ReactNode }) {
  // Pure Real Posts - No Fake Accounts
  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch real posts from Supabase PostgreSQL tables
  const fetchPostsFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          location,
          created_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          ),
          post_media (
            id,
            media_url,
            media_type,
            display_order
          ),
          likes (
            user_id
          ),
          comments (
            id,
            user_id,
            text,
            created_at,
            profiles (
              username,
              avatar_url,
              is_verified
            )
          ),
          saved_posts (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const activeUser = getActiveUser();
        const currentUserId = activeUser?.id;

        const formattedPosts: Post[] = data.map((item: any) => {
          const mediaList = (item.post_media || []).sort(
            (a: any, b: any) => a.display_order - b.display_order
          );
          const hasLiked = currentUserId
            ? (item.likes || []).some((l: any) => l.user_id === currentUserId)
            : false;
          const hasSaved = currentUserId
            ? (item.saved_posts || []).some((s: any) => s.user_id === currentUserId)
            : false;

          return {
            id: item.id,
            user_id: item.user_id,
            user: item.profiles || {
              id: item.user_id,
              username: 'photogram_user',
              full_name: 'Photogram User',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              is_verified: false,
            },
            caption: item.caption || '',
            location: item.location || '',
            media: mediaList.length > 0 ? mediaList : [
              {
                id: `m_${item.id}`,
                media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                media_type: 'image',
                display_order: 0,
              }
            ],
            likes_count: (item.likes || []).length,
            comments_count: (item.comments || []).length,
            has_liked: hasLiked,
            has_saved: hasSaved,
            created_at: item.created_at,
          };
        });

        setPosts(formattedPosts);
        try {
          localStorage.setItem('insta_posts', JSON.stringify(formattedPosts));
        } catch {}
      }
    } catch (e) {
      console.warn('Could not fetch Supabase posts:', e);
    }
  }, []);

  useEffect(() => {
    // 1. Load cached or fallback posts first
    try {
      const savedPosts = localStorage.getItem('insta_posts');
      if (savedPosts) setPosts(JSON.parse(savedPosts));
    } catch (e) {}

    // 2. Load live Supabase posts
    fetchPostsFromSupabase();

    // 3. Supabase Realtime Listener for new/updated posts
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('public_posts_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          () => {
            fetchPostsFromSupabase();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchPostsFromSupabase]);

  const savePostsToStorage = (updated: Post[]) => {
    setPosts(updated);
    try {
      localStorage.setItem('insta_posts', JSON.stringify(updated));
    } catch (e) {}
  };

  const toggleLike = async (postId: string) => {
    const activeUser = getActiveUser();
    const userId = activeUser?.id;

    let isNowLiked = false;
    const updated = posts.map((p) => {
      if (p.id === postId) {
        isNowLiked = !p.has_liked;
        return {
          ...p,
          has_liked: isNowLiked,
          likes_count: isNowLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
        };
      }
      return p;
    });
    savePostsToStorage(updated);

    // Sync with Supabase PostgreSQL
    if (isSupabaseConfigured() && userId && userId !== 'usr_me') {
      try {
        if (isNowLiked) {
          await supabase.from('likes').insert({ post_id: postId, user_id: userId });
          const targetPost = posts.find((p) => p.id === postId);
          if (targetPost && targetPost.user_id !== userId) {
            await supabase.from('notifications').insert({
              user_id: targetPost.user_id,
              actor_id: userId,
              type: 'like',
              post_id: postId,
            });
          }
        } else {
          await supabase.from('likes').delete().match({ post_id: postId, user_id: userId });
        }
      } catch (err) {
        console.warn('Supabase like sync error:', err);
      }
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!text.trim()) return;
    const activeUser = getActiveUser();
    if (!activeUser) return;

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      post_id: postId,
      user_id: activeUser.id,
      user: {
        username: activeUser.username,
        avatar_url: activeUser.avatar_url,
        is_verified: !!activeUser.is_verified,
      },
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments_count: p.comments_count + 1,
        };
      }
      return p;
    });
    savePostsToStorage(updated);

    // Sync with Supabase PostgreSQL
    if (isSupabaseConfigured() && activeUser.id && activeUser.id !== 'usr_me') {
      try {
        await supabase.from('comments').insert({
          post_id: postId,
          user_id: activeUser.id,
          text: text.trim(),
        });
        const targetPost = posts.find((p) => p.id === postId);
        if (targetPost && targetPost.user_id !== activeUser.id) {
          await supabase.from('notifications').insert({
            user_id: targetPost.user_id,
            actor_id: activeUser.id,
            type: 'comment',
            post_id: postId,
          });
        }
      } catch (err) {
        console.warn('Supabase comment sync error:', err);
      }
    }
  };

  const toggleSave = async (postId: string) => {
    const activeUser = getActiveUser();
    const userId = activeUser?.id;

    let isNowSaved = false;
    const updated = posts.map((p) => {
      if (p.id === postId) {
        isNowSaved = !p.has_saved;
        return {
          ...p,
          has_saved: isNowSaved,
        };
      }
      return p;
    });
    savePostsToStorage(updated);

    // Sync with Supabase PostgreSQL
    if (isSupabaseConfigured() && userId && userId !== 'usr_me') {
      try {
        if (isNowSaved) {
          await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
        } else {
          await supabase.from('saved_posts').delete().match({ post_id: postId, user_id: userId });
        }
      } catch (err) {
        console.warn('Supabase save sync error:', err);
      }
    }
  };

  const createPost = async (newPostData: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'created_at'>) => {
    const activeUser = getActiveUser();
    const userId = activeUser?.id || newPostData.user_id;

    // Direct insert into Supabase
    if (isSupabaseConfigured() && userId && userId !== 'usr_me') {
      try {
        const { data: postData, error: postErr } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            caption: newPostData.caption || '',
            location: newPostData.location || '',
          })
          .select('id, created_at')
          .single();

        if (!postErr && postData) {
          const mediaToInsert = (newPostData.media || []).map((m, idx) => ({
            post_id: postData.id,
            media_url: m.media_url,
            media_type: m.media_type || 'image',
            display_order: idx,
          }));

          if (mediaToInsert.length > 0) {
            await supabase.from('post_media').insert(mediaToInsert);
          }

          const livePost: Post = {
            ...newPostData,
            id: postData.id,
            user_id: userId,
            likes_count: 0,
            comments_count: 0,
            has_liked: false,
            has_saved: false,
            created_at: postData.created_at,
          };
          savePostsToStorage([livePost, ...posts]);
          return;
        }
      } catch (err) {
        console.warn('Supabase post creation error, fallback locally:', err);
      }
    }

    // Local fallback
    const fallbackPost: Post = {
      ...newPostData,
      id: `post_${Date.now()}`,
      likes_count: 0,
      comments_count: 0,
      has_liked: false,
      has_saved: false,
      created_at: new Date().toISOString(),
    };
    savePostsToStorage([fallbackPost, ...posts]);
  };

  const updatePost = async (
    postId: string,
    data: { caption?: string; location?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const activeUser = getActiveUser();
    const userId = activeUser?.id;

    // Optimistically update local posts state
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          caption: data.caption !== undefined ? data.caption : p.caption,
          location: data.location !== undefined ? data.location : p.location,
        };
      }
      return p;
    });
    savePostsToStorage(updated);

    // Sync with Supabase (Security: user can only edit their own post)
    if (isSupabaseConfigured() && userId && userId !== 'usr_me') {
      try {
        const { error: sbErr } = await supabase
          .from('posts')
          .update({
            caption: data.caption,
            location: data.location,
          })
          .eq('id', postId)
          .eq('user_id', userId);

        if (sbErr) {
          console.warn('Supabase post update warning:', sbErr);
          return { success: false, error: sbErr.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Update failed' };
      }
    }

    return { success: true };
  };

  const deletePost = async (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    savePostsToStorage(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').delete().eq('id', postId);
      } catch (err) {
        console.warn('Supabase post delete error:', err);
      }
    }
  };

  const savedPosts = posts.filter((p) => p.has_saved);

  return (
    <PostsContext.Provider
      value={{
        posts,
        savedPosts,
        toggleLike,
        addComment,
        toggleSave,
        createPost,
        updatePost,
        deletePost,
        refreshPosts: fetchPostsFromSupabase,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
