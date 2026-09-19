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
/* Initial News                                                               */
/* -------------------------------------------------------------------------- */

const initialNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Dhoti aale Annual Village Fest & Cultural Mela Announced',
    category: 'Culture & Festival',
    excerpt:
      'Gramin sabha has finalized the dates for the grand rural festival with wrestling, kabaddi, and folk music competitions.',
    content:
      'The 2026 Dhoti aale Cultural Fest will span three days featuring traditional games, agricultural tech stalls, and an evening desi rap show. Registration for local youth competitions is now live.',
    imageUrl:
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
    author: 'Dhoti Editorial Desk',
    published: true,
    createdAt: now() - days(2),
    views: 420,
  },
  {
    id: 'news-2',
    title: 'Rural Youth Solar Initiative Powered by Local Farmers',
    category: 'Development & Tech',
    excerpt:
      'New cooperative solar pump installations set to power over 200 acres of agricultural land across the region.',
    content:
      'A community-led cooperative has successfully brought clean solar energy to irrigate fields, cutting diesel costs by 70%. Dhoti aale youth pioneers are actively driving tech adoption.',
    imageUrl:
      'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop&q=80',
    author: 'Community News Desk',
    published: true,
    createdAt: now() - days(5),
    views: 650,
  },
];

/* -------------------------------------------------------------------------- */
/* Initial People                                                             */
/* -------------------------------------------------------------------------- */

const initialPeople: PersonProfile[] = [
  {
    id: 'person-1',
    name: 'Kailash Ji Dhakad',
    designation: 'Village Elder & Community Guide',
    bio:
      'Pioneering community welfare for rural areas, cultural heritage preservation, and inspiring local youth.',
    photoUrl:
      'https://api.dicebear.com/7.x/bottts/svg?seed=elder-dhoti',
    achievements:
      'Lifetime community service, village welfare promoter & patron of folk arts.',
    category: 'Leadership 👑',
    published: true,
    createdAt: now() - days(30),
  },
  {
    id: 'person-2',
    name: 'Suresh Choudhary',
    designation: 'Folk Culture & Youth Mentor',
    bio:
      'Championing rural rap, grassroots sports, and desi culture storytelling across regional stages.',
    photoUrl:
      'https://api.dicebear.com/7.x/bottts/svg?seed=suresh-dhoti',
    achievements:
      'National level kabaddi player and traditional music promoter.',
    category: 'Culture & Arts 🎨',
    published: true,
    createdAt: now() - days(30),
  },
  {
    id: 'person-3',
    name: 'Pooja Choudhary',
    designation: 'State Wrestling Gold Medalist',
    bio:
      'Inspiring young village athletes and leading girls sports mentorship camps across five districts.',
    photoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    achievements:
      '2x State Champion, National Freestyle silver medalist.',
    category: 'Sports ⚔️',
    published: true,
    createdAt: now() - days(15),
  },
];

/* -------------------------------------------------------------------------- */
/* Initial Business                                                           */
/* -------------------------------------------------------------------------- */

const initialBusiness: BusinessItem[] = [
  {
    id: 'biz-1',
    name: 'Kisan Organic Dairy & Desi Ghee Farm',
    category: 'Dairy & Agriculture',
    phone: '+91 98765 43210',
    address: 'Main Canal Road, Dhoti Nagar',
    description:
      'Pure A2 Gir cow milk, bilona ghee, and fresh organic paneer delivered daily.',
    logoUrl:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500&auto=format&fit=crop&q=80',
    verified: true,
    published: true,
    createdAt: now() - days(10),
  },
  {
    id: 'biz-2',
    name: 'Shree Balaji Agro & Tractor Spares',
    category: 'Machinery & Hardware',
    phone: '+91 98123 45678',
    address: 'Kisan Market, Shop No. 12',
    description:
      'Genuine spare parts, tractor accessories, solar inverter setups, and harvester rentals.',
    logoUrl:
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
    verified: true,
    published: true,
    createdAt: now() - days(20),
  },
];

/* -------------------------------------------------------------------------- */
/* Initial Gallery                                                            */
/* -------------------------------------------------------------------------- */

const initialGallery: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Morning Fog in Golden Mustard Fields',
    category: 'Village Landscapes',
    imageUrl:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    caption: 'Serene winters in Haryana and Punjab heartland.',
    published: true,
    createdAt: now() - days(4),
  },
  {
    id: 'gal-2',
    title: 'Kisan Mela Tractor Pride',
    category: 'Community Events',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    caption:
      'Modified machinery and farmer enthusiasm at the annual fair.',
    published: true,
    createdAt: now() - days(7),
  },
  {
    id: 'gal-3',
    title: 'Desi Akhada Practice Session',
    category: 'Sports & Swag',
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    caption:
      'Morning soil wrestling drills with village youngsters.',
    published: true,
    createdAt: now() - days(9),
  },
];

