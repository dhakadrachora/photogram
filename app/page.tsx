'use client';

import React, {
  useState,
  useEffect,
  useSyncExternalStore,
  useMemo,
} from 'react';

import { User, AppTab } from '@/types';
import { LandingPage } from '@/components/LandingPage';
import { WorldChat } from '@/components/WorldChat';
import { BattleArena } from '@/components/BattleArena';
import { ProfileView } from '@/components/ProfileView';
import { AdminDashboard } from '@/components/AdminDashboard';
import GoogleAuthModal from '@/components/GoogleAuthModal';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

import { isSiteAdmin } from '@/lib/admin-auth';
import { useIsMounted } from '@/lib/useIsMounted';

import {
  supabase,
  isSupabaseConfigured,
  mapSupabaseUserToAppUser,
  signOutSupabase,
} from '@/lib/supabase';

import {
  Home as HomeIcon,
  Compass,
  MessageSquare,
  User as UserIcon,
  Crown,
  ArrowLeft,
  LockKeyhole,
  Sparkles,
  Gift,
  Instagram,
  Trophy,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';

/* ============================================================
   USER STORAGE SUBSCRIPTION
   ============================================================ */

let userListeners: Array<() => void> = [];

function subscribeUser(callback: () => void) {
  userListeners = [...userListeners, callback];

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'dhoti_user') {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    userListeners = userListeners.filter(
      (listener) => listener !== callback
    );

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function notifyUserListeners() {
  for (const listener of userListeners) {
    listener();
  }
}

function getUserSnapshot(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem('dhoti_user');
  } catch {
    return null;
  }
}

function getServerUserSnapshot(): string | null {
  return null;
}

/* ============================================================
   WINNER REWARDS TYPES
   ============================================================ */

interface WinnerOffer {
  id: string;
  title?: string | null;
  description?: string | null;

  winner_name: string;
  winner_photo: string;

  battle_votes: number;
  reward: string;

  instagram_username?: string | null;
  instagram_link?: string | null;

  published?: boolean;

  created_at?: string;
  updated_at?: string;
}

/* ============================================================
   REWARD HELPERS
   ============================================================ */

function getRewardForVotes(votes: number): string | null {
  if (votes >= 250) {
    return '1 Million Instagram Reels Views FREE';
  }

  if (votes >= 100) {
    return '100K Instagram Reels Views FREE';
  }

  if (votes >= 50) {
    return '10K Instagram Reels Views FREE';
  }

  return null;
}

function getRewardShortLabel(reward: string): string {
  const value = reward.toLowerCase();

  if (
    value.includes('1 million') ||
    value.includes('1m') ||
    value.includes('1000000')
  ) {
    return '1 MILLION VIEWS';
  }

  if (
    value.includes('100k') ||
    value.includes('100,000')
  ) {
    return '100K VIEWS';
  }

  if (
    value.includes('10k') ||
    value.includes('10,000')
  ) {
    return '10K VIEWS';
  }

  return reward;
}

/* ============================================================
   WINNER REWARDS SECTION
   ============================================================ */

function WinnerRewardsSection() {
  const [offers, setOffers] = useState<WinnerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOffers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch(
        '/api/winner-offers?published=true',
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setOffers([]);
          setError('');
          return;
        }

        throw new Error(
          `Winner offers request failed: ${response.status}`
        );
      }

      const data = await response.json();

      const incomingOffers =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.offers)
          ? data.offers
          : Array.isArray(data?.data)
          ? data.data
          : [];

      const publishedOffers = incomingOffers.filter(
        (offer: WinnerOffer) =>
          offer?.published !== false
      );

      setOffers(publishedOffers);
    } catch (err) {
      console.warn(
        'Could not load winner offers:',
        err
      );

      setOffers([]);

      setError(
        'Winner offers abhi available nahi hain.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOffers();
  }, []);

  return (
    <section
      id="winner-rewards"
      className="w-full bg-stone-50 px-4 py-12"
    >
      <div className="mx-auto w-full max-w-6xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
            <Gift className="h-7 w-7 text-amber-600" />
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
            <Trophy className="h-3.5 w-3.5" />
            Winner Rewards
          </div>

          <h2 className="text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
            Jeeto aur Reward Paao
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-stone-500 sm:text-base">
            DHOTI AALE battles me real votes ke basis par
            winners ko Instagram Reels Views FREE milenge.
          </p>

        </div>

        {/* REWARD RULES */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* 10K */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                50+ VOTES
              </span>

              <Gift className="h-5 w-5 text-green-600" />
            </div>

            <div className="mt-4 text-2xl font-black text-stone-900">
              10K
            </div>

            <p className="mt-1 text-sm font-bold text-stone-500">
              Instagram Reels Views FREE
            </p>
          </div>

          {/* 100K */}
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                100+ VOTES
              </span>

              <Gift className="h-5 w-5 text-blue-600" />
            </div>

            <div className="mt-4 text-2xl font-black text-stone-900">
              100K
            </div>

            <p className="mt-1 text-sm font-bold text-stone-500">
              Instagram Reels Views FREE
            </p>
          </div>

          {/* 1 MILLION */}
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                250+ VOTES
              </span>

              <Trophy className="h-5 w-5 text-amber-600" />
            </div>

            <div className="mt-4 text-2xl font-black text-stone-900">
              1 MILLION
            </div>

            <p className="mt-1 text-sm font-bold text-stone-500">
              Instagram Reels Views FREE
            </p>
          </div>

        </div>

        {/* LATEST OFFERS HEADER */}
        <div className="mt-12 flex items-center justify-between gap-4">

          <div>
            <h3 className="text-xl font-black text-stone-900">
              Latest Winner Offers
            </h3>

            <p className="mt-1 text-xs text-stone-500">
              Admin ke published winner rewards
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOffers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 shadow-sm transition hover:bg-stone-100 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-6 flex min-h-[180px] items-center justify-center rounded-2xl border border-stone-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-stone-400">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />

              <span className="text-sm font-semibold">
                Winner offers load ho rahe hain...
              </span>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center">
            <Gift className="mx-auto h-8 w-8 text-stone-300" />

            <p className="mt-3 text-sm font-semibold text-stone-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadOffers(true)}
              className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          offers.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                <Trophy className="h-7 w-7 text-stone-400" />
              </div>

              <h4 className="mt-4 text-lg font-black text-stone-800">
                Abhi koi Winner Offer nahi hai
              </h4>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                Battle complete hone ke baad Admin
                winner reward publish karega.
              </p>
            </div>
          )}

        {/* OFFERS */}
        {!loading &&
          !error &&
          offers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {offers.map((offer) => {

                const reward =
                  getRewardForVotes(
                    Number(offer.battle_votes || 0)
                  ) || offer.reward;

                const rewardLabel =
                  getRewardShortLabel(
                    reward || ''
                  );

                return (
                  <article
                    key={offer.id}
                    className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* IMAGE */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">

                      {offer.winner_photo ? (
                        <img
                          src={offer.winner_photo}
                          alt={offer.winner_name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserIcon className="h-16 w-16 text-stone-300" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-amber-700 shadow">
                        WINNER
                      </div>

                      <div className="absolute bottom-3 right-3 rounded-full bg-stone-900/90 px-3 py-1.5 text-[10px] font-black text-white shadow">
                        {offer.battle_votes} VOTES
                      </div>

                    </div>

                    {/* CONTENT */}
                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h4 className="truncate text-lg font-black text-stone-900">
                            {offer.winner_name}
                          </h4>

                          {offer.title && (
                            <p className="mt-1 text-sm font-bold text-stone-500">
                              {offer.title}
                            </p>
                          )}

                        </div>

                        <div className="shrink-0 rounded-xl bg-amber-100 px-2.5 py-1.5 text-center">
                          <Trophy className="mx-auto h-4 w-4 text-amber-600" />

                          <span className="mt-0.5 block text-[9px] font-black text-amber-700">
                            {rewardLabel}
                          </span>
                        </div>

                      </div>

                      <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">

                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-amber-600" />

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                              Reward
                            </p>

                            <p className="text-sm font-black text-stone-900">
                              {reward}
                            </p>
                          </div>
                        </div>

                      </div>

                      {offer.description && (
                        <p className="mt-4 text-sm leading-6 text-stone-500">
                          {offer.description}
                        </p>
                      )}

                      {offer.instagram_username && (
                        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-stone-600">
                          <Instagram className="h-4 w-4 text-pink-500" />

                          <span className="truncate">
                            @{offer.instagram_username.replace(/^@/, '')}
                          </span>
                        </div>
                      )}

                      {offer.instagram_link && (
                        <a
                          href={offer.instagram_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-stone-800"
                        >
                          <Instagram className="h-4 w-4" />

                          Instagram Profile
                        </a>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        {/* RULE NOTE */}
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex gap-3">

            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" />

            <div>
              <p className="text-sm font-black text-stone-800">
                Reward Rule
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Reward real battle votes ke according
                calculate hoga. 250+ votes par highest
                reward 1 Million Views hoga.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function Home() {
  const [activeTab, setActiveTab] =
    useState<AppTab>('home');

  const [isAuthModalOpen, setIsAuthModalOpen] =
    useState(false);

  const [selectedOpponent, setSelectedOpponent] =
    useState<string | undefined>(undefined);

  const isMounted = useIsMounted();

  const rawUserStr = useSyncExternalStore(
    subscribeUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const currentUser = useMemo<User | null>(() => {
    if (!isMounted || !rawUserStr) {
      return null;
    }

    try {
      return JSON.parse(rawUserStr);
    } catch {
      return null;
    }
  }, [isMounted, rawUserStr]);

  const isAdmin = isSiteAdmin(
    currentUser?.email
  );

  /* ==========================================================
     LOGIN SUCCESS
     ========================================================== */

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem(
        'dhoti_user',
        JSON.stringify(user)
      );
    } catch (error) {
      console.warn(
        'Could not save user to storage:',
        error
      );
    }

    notifyUserListeners();
  };

  /* ==========================================================
     SUPABASE AUTH SESSION SYNC
     ========================================================== */

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    const syncUserWithProfile = async (
      sbUser: any
    ) => {
      if (cancelled || !sbUser) {
        return;
      }

      let appUser =
        mapSupabaseUserToAppUser(sbUser);

      try {
        const {
          data: dbUser,
          error,
        } = await supabase
          .from('users')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (error) {
          console.warn(
            'Could not load Supabase user profile:',
            error.message
          );
        }

        if (dbUser) {
          appUser = {
            ...appUser,

            name:
              dbUser.name ||
              appUser.name,

            avatar:
              dbUser.avatar ||
              dbUser.avatar_url ||
              appUser.avatar,

            phone:
              dbUser.phone ||
              appUser.phone,

            badge:
              dbUser.badge ||
              appUser.badge,

            coins:
              dbUser.coins ??
              dbUser.dhoti_coins ??
              appUser.coins,

            dhotiCoins:
              dbUser.dhoti_coins ??
              dbUser.coins ??
              appUser.dhotiCoins,

            wins:
              dbUser.wins ??
              appUser.wins,

            battles:
              dbUser.battles ??
              appUser.battles,

            rank:
              dbUser.rank ||
              appUser.rank,

            role:
              dbUser.role ||
              appUser.role,

            isAdmin:
              Boolean(dbUser.is_admin) ||
              isSiteAdmin(appUser.email),

            isVerified:
              Boolean(dbUser.is_verified) ||
              Boolean(appUser.isVerified),

            isBlocked:
              Boolean(dbUser.is_blocked),

            blockedAt:
              dbUser.blocked_at ||
              undefined,

            blockedReason:
              dbUser.blocked_reason ||
              undefined,

            chatBlocked:
              Boolean(dbUser.chat_blocked),

            votingBlocked:
              Boolean(dbUser.voting_blocked),

            battleBlocked:
              Boolean(dbUser.battle_blocked),

            createdAt:
              dbUser.created_at ||
              appUser.createdAt,
          };
        }
      } catch (error) {
        console.warn(
          'Could not enrich user profile from Supabase:',
          error
        );
      }

      if (!cancelled) {
        handleLoginSuccess(appUser);
      }
    };

    void supabase.auth.getSession().then(
      ({
        data: { session },
      }) => {
        if (cancelled) {
          return;
        }

        if (session?.user) {
          void syncUserWithProfile(
            session.user
          );
        }
      }
    );

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (cancelled) {
            return;
          }

          if (session?.user) {
            void syncUserWithProfile(
              session.user
            );
          }
        }
      );

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  /* ==========================================================
     REAL ONLINE PRESENCE HEARTBEAT
     ========================================================== */

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    let cancelled = false;

    let heartbeatTimer:
      | ReturnType<typeof setInterval>
      | null = null;

    const sendPresenceHeartbeat =
      async () => {
        if (cancelled) {
          return;
        }

        try {
          const {
            data: { session },
          } =
            await supabase.auth.getSession();

          if (cancelled) {
            return;
          }

          if (
            !session?.access_token ||
            !session.user
          ) {
            return;
          }

          const response =
            await fetch('/api/presence', {
              method: 'POST',

              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                userName:
                  currentUser?.name ||
                  session.user.user_metadata
                    ?.name ||
                  session.user.user_metadata
                    ?.full_name ||
                  session.user.email?.split(
                    '@'
                  )[0] ||
                  'User',

                userAvatar:
                  currentUser?.avatar ||
                  session.user.user_metadata
                    ?.avatar_url ||
                  session.user.user_metadata
                    ?.picture ||
                  '',

                userBadge:
                  currentUser?.badge ||
                  '',

                isVerified:
                  Boolean(
                    currentUser?.isVerified
                  ),

                isAdmin:
                  Boolean(
                    currentUser?.isAdmin
                  ) ||
                  isSiteAdmin(
                    session.user.email
                  ),
              }),
            });

          if (!response.ok) {
            const text =
              await response
                .text()
                .catch(() => '');

            console.warn(
              'Presence heartbeat failed:',
              response.status,
              text
            );
          }
        } catch (error) {
          console.warn(
            'Could not send presence heartbeat:',
            error
          );
        }
      };

    if (currentUser) {
      void sendPresenceHeartbeat();

      heartbeatTimer =
        setInterval(() => {
          void sendPresenceHeartbeat();
        }, 15_000);
    }

    return () => {
      cancelled = true;

      if (heartbeatTimer) {
        clearInterval(
          heartbeatTimer
        );

        heartbeatTimer = null;
      }
    };
  }, [currentUser]);

  /* ==========================================================
     USER UPDATE
     ========================================================== */

  const handleUpdateUser = (
    updater:
      | ((prev: User) => User)
      | Partial<User>
  ) => {
    if (!currentUser) {
      return;
    }

    const updated =
      typeof updater === 'function'
        ? updater(currentUser)
        : {
            ...currentUser,
            ...updater,
          };

    try {
      localStorage.setItem(
        'dhoti_user',
        JSON.stringify(updated)
      );
    } catch (error) {
      console.warn(
        'Could not save user update:',
        error
      );
    }

    notifyUserListeners();
  };

  /* ==========================================================
     LOGOUT
     ========================================================== */

  const handleLogout = async () => {
    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const response =
            await fetch('/api/presence', {
              method: 'DELETE',

              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

          if (!response.ok) {
            console.warn(
              'Could not remove user presence:',
              response.status
            );
          }
        } catch (presenceError) {
          console.warn(
            'Presence logout cleanup failed:',
            presenceError
          );
        }
      }
    } catch (error) {
      console.warn(
        'Could not get session before logout:',
        error
      );
    }

    await signOutSupabase();

    try {
      localStorage.removeItem(
        'dhoti_user'
      );

      localStorage.removeItem(
        'phone_google_user'
      );
    } catch (error) {
      console.warn(
        'Could not remove user from storage:',
        error
      );
    }

    notifyUserListeners();

    setActiveTab('home');
    setSelectedOpponent(undefined);
  };

  /* ==========================================================
     BATTLE INVITE
     ========================================================== */

  const handleStartBattleInvite = (
    opponentName: string
  ) => {
    setSelectedOpponent(
      opponentName
    );

    setActiveTab('battle');
  };

  /* ==========================================================
     AI VOICE ASSISTANT — TEMPORARILY LOCKED
     ========================================================== */

  const AI_VOICE_LOCKED = true;

  const openVoiceLockedScreen =
    () => {
      setActiveTab('assistant');
    };

  /* ==========================================================
     MAIN RETURN
     ========================================================== */

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-800 flex flex-col antialiased selection:bg-amber-200">

      {/* ======================================================
          TOP SUB NAV
          ====================================================== */}

      {activeTab !== 'home' && (
        <div className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-2.5 text-white shadow-sm">

          <button
            type="button"
            onClick={() =>
              setActiveTab('home')
            }
            className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-[#C25E29]" />

            <span>
              गाँव होम (Home)
            </span>
          </button>

          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">

            {activeTab === 'worldchat'
              ? 'गाँव चौपाल'
              : activeTab === 'battle'
              ? 'मुकाबला (Battle)'
              : activeTab === 'assistant'
              ? 'AI Assistant 🔒'
              : activeTab === 'profile'
              ? 'Profile'
              : 'Admin Panel 👑'}

          </span>

          <div className="flex items-center gap-2">

            {currentUser ? (
              <span className="max-w-[100px] truncate text-[11px] font-medium text-stone-300">
                {currentUser.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setIsAuthModalOpen(true)
                }
                className="text-[11px] font-bold text-blue-400 hover:underline"
              >
                Login
              </button>
            )}

          </div>
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="flex w-full flex-1 flex-col pb-16">

        {/* ====================================================
            HOME / LANDING
            ==================================================== */}

        {activeTab === 'home' && (
          <>
            <LandingPage
              currentUser={currentUser}
              onNavigateTab={(tab) => {
                if (
                  tab === 'assistant' &&
                  AI_VOICE_LOCKED
                ) {
                  openVoiceLockedScreen();
                  return;
                }

                setActiveTab(tab);
              }}
              onOpenAuth={() =>
                setIsAuthModalOpen(true)
              }
            />

            {/* WINNER REWARDS ON LANDING PAGE */}
            <WinnerRewardsSection />
          </>
        )}

        {/* ====================================================
            AI VOICE — LOCKED
            ==================================================== */}

        {activeTab === 'assistant' &&
          AI_VOICE_LOCKED && (
            <div className="flex min-h-[75vh] w-full items-center justify-center px-4 py-12">

              <div className="w-full max-w-md">

                <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">

                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-100/70 blur-2xl" />

                  <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-orange-100/70 blur-2xl" />

                  <div className="relative">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                      <LockKeyhole className="h-9 w-9 text-amber-600" />
                    </div>

                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Premium Feature
                    </div>

                    <h1 className="text-2xl font-extrabold text-stone-900">
                      AI Voice Assistant
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      AI Voice Assistant is
                      currently locked. Upgrade
                      your plan to unlock voice
                      features.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        // Upgrade/payment system later.
                      }}
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-stone-800 active:scale-[0.99]"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />

                      Upgrade Now

                      <LockKeyhole className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab('home')
                      }
                      className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-50"
                    >
                      Back to Home
                    </button>

                    <p className="mt-5 text-[11px] text-stone-400">
                      Voice access will be
                      available after upgrading.
                    </p>

                  </div>
                </div>

              </div>
            </div>
          )}

        {/* ====================================================
            WORLD CHAT
            ==================================================== */}

        {activeTab === 'worldchat' && (
          <WorldChat
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            onStartBattleInvite={
              handleStartBattleInvite
            }
          />
        )}

        {/* ====================================================
            BATTLE
            ==================================================== */}

        {activeTab === 'battle' && (
          <BattleArena
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            selectedOpponent={
              selectedOpponent
            }
            onUpdateUser={
              handleUpdateUser
            }
            onNavigateTab={
              setActiveTab
            }
          />
        )}

        {/* ====================================================
            PROFILE
            ==================================================== */}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            onLogout={handleLogout}
            onNavigateTab={
              setActiveTab
            }
            onUpdateUser={
              handleUpdateUser
            }
          />
        )}

        {/* ====================================================
            ADMIN
            ==================================================== */}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            onNavigateTab={
              setActiveTab
            }
          />
        )}

      </main>

      {/* ======================================================
          BOTTOM NAVIGATION
          ====================================================== */}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 w-full border-t border-stone-200 bg-white/95 shadow-lg backdrop-blur-md"
        data-purpose="mobile-bottom-nav"
      >
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-2">

          {/* HOME */}
          <button
            type="button"
            onClick={() =>
              setActiveTab('home')
            }
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home'
                ? 'font-medium text-[#2D7D46]'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <HomeIcon className="h-5 w-5" />

            <span className="text-[10px]">
              Home
            </span>
          </button>

          {/* EXPLORE */}
          <button
            type="button"
            onClick={() => {
              if (
                activeTab === 'home'
              ) {
                const el =
                  document.getElementById(
                    'features-section'
                  );

                if (el) {
                  el.scrollIntoView({
                    behavior: 'smooth',
                  });
                } else {
                  const rewards =
                    document.getElementById(
                      'winner-rewards'
                    );

                  rewards?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }
              } else {
                setActiveTab('home');
              }
            }}
            className="flex flex-col items-center gap-1 text-stone-400 transition-colors hover:text-stone-700"
          >
            <Compass className="h-5 w-5" />

            <span className="text-[10px]">
              Explore
            </span>
          </button>

          {/* WORLD CHAT */}
          <button
            type="button"
            onClick={() =>
              setActiveTab('worldchat')
            }
            className={`relative flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'worldchat'
                ? 'font-medium text-[#2D7D46]'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />

            <span className="text-[10px]">
              Chaupal
            </span>

            <span className="absolute right-1.5 top-0 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          </button>

          {/* REWARDS */}
          <button
            type="button"
            onClick={() => {
              if (
                activeTab !== 'home'
              ) {
                setActiveTab('home');

                setTimeout(() => {
                  document
                    .getElementById(
                      'winner-rewards'
                    )
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    });
                }, 100);
              } else {
                document
                  .getElementById(
                    'winner-rewards'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  });
              }
            }}
            className="flex flex-col items-center gap-1 text-amber-500 transition-colors hover:text-amber-700"
          >
            <Gift className="h-5 w-5" />

            <span className="text-[10px]">
              Rewards
            </span>
          </button>

          {/* PROFILE */}
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                setIsAuthModalOpen(
                  true
                );
              } else {
                setActiveTab(
                  'profile'
                );
              }
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'profile'
                ? 'font-medium text-[#2D7D46]'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <UserIcon className="h-5 w-5" />

            <span className="text-[10px]">
              Profile
            </span>
          </button>

          {/* ADMIN */}
          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  'admin'
                )
              }
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'admin'
                  ? 'font-bold text-amber-600'
                  : 'text-amber-500/70 hover:text-amber-600'
              }`}
            >
              <Crown className="h-5 w-5" />

              <span className="text-[10px]">
                Admin 👑
              </span>
            </button>
          )}

        </div>
      </nav>

      {/* ======================================================
          GOOGLE AUTH MODAL
          ====================================================== */}

      <GoogleAuthModal
        isOpen={
          isAuthModalOpen
        }
        onClose={() =>
          setIsAuthModalOpen(false)
        }
        onLoginSuccess={
          handleLoginSuccess
        }
      />

      {/* ======================================================
          PWA INSTALL
          ====================================================== */}

      <PWAInstallBanner />

    </div>
  );
}