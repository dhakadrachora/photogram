'use client';

import React, { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { User, AppTab } from '@/types';
import { LandingPage } from '@/components/LandingPage';
import { VoiceAssistant } from '@/components/VoiceAssistant';
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
  const [selectedOpponent, setSelectedOpponent] = useState<string | undefined>(undefined);
  const [onlineCount, setOnlineCount] = useState(48);
  const isMounted = useIsMounted();

  const rawUserStr = useSyncExternalStore(subscribeUser, getUserSnapshot, getServerUserSnapshot);

  const currentUser = useMemo<User | null>(() => {
    if (!isMounted || !rawUserStr) return null;
    try {
      return JSON.parse(rawUserStr);
    } catch {
      return null;
    }
  }, [isMounted, rawUserStr]);

  const isAdmin = isSiteAdmin(currentUser?.email);

  useEffect(() => {
    // Dynamic online count jitter for realistic community activity
    const interval = setInterval(() => {
      setOnlineCount((prev) => Math.min(65, Math.max(35, prev + Math.floor(Math.random() * 3) - 1)));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem('dhoti_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save user to storage', e);
    }
    notifyUserListeners();
  };

  // Sync Supabase Auth session with application user state
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const syncUserWithProfile = async (sbUser: any) => {
      let appUser = mapSupabaseUserToAppUser(sbUser);
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', sbUser.id)
          .maybeSingle();

        if (dbUser) {
          appUser = {
            ...appUser,
            name: dbUser.name || appUser.name,
            avatar: dbUser.avatar || appUser.avatar,
            phone: dbUser.phone || appUser.phone,
            badge: dbUser.badge || appUser.badge,
            coins: dbUser.coins ?? appUser.coins,
            wins: dbUser.wins ?? appUser.wins,
            battles: dbUser.battles ?? appUser.battles,
            rank: dbUser.rank || appUser.rank,
            role: dbUser.role || appUser.role,
            isAdmin: Boolean(dbUser.is_admin) || isSiteAdmin(appUser.email),
            createdAt: dbUser.created_at || appUser.createdAt,
          };
        }
      } catch (err) {
        console.warn('Could not enrich user profile from Supabase:', err);
      }
      handleLoginSuccess(appUser);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void syncUserWithProfile(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void syncUserWithProfile(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleUpdateUser = (updater: ((prev: User) => User) | Partial<User>) => {
    if (!currentUser) return;
    const updated =
      typeof updater === 'function' ? updater(currentUser) : { ...currentUser, ...updater };
    try {
      localStorage.setItem('dhoti_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save user update to storage', e);
    }
    notifyUserListeners();
  };

  const handleLogout = async () => {
    await signOutSupabase();
    try {
      localStorage.removeItem('dhoti_user');
      localStorage.removeItem('phone_google_user');
    } catch (e) {
      console.warn('Could not remove user from storage', e);
    }
    notifyUserListeners();
    setActiveTab('home');
  };

  const handleStartBattleInvite = (opponentName: string) => {
    setSelectedOpponent(opponentName);
    setActiveTab('battle');
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-800 flex flex-col antialiased selection:bg-amber-200">
      {/* Navigation Sub-Bar when inside another section */}
      {activeTab !== 'home' && (
        <div className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 px-4 py-2.5 flex items-center justify-between text-white shadow-sm w-full">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-[#C25E29]" />
            <span>गाँव होम (Home)</span>
          </button>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            {activeTab === 'worldchat'
              ? 'गाँव चौपाल'
              : activeTab === 'battle'
              ? 'मुकाबला (Battle)'
              : activeTab === 'assistant'
              ? 'AI Assistant'
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
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[11px] font-bold text-blue-400 hover:underline"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col pb-16">
        {activeTab === 'home' && (
          <LandingPage
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'assistant' && (
          <VoiceAssistant
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'worldchat' && (
          <WorldChat
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onStartBattleInvite={handleStartBattleInvite}
          />
        )}

        {activeTab === 'battle' && (
          <BattleArena
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            selectedOpponent={selectedOpponent}
            onUpdateUser={handleUpdateUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onNavigateTab={setActiveTab}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* BEGIN: BottomNavigation (Edge-to-edge full width with centered items) */}
      <nav
        className="fixed bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 shadow-lg"
        data-purpose="mobile-bottom-nav"
      >
        <div className="max-w-xl mx-auto px-6 py-2 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home'
                ? 'text-[#2D7D46] font-medium'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'home') {
                const el = document.getElementById('features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setActiveTab('home');
              }
            }}
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Compass className="h-5 w-5" />
            <span className="text-[10px]">Explore</span>
          </button>

          <button
            onClick={() => setActiveTab('worldchat')}
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'worldchat'
                ? 'text-[#2D7D46] font-medium'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px]">Chaupal</span>
            <span className="absolute top-0 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

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
            <span className="text-[10px]">{currentUser ? 'Profile' : 'Profile'}</span>
          </button>

          {/* Admin Tab (Only for Admin) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'admin'
                  ? 'text-amber-600 font-bold'
                  : 'text-amber-500/70 hover:text-amber-600'
              }`}
            >
              <Crown className="h-5 w-5" />
              <span className="text-[10px]">Admin 👑</span>
            </button>
          )}
        </div>
      </nav>
      {/* END: BottomNavigation */}

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* PWA Install Prompt & Live Update Alerts */}
      <PWAInstallBanner />
    </div>
  );
}
