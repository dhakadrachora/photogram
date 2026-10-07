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
  isVerified?: boolean;

  /**
   * Account moderation.
   */
  isBlocked?: boolean;
  blockedAt?: number | string;
  blockedReason?: string;

  /**
   * Feature-specific restrictions.
   */
  chatBlocked?: boolean;
  votingBlocked?: boolean;
  battleBlocked?: boolean;

  createdAt?: number | string;
}

export interface ChatMessage {
  id: string;

  userId: string;
  userName: string;
  userAvatar: string;
  userBadge: string;

  text: string;

  /**
   * Unix timestamp in milliseconds.
   */
  timestamp: number;

  sticker?: string;

  isAi?: boolean;
  isVerified?: boolean;

  battleInvite?: {
    battleId: string;
    mode: 'rap' | 'roast' | 'wit';
  };
}

export interface PresenceUser {
  userId: string;
  userName: string;
  userAvatar: string;

  userBadge?: string;
  isVerified?: boolean;
  isAdmin?: boolean;

  /**
   * Unix timestamp in milliseconds.
   */
  lastActive: number;
}

export type VoiceState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking';

export type AppTab =
  | 'home'
  | 'worldchat'
  | 'battle'
  | 'assistant'
  | 'profile'
  | 'support'
  | 'rewards'
  | 'news'
  | 'tools';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/* 1v1 AI Battle                                                              */
/* -------------------------------------------------------------------------- */

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

  crowdHype: number;

  status:
    | 'idle'
    | 'countdown'
    | 'player_turn'
    | 'opponent_turn'
    | 'judging'
    | 'round_complete'
    | 'winner_declared';

  winner?: 'player' | 'opponent' | 'tie';

  judgeSummary?: string;
}

/* -------------------------------------------------------------------------- */
/* Community Battle                                                           */
/* -------------------------------------------------------------------------- */

export interface BattleEventOption {
  /**
   * Option ID used for voting.
   */
  id: string;

  /**
   * Public option name.
   */
  label: string;

  /**
   * Short description/tagline.
   */
  tagline: string;

  /**
   * REAL vote count from database.
   * Never generate this randomly on frontend.
   */
  votes: number;

  /**
   * Emoji fallback.
   */
  emoji: string;

  /**
   * Real uploaded image URL.
   *
   * Can point to Supabase Storage, Cloudflare R2,
   * or another configured image CDN.
   */
  imageUrl?: string;

  /**
   * Optional database snake_case compatibility.
   */
  image_url?: string;
}

/**
 * Community Battle status.
 *
 * upcoming = scheduled but not started
 * active   = voting is open
 * ended    = timer finished and winner calculated
 * closed   = admin manually closed/archived it
 */
export type BattleEventStatus =
  | 'upcoming'
  | 'active'
  | 'ended'
  | 'closed'
  | 'draft'
  | 'scheduled';

export interface BattleEvent {
  /**
   * Unique battle ID.
   */
  id: string;

  title: string;

  category: string;

  description: string;

  /**
   * Two real battle participants/options.
   */
  optionA: BattleEventOption;
  optionB: BattleEventOption;

  /**
   * Whether voting has ended.
   */
  isEnded: boolean;

  /**
   * Server-controlled start timestamp.
   */
  startsAt?: number;

  /**
   * Server-controlled end timestamp.
   *
   * This is the source used for countdown/expiry.
   */
  endsAt?: number;

  /**
   * Custom battle duration.
   *
   * Admin can use any duration.
   */
  durationMs?: number;

  durationSeconds?: number;
  durationMinutes?: number;
  durationHours?: number;
  durationDays?: number;

  /**
   * Public visibility.
   */
  published?: boolean;

  /**
   * Current battle status.
   */
  status?: BattleEventStatus;

  /**
   * Winner option ID after timer expires.
   *
   * null/undefined means:
   * - battle still active, OR
   * - battle ended in a draw.
   */
  winnerOptionId?: string | null;

  /**
   * Logged-in user's own vote.
   *
   * This should come from the authenticated user's vote record.
   */
  userVotedOptionId?: string | null;

  /**
   * Total real votes.
   */
  totalVotes?: number;

  /**
   * Optional server-generated result metadata.
   */
  winnerLabel?: string | null;

  /**
   * True when both options have the same vote count
   * after the battle has ended.
   */
  isDraw?: boolean;

  /**
   * Optional result timestamp.
   */
  endedAt?: number | string | null;

  /**
   * Whether comments are currently open.
   *
   * Normally derived from battle status/end time,
   * but useful for API responses.
   */
  commentsOpen?: boolean;

  /**
   * Optional comment count.
   */
  commentCount?: number;

  /**
   * Optional database-compatible snake_case fields.
   * These help when mapping Supabase rows.
   */
  starts_at?: string | number | null;
  ends_at?: string | number | null;
  winner_option_id?: string | null;
  total_votes?: number;
}

/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Business                                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export interface GalleryItem {
  id: string;

  title: string;
  category: string;

  imageUrl: string;

  caption: string;

  published: boolean;

  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/* Videos                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Community Updates                                                          */
/* -------------------------------------------------------------------------- */

export interface CommunityUpdate {
  id: string;

  title: string;
  summary: string;

  tag: string;

  /**
   * Example:
   * emerald / amber / sky / purple
   */
  badgeColor: string;

  published: boolean;

  date: string;

  linkUrl?: string;

  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/* Site Settings                                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export type ReportStatus =
  | 'Open'
  | 'Replied'
  | 'Resolved';

export interface ReportMessage {
  id: string;

  reportId: string;

  senderId: string;
  senderName: string;
  senderEmail: string;

  senderRole: 'user' | 'admin';

  message: string;

  attachmentUrl?: string;

  createdAt: string;
}

export interface ProblemReport {
  id: string;

  userId: string;

  userName: string;
  userEmail: string;

  subject: string;

  description: string;

  category?: string;

  attachmentUrl?: string;

  status: ReportStatus;

  latestMessage?: string;

  createdAt: string;
  updatedAt: string;

  messages?: ReportMessage[];
}