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

export interface BattleEventStore extends BattleEvent {
  votedUserEmails: Set<string>;
  userVotes: Map<string, string>; // email -> optionId
}

// Initial Data Seed
const initialNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Dhoti aale Annual Village Fest & Cultural Mela Announced',
    category: 'Culture & Festival',
    excerpt: 'Gramin sabha has finalized the dates for the grand rural festival with wrestling, kabaddi, and folk music competitions.',
    content: 'The 2026 Dhoti aale Cultural Fest will span three days featuring traditional games, agricultural tech stalls, and an evening desi rap show. Registration for local youth competitions is now live.',
    imageUrl: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
    author: 'Dhoti Editorial Desk',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    views: 420,
  },
  {
    id: 'news-2',
    title: 'Rural Youth Solar Initiative Powered by Local Farmers',
    category: 'Development & Tech',
    excerpt: 'New cooperative solar pump installations set to power over 200 acres of agricultural land across the region.',
    content: 'A community-led cooperative has successfully brought clean solar energy to irrigate fields, cutting diesel costs by 70%. Dhoti aale youth pioneers are actively driving tech adoption.',
    imageUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&auto=format&fit=crop&q=80',
    author: 'Community News Desk',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    views: 650,
  },
];

const initialPeople: PersonProfile[] = [
  {
    id: 'person-1',
    name: 'Kailash Ji Dhakad',
    designation: 'Village Elder & Community Guide',
    bio: 'Pioneering community welfare for rural areas, cultural heritage preservation, and inspiring local youth.',
    photoUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=elder-dhoti',
    achievements: 'Lifetime community service, village welfare promoter & patron of folk arts.',
    category: 'Leadership 👑',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'person-2',
    name: 'Suresh Choudhary',
    designation: 'Folk Culture & Youth Mentor',
    bio: 'Championing rural rap, grassroots sports, and desi culture storytelling across regional stages.',
    photoUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=suresh-dhoti',
    achievements: 'National level kabaddi player and traditional music promoter.',
    category: 'Culture & Arts 🎨',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'person-3',
    name: 'Pooja Choudhary',
    designation: 'State Wrestling Gold Medalist',
    bio: 'Inspiring young village athletes and leading girls sports mentorship camps across five districts.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    achievements: '2x State Champion, National Freestyle silver medalist.',
    category: 'Sports ⚔️',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
  },
];

const initialBusiness: BusinessItem[] = [
  {
    id: 'biz-1',
    name: 'Kisan Organic Dairy & Desi Ghee Farm',
    category: 'Dairy & Agriculture',
    phone: '+91 98765 43210',
    address: 'Main Canal Road, Dhoti Nagar',
    description: 'Pure A2 Gir cow milk, bilona ghee, and fresh organic paneer delivered daily.',
    logoUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500&auto=format&fit=crop&q=80',
    verified: true,
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'biz-2',
    name: 'Shree Balaji Agro & Tractor Spares',
    category: 'Machinery & Hardware',
    phone: '+91 98123 45678',
    address: 'Kisan Market, Shop No. 12',
    description: 'Genuine spare parts, tractor accessories, solar inverter setups, and harvester rentals.',
    logoUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80',
    verified: true,
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
];

const initialGallery: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Morning Fog in Golden Mustard Fields',
    category: 'Village Landscapes',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    caption: 'Serene winters in Haryana and Punjab heartland.',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: 'gal-2',
    title: 'Kisan Mela Tractor Pride',
    category: 'Community Events',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    caption: 'Modified machinery and farmer enthusiasm at the annual fair.',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'gal-3',
    title: 'Desi Akhada Practice Session',
    category: 'Sports & Swag',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    caption: 'Morning soil wrestling drills with village youngsters.',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },
];

const initialVideos: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'Dhoti aale Village Rap Cypher 2026',
    category: 'Rap & Music',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    description: 'Local talents dropping verses in pure desi flow with dholak beats.',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    views: 1240,
  },
  {
    id: 'vid-2',
    title: 'Documentary: The Heritage of Desi Dhoti & Pagri',
    category: 'Cultural Heritage',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    description: 'A deep dive into our ancestors traditions, fabric craftsmanship, and pride.',
    published: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    views: 2890,
  },
];

