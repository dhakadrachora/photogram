import { Post, Profile, Story, Reel, Conversation } from './types';
import { MOCK_POSTS, CURRENT_USER, MOCK_CONVERSATIONS } from './mock-data';

export const getPosts = async (): Promise<Post[]> => MOCK_POSTS;
export const getStories = async (): Promise<Story[]> => [];
export const getReels = async (): Promise<Reel[]> => [];
export const getCurrentUser = async (): Promise<Profile> => CURRENT_USER;
export const getConversations = async (): Promise<Conversation[]> => MOCK_CONVERSATIONS;

export const instagramService = {
  getPosts,
  getStories,
  getReels,
  getCurrentUser,
  getConversations,
};

export default instagramService;
