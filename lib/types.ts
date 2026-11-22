export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  website?: string;
  is_verified?: boolean;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
}

export interface PostMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  display_order: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  text: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user: Profile;
  caption: string;
  location?: string;
  media: PostMedia[];
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  has_saved?: boolean;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  user: Profile;
  media_url: string;
  caption?: string;
  created_at?: string;
  expires_at?: string;
  is_seen?: boolean;
}

export interface Reel {
  id: string;
  user_id: string;
  user: Profile;
  video_url: string;
  thumbnail_url?: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  has_saved?: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  media_url?: string;
  created_at: string;
  is_read?: boolean;
}

export interface Conversation {
  id: string;
  user: Profile;
  last_message?: Message;
  unread_count: number;
}
