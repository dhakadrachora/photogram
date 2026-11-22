'use client';

import React from 'react';
import { PostCard } from '@/components/feed/PostCard';
import { Post } from '@/lib/types';

export function FeedPostCard({ post }: { post: Post }) {
  return <PostCard post={post} />;
}

export default FeedPostCard;
