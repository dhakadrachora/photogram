import {
  NewsItem,
  PersonProfile,
  BusinessItem,
  GalleryItem,
  VideoItem,
  CommunityUpdate,
  BattleEvent,
  SiteSettings,
  ChatMessage,
  PresenceUser,
} from '@/types';

/**
 * Community Battle runtime/store type.
 *
 * Important:
 * - Battle itself is persisted in Supabase by the API routes.
 * - This in-memory store is only a compatibility/runtime layer.
 * - Votes are keyed by authenticated user identity.
 * - Expired battles are NEVER automatically deleted.
 * - NO seed data exists here. Supabase is the ONLY source of truth.
 */
export interface BattleEventStore extends BattleEvent {
  votedUserEmails: Set<string>;
  userVotes: Map<string, string>;

  /**
   * Optional timer metadata used by the battle UI/API.
   */
  durationMs?: number;
  durationSeconds?: number;
  durationMinutes?: number;
  durationHours?: number;
  durationDays?: number;

  /**
   * Server-controlled battle timing.
   */
  startsAt?: number;
  endsAt?: number;

  /**
   * Winner is only finalized after the battle ends.
   * null/undefined = no winner yet or draw.
   */
  winnerOptionId?: string | null;

  /**
   * Battle status.
   */
  status?: 'draft' | 'scheduled' | 'active' | 'ended' | 'closed';

  /**
   * Optional published flag.
   */
  published?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const now = () => Date.now();

const minutes = (value: number) => value * 60 * 1000;
const hours = (value: number) => value * 60 * 60 * 1000;
const days = (value: number) => value * 24 * 60 * 60 * 1000;

/**
 * Battle messages/comments expire from UI/API after 10 minutes.
 *
 * NOTE:
 * This does NOT mean the battle itself expires after 10 minutes.
 * Each battle can have its own custom timer.
 */
export const WORLD_CHAT_EXPIRATION_MS = minutes(10);

/**
 * Maximum number of legacy in-memory chat messages retained.
 * Supabase remains the real source of truth for production chat.
 */
export const MAX_MEMORY_CHAT_MESSAGES = 100;

/* -------------------------------------------------------------------------- */
/* ⚠️ SEED DATA REMOVED                                                       */
/* -------------------------------------------------------------------------- */
/*
 * ALL hard-coded seed arrays have been DELETED.
 *
 * Reason:
 * - Seed data caused deleted battles to RESURRECT after server restart.
 * - Seed data caused fake votes (342, 512, 780) to appear.
 * - Supabase is the SINGLE SOURCE OF TRUTH.
 *
 * Everything is now loaded from Supabase in the API routes.
 */

/* -------------------------------------------------------------------------- */
/* Battle Helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Creates a safe battle state.
 */
function createBattle(
  battle: BattleEventStore
): BattleEventStore {
  return {
    ...battle,

    votedUserEmails:
      battle.votedUserEmails instanceof Set
        ? battle.votedUserEmails
        : new Set<string>(),

    userVotes:
      battle.userVotes instanceof Map
        ? battle.userVotes
        : new Map<string, string>(),

    winnerOptionId:
      battle.winnerOptionId ?? null,

    published:
      battle.published ?? false,

    status:
      battle.status ??
      (battle.isEnded ? 'closed' : 'active'),
  };
}

/**
 * Calculates winner from real persisted vote totals.
 */
export function calculateBattleWinner(
  battle: Pick<BattleEventStore, 'optionA' | 'optionB'>
): string | null {
  const aVotes = Number(battle.optionA?.votes ?? 0);
  const bVotes = Number(battle.optionB?.votes ?? 0);

  if (aVotes === bVotes) {
    return null;
  }

  return aVotes > bVotes
    ? battle.optionA.id
    : battle.optionB.id;
}

/**
 * Returns whether a battle has reached its server-defined end time.
 */
export function isBattleExpired(
  battle: Pick<BattleEventStore, 'endsAt' | 'isEnded' | 'status'>,
  timestamp = Date.now()
): boolean {
  if (battle.isEnded) return true;

  if (
    battle.status === 'ended' ||
    battle.status === 'closed'
  ) {
    return true;
  }

  if (
    typeof battle.endsAt === 'number' &&
    Number.isFinite(battle.endsAt)
  ) {
    return timestamp >= battle.endsAt;
  }

  return false;
}

/**
 * Finalizes a battle in memory.
 */
export function finalizeBattle(
  battle: BattleEventStore,
  timestamp = Date.now()
): BattleEventStore {
  if (!isBattleExpired(battle, timestamp)) {
    return battle;
  }

  const winnerOptionId = calculateBattleWinner(battle);

  return {
    ...battle,
    isEnded: true,
    status: 'ended',
    winnerOptionId,
  };
}

/**
 * Gets remaining time in milliseconds.
 */
export function getBattleRemainingMs(
  battle: Pick<BattleEventStore, 'endsAt' | 'isEnded' | 'status'>,
  timestamp = Date.now()
): number {
  if (isBattleExpired(battle, timestamp)) {
    return 0;
  }

  if (
    typeof battle.endsAt !== 'number' ||
    !Number.isFinite(battle.endsAt)
  ) {
    return 0;
  }

  return Math.max(0, battle.endsAt - timestamp);
}

/**
 * Formats a battle timer for UI.
 */
export function formatBattleCountdown(
  milliseconds: number
): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutesValue = totalMinutes % 60;
  const hoursValue = Math.floor(totalMinutes / 60);
  const daysValue = Math.floor(hoursValue / 24);

