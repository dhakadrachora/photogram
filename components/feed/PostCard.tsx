'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { PostHeader } from './PostHeader';
import { PostMediaCarousel } from './PostMediaCarousel';
import { PostActions } from './PostActions';
import { Check, Smile } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { toggleLike, addComment, toggleSave } = usePosts();
  const { user } = useAuth();
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleMediaDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (!post.has_liked) {
        toggleLike(post.id);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 850);
    }
    setLastTap(now);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText);
    setCommentsList((prev) => [...prev, commentText.trim()]);
    setCommentText('');
    setShowAllComments(true);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/#${post.id}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <article className="w-full bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] border-y md:border md:rounded-xl border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] pb-3 transition-colors">
      <PostHeader user={post.user} location={post.location} />

      <PostMediaCarousel
        media={post.media}
        activeIndex={activeMediaIdx}
        onIndexChange={setActiveMediaIdx}
        showHeartPop={showHeartPop}
        onDoubleTap={handleMediaDoubleTap}
      />

      <PostActions
        hasLiked={post.has_liked}
        hasSaved={post.has_saved}
        likesCount={post.likes_count}
        commentsCount={post.comments_count + commentsList.length}
        onToggleLike={() => toggleLike(post.id)}
        onToggleSave={() => toggleSave(post.id)}
        onOpenComments={() => setShowAllComments((prev) => !prev)}
        onShare={handleShare}
      />

      {/* Caption & Comments */}
      <div className="px-3 pt-1 space-y-1 text-xs">
        {isCopied && (
          <div className="text-[11px] text-green-400 font-semibold flex items-center gap-1 py-0.5">
            <Check className="w-3.5 h-3.5" />
            <span>Link copied to clipboard!</span>
          </div>
        )}

        <p className="leading-relaxed text-white dark:text-white light:text-black">
          <Link href="/profile" className="font-semibold mr-1.5 hover:underline">
            {post.user.username}
          </Link>
          <span className="text-neutral-200 dark:text-neutral-200 light:text-neutral-800">
            {post.caption}
          </span>
        </p>

        {commentsList.length > 0 && (
          <button
            onClick={() => setShowAllComments((prev) => !prev)}
            className="text-neutral-500 text-[11px] hover:underline block pt-0.5"
          >
            {showAllComments
              ? 'Hide comments'
              : `View all ${post.comments_count + commentsList.length} comments`}
          </button>
        )}

        {showAllComments && (
          <div className="space-y-1 pt-1 border-t border-neutral-800/50">
            {commentsList.map((c, i) => (
              <p key={i} className="text-[11px] text-neutral-300">
                <span className="font-semibold text-white mr-1.5">
                  {user?.username || 'user'}
                </span>
                {c}
              </p>
            ))}
          </div>
        )}

        {/* Comment input form */}
        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2 border-t border-neutral-800/40">
          <Smile className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
          />
          {commentText.trim() && (
            <button type="submit" className="text-xs font-semibold text-[#0095f6] hover:text-sky-400">
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}

export default PostCard;
