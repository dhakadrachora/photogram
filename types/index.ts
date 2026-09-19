export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  badge: string;
  coins: number;
  dhotiCoins?: number;
  wins: number;
  battles: number;
  rank: string;
  isGoogle?: boolean;
  role?: 'admin' | 'resident';
  isAdmin?: boolean;
  createdAt?: number | string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userBadge: string;
  text: string;
  timestamp: number;
  sticker?: string;
  isAi?: boolean;
  battleInvite?: {
    battleId: string;
    mode: 'rap' | 'roast' | 'wit';
  };
}

export type VoiceState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export type AppTab = 'home' | 'worldchat' | 'battle' | 'assistant' | 'profile' | 'admin';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface BattleRound {
  roundNumber: number;
  playerVerse: string;
  opponentVerse: string;
  playerScore: number;
  opponentScore: number;
  commentary: string;
}

export interface BattleState {
  id: string;
  mode: 'rap' | 'roast' | 'wit';
  opponent: {
    name: string;
    avatar: string;
    title: string;
  };
  rounds: BattleRound[];
  currentRound: number;
  totalRounds: number;
  playerTotalScore: number;
  opponentTotalScore: number;
  crowdHype: number; // 0 to 100
  status: 'idle' | 'countdown' | 'player_turn' | 'opponent_turn' | 'judging' | 'round_complete' | 'winner_declared';
  winner?: 'player' | 'opponent' | 'tie';
  judgeSummary?: string;
}

export interface BattleEventOption {
  id: string;
  label: string;
  tagline: string;
  votes: number;
  emoji: string;
  imageUrl?: string;
}

export interface BattleEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  optionA: BattleEventOption;
  optionB: BattleEventOption;
  isEnded: boolean;
  startsAt?: number;
  endsAt: number;
  published?: boolean;
  status?: 'upcoming' | 'active' | 'closed';
  winnerOptionId?: string;
  userVotedOptionId?: string;
  totalVotes?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  published: boolean;
  createdAt: number;
  views?: number;
}

export interface PersonProfile {
  id: string;
  name: string;
  designation: string;
  bio: string;
  photoUrl: string;
  achievements: string;
  category: string;
  published: boolean;
  createdAt: number;
}

export interface BusinessItem {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  description: string;
  logoUrl: string;
  verified: boolean;
  published: boolean;
  createdAt: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
  published: boolean;
  createdAt: number;
}

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  published: boolean;
  createdAt: number;
  views?: number;
}

export interface CommunityUpdate {
  id: string;
  title: string;
  summary: string;
  tag: string;
  badgeColor: string; // e.g., 'emerald', 'amber', 'sky', 'purple'
  published: boolean;
  date: string;
  linkUrl?: string;
  createdAt: number;
}

export interface SiteSettings {
  siteTitle: string;
  siteTagline: string;
  announcementBanner: string;
  isAnnouncementActive: boolean;
  allowWorldChat: boolean;
  allowGuestAi: boolean;
  heroBadge: string;
  contactEmail: string;
}