const initialUpdates: CommunityUpdate[] = [
  {
    id: 'upd-1',
    title: 'Official Battle: Chole Bhature vs Cheesy Pizza Voting Is Live!',
    summary: 'Cast your official vote in the community food clash. One vote per verified Google user.',
    tag: 'Battle Arena',
    badgeColor: 'amber',
    published: true,
    date: 'Today',
    linkUrl: '#battle',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'upd-2',
    title: 'Dhoti aale AI Voice Assistant Upgrade Released',
    summary: 'Experience faster voice turnaround and bilingual Hindi-English dialect conversation.',
    tag: 'System Update',
    badgeColor: 'sky',
    published: true,
    date: 'Yesterday',
    linkUrl: '#assistant',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'upd-3',
    title: 'DHOTI AALE Launches Full Community Content Admin System',
    summary: 'Direct management of battles, news, village businesses, and world chat moderation is now operational.',
    tag: 'Community',
    badgeColor: 'emerald',
    published: true,
    date: '2 Days Ago',
    linkUrl: '#home',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
];

const initialBattles: BattleEventStore[] = [
  {
    id: 'battle-1',
    title: 'Desi Food Clash: Chole Bhature vs Pizza',
    category: 'Desi Food 👑',
    description: 'Desi street food king ya Italian cheese feast? Kaun jitega Dhoti aale crown?',
    optionA: {
      id: 'chole',
      label: 'Chole Bhature',
      tagline: 'Desi Makkhan & Pyaaz Swag',
      votes: 342,
      emoji: '🍛',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'pizza',
      label: 'Cheesy Pizza',
      tagline: 'Extra Cheese & Crust Feast',
      votes: 219,
      emoji: '🍕',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
    },
    isEnded: false,
    startsAt: Date.now() - 1000 * 60 * 60 * 24,
    endsAt: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3 days remaining
    published: true,
    status: 'active',
    votedUserEmails: new Set<string>(),
    userVotes: new Map<string, string>(),
  },
  {
    id: 'battle-2',
    title: 'Village Swag vs City Hustle: Desi Rap Battle',
    category: 'Rap & Beats 🎤',
    description: 'Haryanvi & desi folk flow vs Urban club trap rhyme clash!',
    optionA: {
      id: 'village',
      label: 'Village Desi Flow',
      tagline: 'Systumm Hang & Haryanvi Rhyme',
      votes: 512,
      emoji: '🚜',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'city',
      label: 'City Metro Trap',
      tagline: 'Fast Delivery & Modern Beats',
      votes: 388,
      emoji: '🏙️',
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    },
    isEnded: false,
    startsAt: Date.now() - 1000 * 60 * 60 * 48,
    endsAt: Date.now() + 1000 * 60 * 60 * 24 * 2, // 2 days remaining
    published: true,
    status: 'active',
    votedUserEmails: new Set<string>(),
    userVotes: new Map<string, string>(),
  },
  {
    id: 'battle-3',
    title: 'Bullet 350 vs Thar 4x4: The Ultimate Ride',
    category: 'Swag & Rides ⚔️',
    description: 'Voting has concluded! Winner declared by community majority.',
    optionA: {
      id: 'bullet',
      label: 'Royal Enfield Dug-Dug',
      tagline: 'Classic Heartbeat of Punjab & Haryana',
      votes: 780,
      emoji: '🏍️',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80',
    },
    optionB: {
      id: 'thar',
      label: 'Mahindra Thar 4x4',
      tagline: 'Off-Road Monster King',
      votes: 695,
      emoji: '🚙',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80',
    },
    isEnded: true,
    startsAt: Date.now() - 1000 * 60 * 60 * 96,
    endsAt: Date.now() - 1000 * 60 * 60 * 4,
    published: true,
    status: 'closed',
    winnerOptionId: 'bullet',
    votedUserEmails: new Set<string>(['sample.user@gmail.com']),
    userVotes: new Map<string, string>([['sample.user@gmail.com', 'bullet']]),
  },
];

const initialSettings: SiteSettings = {
  siteTitle: 'DHOTI AALE',
  siteTagline: 'Chat • Battle • AI Assistant',
  announcementBanner: 'Welcome to DHOTI AALE community! Join active battles, live chat, and voice AI.',
  isAnnouncementActive: true,
  allowWorldChat: true,
  allowGuestAi: true,
  heroBadge: 'Pure Desi Vibe • 100% Real Community 👑',
  contactEmail: 'rohitdhakaddhoti143@gmail.com',
};

const initialChatMessages: ChatMessage[] = [];

// In-Memory Global Server Store
class GlobalContentStore {
  news: Map<string, NewsItem> = new Map(initialNews.map((n) => [n.id, n]));
  people: Map<string, PersonProfile> = new Map(initialPeople.map((p) => [p.id, p]));
  business: Map<string, BusinessItem> = new Map(initialBusiness.map((b) => [b.id, b]));
  gallery: Map<string, GalleryItem> = new Map(initialGallery.map((g) => [g.id, g]));
  videos: Map<string, VideoItem> = new Map(initialVideos.map((v) => [v.id, v]));
  updates: Map<string, CommunityUpdate> = new Map(initialUpdates.map((u) => [u.id, u]));
  battles: Map<string, BattleEventStore> = new Map(initialBattles.map((b) => [b.id, b]));
  settings: SiteSettings = { ...initialSettings };
  chatMessages: ChatMessage[] = [...initialChatMessages];

  // Verified users set (user IDs or emails verified by admin)
  // Only admin rohitdhakaddhoti143@gmail.com can grant or revoke this
  verifiedUsers: Set<string> = new Set(['rohitdhakaddhoti143@gmail.com', 'dhoti_aale_ai_official']);

  // Real-time user presence tracking (keyed by unique userId)
  activePresence: Map<string, PresenceUser> = new Map();

  // Controlled AI Participant state
  aiControlState = {
    paused: false,
    pausedAt: 0,
    lastRepliedAt: 0,
    lastRepliedMsgId: '',
  };

  // Resilient fallback accounts to bypass Supabase Email Rate Limits
  fallbackAccounts: Map<string, {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
    avatar: string;
    badge: string;
    coins: number;
    wins: number;
    battles: number;
    rank: string;
    role: 'admin' | 'resident';
    isAdmin: boolean;
    createdAt: number;
  }> = new Map();
}

declare global {
  var __DHOTI_STORE__: GlobalContentStore | undefined;
}

export const contentStore = globalThis.__DHOTI_STORE__ || new GlobalContentStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__DHOTI_STORE__ = contentStore;
}
