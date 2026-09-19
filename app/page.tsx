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
} from 'lucide-react';

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
    userListeners = userListeners.filter((l) => l !== callback);

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
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem('dhoti_user');
  } catch {
    return null;
  }
}

function getServerUserSnapshot(): string | null {
  return null;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedOpponent, setSelectedOpponent] = useState<
    string | undefined
  >(undefined);

  const isMounted = useIsMounted();

  const rawUserStr = useSyncExternalStore(
    subscribeUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const currentUser = useMemo<User | null>(() => {
    if (!isMounted || !rawUserStr) return null;

    try {
      return JSON.parse(rawUserStr);
    } catch {
      return null;
    }
  }, [isMounted, rawUserStr]);

  const isAdmin = isSiteAdmin(currentUser?.email);

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem('dhoti_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user to storage', e);
    }

    notifyUserListeners();
  };

  /*
   * Sync Supabase Auth session with application user state.
   */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    const syncUserWithProfile = async (sbUser: any) => {
      if (cancelled || !sbUser) return;

      let appUser = mapSupabaseUserToAppUser(sbUser);

      try {
        const { data: dbUser, error } = await supabase
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

            name: dbUser.name || appUser.name,

            avatar:
              dbUser.avatar ||
              dbUser.avatar_url ||
              appUser.avatar,

            phone: dbUser.phone || appUser.phone,

            badge: dbUser.badge || appUser.badge,

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
      } catch (err) {
        console.warn(
          'Could not enrich user profile from Supabase:',
          err
        );
      }

      if (!cancelled) {
        handleLoginSuccess(appUser);
      }
    };

    void supabase.auth.getSession().then(
      ({ data: { session } }) => {
        if (cancelled) return;

        if (session?.user) {
          void syncUserWithProfile(session.user);
        }
      }
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;

        if (session?.user) {
          void syncUserWithProfile(session.user);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const handleUpdateUser = (
    updater: ((prev: User) => User) | Partial<User>
  ) => {
    if (!currentUser) return;

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
    } catch (e) {
      console.warn(
        'Could not save user update to storage',
        e
      );
    }

    notifyUserListeners();
  };

  const handleLogout = async () => {
    await signOutSupabase();

    try {
      localStorage.removeItem('dhoti_user');
      localStorage.removeItem('phone_google_user');
    } catch (e) {
      console.warn(
        'Could not remove user from storage',
        e
      );
    }

    notifyUserListeners();

    setActiveTab('home');
    setSelectedOpponent(undefined);
  };

  const handleStartBattleInvite = (
    opponentName: string
  ) => {
    setSelectedOpponent(opponentName);
    setActiveTab('battle');
  };

  /*
   * ============================================================
   * AI VOICE ASSISTANT — TEMPORARILY LOCKED
   * ============================================================
   *
   * VoiceAssistant intentionally isn't rendered here.
   * If user opens Assistant from LandingPage, only the locked
   * premium screen will be shown.
   *
   * Later:
   * const AI_VOICE_LOCKED = false;
   *
   * and VoiceAssistant can be connected again.
   */

  const AI_VOICE_LOCKED = true;

  const openVoiceLockedScreen = () => {
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-800 flex flex-col antialiased selection:bg-amber-200">

      {/* Navigation Sub-Bar */}
      {activeTab !== 'home' && (
        <div className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between text-white shadow-sm w-full">

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-[#C25E29]" />

            <span>
              गाँव होम (Home)
            </span>
          </button>

          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
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
              <span className="text-[11px] text-stone-300 font-medium truncate max-w-[100px]">
                {currentUser.name}
              </span>
            ) : (
              <button
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

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col pb-16">

        {/* HOME / LANDING PAGE */}
        {activeTab === 'home' && (
          <LandingPage
            currentUser={currentUser}
            onNavigateTab={(tab) => {
              /*
               * AI Voice ko landing page se bhi locked
               * rakha gaya hai.
               */
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
        )}

        {/* ======================================================
            AI VOICE — LOCKED
            ====================================================== */}
        {activeTab === 'assistant' &&
          AI_VOICE_LOCKED && (
            <div className="min-h-[75vh] w-full flex items-center justify-center px-4 py-12">

              <div className="w-full max-w-md">

                <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">

                  {/* Background decoration */}
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-100/70 blur-2xl" />

                  <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-orange-100/70 blur-2xl" />

                  <div className="relative">

                    {/* Lock Icon */}
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                      <LockKeyhole className="h-9 w-9 text-amber-600" />
                    </div>

                    {/* Premium Label */}
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">

                      <Sparkles className="h-3.5 w-3.5" />

                      Premium Feature
                    </div>

                    <h1 className="text-2xl font-extrabold text-stone-900">
                      AI Voice Assistant
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      AI Voice Assistant is currently
                      locked. Upgrade your plan to
                      unlock voice features.
                    </p>

                    {/* Upgrade */}
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

                    {/* Back */}
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
                      Voice access will be available
                      after upgrading.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          )}

        {/* WORLD CHAT */}
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

        {/* BATTLE */}
        {activeTab === 'battle' && (
          <BattleArena
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            selectedOpponent={selectedOpponent}
            onUpdateUser={handleUpdateUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            onLogout={handleLogout}
            onNavigateTab={setActiveTab}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {/* ADMIN */}
        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() =>
              setIsAuthModalOpen(true)
            }
            onNavigateTab={setActiveTab}
          />
        )}

      </main>

      {/* ======================================================
          BOTTOM NAVIGATION
          ====================================================== */}
      <nav
        className="fixed bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 shadow-lg"
        data-purpose="mobile-bottom-nav"
      >
        <div className="max-w-xl mx-auto px-6 py-2 flex items-center justify-between">

          {/* HOME */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home'
                ? 'text-[#2D7D46] font-medium'
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
            onClick={() => {
              if (activeTab === 'home') {
                const el =
                  document.getElementById(
                    'features-section'
                  );

                if (el) {
                  el.scrollIntoView({
                    behavior: 'smooth',
                  });
                }
              } else {
                setActiveTab('home');
              }
            }}
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Compass className="h-5 w-5" />

            <span className="text-[10px]">
              Explore
            </span>
          </button>

          {/* WORLD CHAT */}
          <button
            onClick={() =>
              setActiveTab('worldchat')
            }
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'worldchat'
                ? 'text-[#2D7D46] font-medium'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />

            <span className="text-[10px]">
              Chaupal
            </span>

            <span className="absolute top-0 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* PROFILE */}
          <button
            onClick={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setActiveTab('profile');
              }
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'profile'
                ? 'text-[#2D7D46] font-medium'
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
              onClick={() =>
                setActiveTab('admin')
              }
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'admin'
                  ? 'text-amber-600 font-bold'
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

      {/* GOOGLE AUTH MODAL */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() =>
          setIsAuthModalOpen(false)
        }
        onLoginSuccess={handleLoginSuccess}
      />

      {/* PWA INSTALL PROMPT */}
      <PWAInstallBanner />

    </div>
  );
}