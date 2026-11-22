import { Post, Profile, Conversation } from './types';

// Real Empty Defaults - Zero Fake Accounts
export const CURRENT_USER: Profile = {
  id: '',
  username: '',
  full_name: '',
  avatar_url: '',
  bio: '',
  website: '',
  is_verified: false,
  posts_count: 0,
  followers_count: 0,
  following_count: 0,
};

export const MOCK_POSTS: Post[] = [];

export const MOCK_CONVERSATIONS: Conversation[] = [];
