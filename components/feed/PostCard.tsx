'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { usePosts } from '@/context/PostsContext';
import { useAuth } from '@/context/AuthContext';
import { PostHeader } from './PostHeader';
import { PostMediaCarousel } from './PostMediaCarousel';
import { PostActions } from './PostActions';
import { Check, Smile, Trash2, Flag, EyeOff, Copy, X } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { toggleLike, addComment, toggleSave, deletePost } = usePosts();
  const { user, updateProfile } = useAuth();
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isAuthor =
    (Boolean(user?.username) &&
      Boolean(post.user?.username) &&
      user!.username.toLowerCase() === post.user.username.toLowerCase()) ||
    (Boolean(user?.id) && Boolean(post.user_id) && user!.id === post.user_id);

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

  const handleDeletePost = () => {
    deletePost(post.id);
    if (isAuthor && (user?.posts_count ?? 0) > 0) {
      updateProfile({ posts_count: Math.max(0, (user?.posts_count ?? 1) - 1) });
    }
    setIsMenuOpen(false);
    setShowDeleteConfirm(false);
  };

  return (
    <article className="w-full bg-[#000000] dark:bg-[#000000] light:bg-[#ffffff] border-y md:border md:rounded-xl border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] pb-3 transition-colors relative">
      <PostHeader
        user={post.user}
        location={post.location}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

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

      {/* Instagram Post Action Menu Modal */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none"
          onClick={() => {
            setIsMenuOpen(false);
            setShowDeleteConfirm(false);
          }}
        >
          <div
            className="w-full max-w-xs bg-[#262626] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl text-center divide-y divide-neutral-700/60"
            onClick={(e) => e.stopPropagation()}
          >
            {showDeleteConfirm ? (
              <div className="p-5 space-y-3">
                <h4 className="font-bold text-sm text-white">Delete Post?</h4>
                <p className="text-xs text-neutral-400">
                  Are you sure you want to delete this post? This cannot be undone.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-neutral-700 hover:bg-neutral-600 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isAuthor ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3.5 text-xs font-bold text-red-500 hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setNotice('Post reported to moderators.');
                        setIsMenuOpen(false);
                        setTimeout(() => setNotice(null), 3000);
                      }}
                      className="w-full py-3.5 text-xs font-bold text-red-500 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Report
                    </button>
                    <button
                      onClick={() => {
                        setNotice('Post marked as Not Interested.');
                        setIsMenuOpen(false);
                        setTimeout(() => setNotice(null), 3000);
                      }}
                      className="w-full py-3.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Not Interested
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    handleShare();
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Copy link
                </button>

                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3.5 text-xs text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-20 animate-in fade-in">
          {notice}
        </div>
      )}
    </article>
  );
}

export default PostCard;