/* -------------------------------------------------------------------------- */
/* Initial Videos                                                             */
/* -------------------------------------------------------------------------- */

const initialVideos: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Dhoti aale Village Rap Cypher 2026',
    category: 'Rap & Music',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    description:
      'Local talents dropping verses in pure desi flow with dholak beats.',
    published: true,
    createdAt: now() - days(3),
    views: 1240,
  },
  {
    id: 'vid-2',
    title: 'Documentary: The Heritage of Desi Dhoti & Pagri',
    category: 'Cultural Heritage',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    description:
      'A deep dive into our ancestors traditions, fabric craftsmanship, and pride.',
    published: true,
    createdAt: now() - days(12),
    views: 2890,
  },
];

/* -------------------------------------------------------------------------- */
/* Initial Community Updates                                                  */
/* -------------------------------------------------------------------------- */

const initialUpdates: CommunityUpdate[] = [
  {
    id: 'upd-1',
    title:
      'Official Battle: Chole Bhature vs Cheesy Pizza Voting Is Live!',
    summary:
      'Cast your official vote in the community food clash. One vote per verified Google user.',
    tag: 'Battle Arena',
    badgeColor: 'amber',
    published: true,
    date: 'Today',
    linkUrl: '#battle',
    createdAt: now() - hours(2),
  },
  {
    id: 'upd-2',
    title: 'Dhoti aale AI Voice Assistant Upgrade Released',
    summary:
      'Experience faster voice turnaround and bilingual Hindi-English dialect conversation.',
    tag: 'System Update',
    badgeColor: 'sky',
    published: true,
    date: 'Yesterday',
    linkUrl: '#assistant',
    createdAt: now() - days(1),
  },
  {
    id: 'upd-3',
    title:
      'DHOTI AALE Launches Full Community Content Admin System',
    summary:
      'Direct management of battles, news, village businesses, and world chat moderation is now operational.',
    tag: 'Community',
    badgeColor: 'emerald',
    published: true,
    date: '2 Days Ago',
    linkUrl: '#home',
    createdAt: now() - days(2),
  },
];

/* -------------------------------------------------------------------------- */
/* Battle Helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Creates a safe battle state.
 *
 * Battle images are normal URLs here.
 * Actual image upload/storage should be handled by the admin API +
 * Supabase Storage/R2 and then saved as imageUrl.
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
 *
 * Returns:
 * - option A id
 * - option B id
 * - null when tied
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
 *
 * IMPORTANT:
 * It does NOT delete the battle.
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
/* Initial Battles                                                            */
/* -------------------------------------------------------------------------- */