  const hoursWithoutDays = hoursValue % 24;

  if (daysValue > 0) {
    return `${daysValue}d ${String(hoursWithoutDays).padStart(
      2,
      '0'
    )}:${String(minutesValue).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(hoursWithoutDays).padStart(
    2,
    '0'
  )}:${String(minutesValue).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
}

/* -------------------------------------------------------------------------- */
/* Initial Settings                                                           */
/* -------------------------------------------------------------------------- */

const initialSettings: SiteSettings = {
  siteTitle: 'DHOTI AALE',
  siteTagline: 'Chat • Battle • AI Assistant',

  announcementBanner:
    'Welcome to DHOTI AALE community! Join active battles, live chat, and voice AI.',

  isAnnouncementActive: true,

  allowWorldChat: true,

  allowGuestAi: true,

  heroBadge:
    'Pure Desi Vibe • 100% Real Community 👑',

  contactEmail:
    'rohitdhakaddhoti143@gmail.com',
};

/* -------------------------------------------------------------------------- */
/* Global Store                                                               */
/* -------------------------------------------------------------------------- */

class GlobalContentStore {
  /**
   * Content collections.
   *
   * ⚠️ These maps start EMPTY.
   * They are populated from Supabase in the API routes.
   */
  news: Map<string, NewsItem> = new Map();

  people: Map<string, PersonProfile> = new Map();

  business: Map<string, BusinessItem> = new Map();

  gallery: Map<string, GalleryItem> = new Map();

  videos: Map<string, VideoItem> = new Map();

  updates: Map<string, CommunityUpdate> = new Map();

  /**
   * Battles.
   *
   * ⚠️ Starts EMPTY.
   * Battles are loaded from Supabase in the API routes.
   *
   * Expired battles remain in this map.
   * They are only removed when an admin explicitly deletes them.
   */
  battles: Map<string, BattleEventStore> = new Map();

  settings: SiteSettings = {
    ...initialSettings,
  };

  /**
   * Legacy/runtime chat cache.
   */
  chatMessages: ChatMessage[] = [];

  /**
   * Admin-verified users.
   */
  verifiedUsers: Set<string> = new Set([
    'rohitdhakaddhoti143@gmail.com',
    'dhoti_aale_ai_official',
  ]);

  /**
   * Runtime presence cache.
   */
  activePresence: Map<
    string,
    PresenceUser
  > = new Map();

  /**
   * AI participant control.
   */
  aiControlState = {
    paused: false,
    pausedAt: 0,
    lastRepliedAt: 0,
    lastRepliedMsgId: '',
  };

  /**
   * Remove expired in-memory chat messages.
   */
  cleanupExpiredChatMessages(
    timestamp = Date.now()
  ): number {
    const cutoff =
      timestamp - WORLD_CHAT_EXPIRATION_MS;

    const before = this.chatMessages.length;

    this.chatMessages = this.chatMessages.filter(
      (message) => {
        const messageTime = Number(
          message.timestamp ?? 0
        );

        return (
          Number.isFinite(messageTime) &&
          messageTime >= cutoff
        );
      }
    );

    return before - this.chatMessages.length;
  }

  /**
   * Add a runtime chat message.
   */
  addChatMessage(
    message: ChatMessage
  ): void {
    this.cleanupExpiredChatMessages();

    this.chatMessages.push(message);

    if (
      this.chatMessages.length >
      MAX_MEMORY_CHAT_MESSAGES
    ) {
      this.chatMessages =
        this.chatMessages.slice(
          -MAX_MEMORY_CHAT_MESSAGES
        );
    }
  }

  /**
   * Remove a runtime chat message.
   */
  removeChatMessage(
    messageId: string
  ): boolean {
    const before = this.chatMessages.length;

    this.chatMessages =
      this.chatMessages.filter(
        (message) =>
          message.id !== messageId
      );

    return (
      before !== this.chatMessages.length
    );
  }

  /**
   * Get a battle from runtime store.
   */
  getBattle(
    battleId: string
  ): BattleEventStore | null {
    return (
      this.battles.get(battleId) ?? null
    );
  }

  /**
   * Put/update a battle.
   */
  setBattle(
    battle: BattleEventStore
  ): BattleEventStore {
    const normalized =
      createBattle(battle);

    this.battles.set(
      normalized.id,
      normalized
    );

    return normalized;
  }

  /**
   * Finalize a battle if its timer has expired.
   */
  finalizeBattle(
    battleId: string,
    timestamp = Date.now()
  ): BattleEventStore | null {
    const battle =
      this.battles.get(battleId);

    if (!battle) {
      return null;
    }

    const finalized =
      finalizeBattle(
        battle,
        timestamp
      );

    this.battles.set(
      battleId,
      finalized
    );

    return finalized;
  }

  /**
   * Finalize all expired battles in memory.
   */
  finalizeExpiredBattles(
    timestamp = Date.now()
  ): number {
    let changed = 0;

    for (const [
      battleId,
      battle,
    ] of this.battles.entries()) {
      if (
        !isBattleExpired(
          battle,
          timestamp
        )
      ) {
        continue;
      }

      const finalized =
        finalizeBattle(
          battle,
          timestamp
        );

      const wasEnded =
        battle.isEnded === true &&
        (
          battle.status ===
            'ended' ||
          battle.status ===
            'closed'
        );

      if (!wasEnded) {
        this.battles.set(
          battleId,
          finalized
        );

        changed++;
      }
    }

    return changed;
  }

  /**
   * Record a runtime vote.
   */
  recordRuntimeVote(
    battleId: string,
    userKey: string,
    optionId: string
  ):
    | {
        success: true;
        battle: BattleEventStore;
      }
    | {
        success: false;
        reason:
          | 'BATTLE_NOT_FOUND'
          | 'BATTLE_ENDED'
          | 'INVALID_OPTION'
          | 'ALREADY_VOTED';
      } {
    const battle =
      this.battles.get(battleId);

    if (!battle) {
      return {
        success: false,
        reason: 'BATTLE_NOT_FOUND',
      };
    }

    if (
      isBattleExpired(battle)
    ) {
      this.finalizeBattle(
        battleId
      );

      return {
        success: false,
        reason: 'BATTLE_ENDED',
      };
    }

    const validOption =
      optionId ===
        battle.optionA.id ||
      optionId ===
        battle.optionB.id;

    if (!validOption) {
      return {
        success: false,
        reason: 'INVALID_OPTION',
      };
    }

    if (
      battle.userVotes.has(
        userKey
      ) ||
      battle.votedUserEmails.has(
        userKey
      )
    ) {
      return {
        success: false,
        reason: 'ALREADY_VOTED',
      };
    }

    if (
      optionId ===
      battle.optionA.id
    ) {
      battle.optionA.votes =
        Number(
          battle.optionA.votes ?? 0
        ) + 1;
    } else {
      battle.optionB.votes =
        Number(
          battle.optionB.votes ?? 0
        ) + 1;
    }

    battle.userVotes.set(
      userKey,
      optionId
    );

    battle.votedUserEmails.add(
      userKey
    );

    this.battles.set(
      battleId,
      battle
    );

    return {
      success: true,
      battle,
    };
  }

  /**
   * Explicit admin deletion only.
   */
  deleteBattle(
    battleId: string
  ): boolean {
    return this.battles.delete(
      battleId
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Global Instance                                                            */
/* -------------------------------------------------------------------------- */

declare global {
  var __DHOTI_STORE__:
    | GlobalContentStore
    | undefined;
}

export const contentStore =
  globalThis.__DHOTI_STORE__ ??
  new GlobalContentStore();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__DHOTI_STORE__ =
    contentStore;
}