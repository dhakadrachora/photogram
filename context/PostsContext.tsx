'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Post, Comment } from '@/lib/types';
import { MOCK_POSTS, CURRENT_USER } from '@/lib/mock-data';

interface PostsContextType {
  posts: Post[];
  savedPosts: Post[];
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  toggleSave: (postId: string) => void;
  createPost: (newPost: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'created_at'>) => void;
  deletePost: (postId: string) => void;
}

const PostsContext = createContext<PostsContextType>({
  posts: MOCK_POSTS,
  savedPosts: [],
  toggleLike: () => {},
  addComment: () => {},
  toggleSave: () => {},
  createPost: () => {},
  deletePost: () => {},
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
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem('insta_posts');
      if (savedPosts) setPosts(JSON.parse(savedPosts));
    } catch (e) {}
  }, []);

  const savePostsToStorage = (updated: Post[]) => {
    setPosts(updated);
    try {
      localStorage.setItem('insta_posts', JSON.stringify(updated));
    } catch (e) {}
  };

  const toggleLike = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = !p.has_liked;
        return {
          ...p,
          has_liked: hasLiked,
          likes_count: hasLiked ? p.likes_count + 1 : p.likes_count - 1,
        };
      }
      return p;
    });
    savePostsToStorage(updated);
  };

  const addComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    const user = getActiveUser();
    if (!user) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      user: {
        username: user.username,
        avatar_url: user.avatar_url,
        is_verified: !!user.is_verified,
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
  };

  const toggleSave = (postId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          has_saved: !p.has_saved,
        };
      }
      return p;
    });
    savePostsToStorage(updated);
  };

  const createPost = (newPostData: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'created_at'>) => {
    const post: Post = {
      ...newPostData,
      id: `post_${Date.now()}`,
      likes_count: 0,
      comments_count: 0,
      has_liked: false,
      has_saved: false,
      created_at: new Date().toISOString(),
    };
    savePostsToStorage([post, ...posts]);
  };

  const deletePost = (postId: string) => {
    const updated = posts.filter((p) => p.id !== postId);
    savePostsToStorage(updated);
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
        deletePost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export const usePosts = () => useContext(PostsContext);
export default PostsProvider;