const initialBattles: BattleEventStore[] = [
  createBattle({
    id: 'battle-1',
    title: 'Desi Food Clash: Chole Bhature vs Pizza',
    category: 'Desi Food 👑',
    description:
      'Desi street food king ya Italian cheese feast? Kaun jitega Dhoti aale crown?',
    optionA: {
      id: 'chole',
      label: 'Chole Bhature',
      tagline: 'Desi Makkhan & Pyaaz Swag',
      votes: 342,
      emoji: '🍛',
      imageUrl:
        'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'pizza',
      label: 'Cheesy Pizza',
      tagline: 'Extra Cheese & Crust Feast',
      votes: 219,
      emoji: '🍕',
      imageUrl:
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
    },

    isEnded: false,

    startsAt: now() - hours(24),

    endsAt: now() + days(3),

    durationMs: days(4),

    published: true,
    status: 'active',

    winnerOptionId: null,

    votedUserEmails: new Set<string>(),
    userVotes: new Map<string, string>(),
  }),

  createBattle({
    id: 'battle-2',
    title:
      'Village Swag vs City Hustle: Desi Rap Battle',
    category: 'Rap & Beats 🎤',
    description:
      'Haryanvi & desi folk flow vs Urban club trap rhyme clash!',
    optionA: {
      id: 'village',
      label: 'Village Desi Flow',
      tagline: 'Systumm Hang & Haryanvi Rhyme',
      votes: 512,
      emoji: '🚜',
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'city',
      label: 'City Metro Trap',
      tagline: 'Fast Delivery & Modern Beats',
      votes: 388,
      emoji: '🏙️',
      imageUrl:
        'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    },

    isEnded: false,

    startsAt: now() - hours(48),

    endsAt: now() + days(2),

    durationMs: days(4),

    published: true,
    status: 'active',

    winnerOptionId: null,

    votedUserEmails: new Set<string>(),
    userVotes: new Map<string, string>(),
  }),

  createBattle({
    id: 'battle-3',
    title:
      'Bullet 350 vs Thar 4x4: The Ultimate Ride',
    category: 'Swag & Rides ⚔️',
    description:
      'Voting has concluded! Winner declared by community majority.',
    optionA: {
      id: 'bullet',
      label: 'Royal Enfield Dug-Dug',
      tagline:
        'Classic Heartbeat of Punjab & Haryana',
      votes: 780,
      emoji: '🏍️',
      imageUrl:
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'thar',
      label: 'Mahindra Thar 4x4',
      tagline: 'Off-Road Monster King',
      votes: 695,
      emoji: '🚙',
      imageUrl:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80',
    },

    isEnded: true,

    startsAt: now() - hours(96),

    endsAt: now() - hours(4),

    durationMs: days(4),

    published: true,
    status: 'closed',

    winnerOptionId: 'bullet',

    votedUserEmails: new Set<string>([
      'sample.user@gmail.com',
    ]),

    userVotes: new Map<string, string>([
      ['sample.user@gmail.com', 'bullet'],
    ]),
  }),
];

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
/* Initial Chat                                                               */
/* -------------------------------------------------------------------------- */

const initialChatMessages: ChatMessage[] = [];

/* -------------------------------------------------------------------------- */
/* Global Store                                                               */
/* -------------------------------------------------------------------------- */

class GlobalContentStore {
  /**
   * Content collections.
   *
   * Supabase is the production source of truth.
   * These maps are kept for compatibility with existing server code.
   */
  news: Map<string, NewsItem> = new Map(
    initialNews.map((item) => [item.id, item])
  );

  people: Map<string, PersonProfile> = new Map(
    initialPeople.map((item) => [item.id, item])
  );

  business: Map<string, BusinessItem> = new Map(
    initialBusiness.map((item) => [item.id, item])
  );

  gallery: Map<string, GalleryItem> = new Map(
    initialGallery.map((item) => [item.id, item])
  );

  videos: Map<string, VideoItem> = new Map(
    initialVideos.map((item) => [item.id, item])
  );

  updates: Map<string, CommunityUpdate> = new Map(
    initialUpdates.map((item) => [item.id, item])
  );

  /**
   * Battles.
   *
   * IMPORTANT:
   * Expired battles remain in this map.
   * They are only removed when an admin explicitly deletes them.
   */
  battles: Map<string, BattleEventStore> = new Map(
    initialBattles.map((battle) => [
      battle.id,
      battle,
    ])
  );

  settings: SiteSettings = {
    ...initialSettings,
  };

  /**
   * Legacy/runtime chat cache.
   *
   * Production chat is handled through Supabase.
   * World Chat messages expire after 10 minutes.
   */
  chatMessages: ChatMessage[] = [
    ...initialChatMessages,
  ];

  /**
   * Admin-verified users.
   *
   * This should NOT be treated as an authentication source.
   * Real authorization must use Supabase Auth + server-side checks.
   */
  verifiedUsers: Set<string> = new Set([
    'rohitdhakaddhoti143@gmail.com',
    'dhoti_aale_ai_official',
  ]);

  /**
   * Runtime presence cache.
   *
   * Production realtime presence should use Supabase Realtime Presence.
   * This map is only retained for compatibility with older code.
   */
  activePresence: Map<
    string,
    PresenceUser
  > = new Map();

  /**
   * AI participant control.
   *
   * This is runtime-only control state.
   * It is NOT authentication and does not contain private user data.
   */
  aiControlState = {
    paused: false,
    pausedAt: 0,
    lastRepliedAt: 0,
    lastRepliedMsgId: '',
  };

  /**
   * Remove expired in-memory chat messages.
   *
   * Production cleanup must also happen in Supabase using
   * scheduled cleanup/cron because server memory is not persistent.
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
   *
   * Authentication must already have happened in the API route.
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
   *
   * This never deletes expired battles.
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
   *
   * The battle remains stored.
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
   *
   * Does not delete anything.
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
   *
   * IMPORTANT:
   * Production vote API must independently verify the authenticated
   * Supabase user and enforce uniqueness in the database.
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
   *
   * Timer expiry must NEVER call this automatically.
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
  // eslint-disable-next-line no-var
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