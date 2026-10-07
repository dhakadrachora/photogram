'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import {
  supabase,
  isSupabaseConfigured,
  mapSupabaseUserToAppUser,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutSupabase,
} from '@/lib/supabase';
import { isSiteAdmin } from '@/lib/admin-auth';
import { GoogleAuthModal } from '@/components/GoogleAuthModal';
import { EarnCoinsModal } from '@/components/EarnCoinsModal';

interface AuthContextType {
  currentUser: User | null;
  session: any | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string, phone?: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User> | ((prev: User | null) => User | null)) => void;
  refreshCoins: () => Promise<number | null>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isEarnCoinsModalOpen: boolean;
  openEarnCoinsModal: () => void;
  closeEarnCoinsModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEarnCoinsModalOpen, setIsEarnCoinsModalOpen] = useState(false);

  // Sync to localStorage
  const saveUserToStorage = (user: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem('dhoti_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('dhoti_user');
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  };

  // Initial load from storage and Supabase session
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Try local cache for instant UI rendering
      try {
        const cached = localStorage.getItem('dhoti_user');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
          }
        }
      } catch (err) {
        console.warn('Cached user parse error:', err);
      }

      // 2. Validate with Supabase session
      if (isSupabaseConfigured()) {
        try {
          const { data: { session: sbSession } } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(sbSession);
            if (sbSession?.user) {
              const mapped = mapSupabaseUserToAppUser(sbSession.user);
              // Fetch latest database coins & role
              try {
                const { data: dbUser } = await supabase
                  .from('users')
                  .select('coins, rank, badge, wins, battles, role, is_admin, name, avatar')
                  .eq('id', sbSession.user.id)
                  .maybeSingle();

                if (dbUser) {
                  const mergedUser: User = {
                    ...mapped,
                    name: dbUser.name || mapped.name,
                    avatar: dbUser.avatar || mapped.avatar,
                    coins: dbUser.coins ?? mapped.coins,
                    wins: dbUser.wins ?? mapped.wins,
                    battles: dbUser.battles ?? mapped.battles,
                    badge: dbUser.badge || mapped.badge,
                    rank: dbUser.rank || mapped.rank,
                    role: dbUser.role || mapped.role,
                    isAdmin: isSiteAdmin(mapped.email) || Boolean(dbUser.is_admin),
                  };
                  setCurrentUser(mergedUser);
                  saveUserToStorage(mergedUser);
                } else {
                  setCurrentUser(mapped);
                  saveUserToStorage(mapped);
                }
              } catch {
                setCurrentUser(mapped);
                saveUserToStorage(mapped);
              }
            }
          }
        } catch (e) {
          console.warn('Supabase session load error:', e);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase Auth state changes
    let authSubscription: any = null;
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (newSession?.user) {
            const mapped = mapSupabaseUserToAppUser(newSession.user);
            try {
              const { data: dbUser } = await supabase
                .from('users')
                .select('coins, rank, badge, wins, battles, role, is_admin')
                .eq('id', newSession.user.id)
                .maybeSingle();
              if (dbUser) {
                mapped.coins = dbUser.coins ?? mapped.coins;
                mapped.wins = dbUser.wins ?? mapped.wins;
                mapped.battles = dbUser.battles ?? mapped.battles;
                mapped.badge = dbUser.badge || mapped.badge;
                mapped.rank = dbUser.rank || mapped.rank;
                mapped.role = dbUser.role || mapped.role;
                mapped.isAdmin = isSiteAdmin(mapped.email) || Boolean(dbUser.is_admin);
              }
            } catch {}
            setCurrentUser(mapped);
            saveUserToStorage(mapped);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          saveUserToStorage(null);
        }
      });
      authSubscription = subscription;
    }

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithEmail({ email, password: pass });
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.user) {
        setCurrentUser(res.user);
        saveUserToStorage(res.user);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, pass: string, name: string, phone?: string, avatarUrl?: string) => {
    setIsLoading(true);
    try {
      const res = await signUpWithEmail({ email, password: pass, name, phone, avatarUrl });
      if (res.error) {
        return { success: false, error: res.error };
      }
      if (res.user) {
        setCurrentUser(res.user);
        saveUserToStorage(res.user);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await signOutSupabase();
    setCurrentUser(null);
    setSession(null);
    saveUserToStorage(null);
  };

  const updateUser = useCallback((updated: Partial<User> | ((prev: User | null) => User | null)) => {
    setCurrentUser((prev) => {
      const nextUser = typeof updated === 'function' ? updated(prev) : (prev ? { ...prev, ...updated } : null);
      saveUserToStorage(nextUser);
      return nextUser;
    });
  }, []);

  const refreshCoins = async (): Promise<number | null> => {
    if (!currentUser?.id || !isSupabaseConfigured()) return null;
    try {
      const { data } = await supabase
        .from('users')
        .select('coins')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data && typeof data.coins === 'number') {
        updateUser({ coins: data.coins });
        return data.coins;
      }
    } catch (e) {
      console.warn('Could not refresh coins:', e);
    }
    return null;
  };

  const isAdmin = Boolean(currentUser && (currentUser.isAdmin || isSiteAdmin(currentUser.email)));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        session,
        isLoading,
        isAdmin,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUser,
        refreshCoins,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isEarnCoinsModalOpen,
        openEarnCoinsModal: () => setIsEarnCoinsModalOpen(true),
        closeEarnCoinsModal: () => setIsEarnCoinsModalOpen(false),
      }}
    >
      {children}

      {/* Global Auth Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          saveUserToStorage(u);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Global Earn Coins Modal */}
      <EarnCoinsModal
        isOpen={isEarnCoinsModalOpen}
        onClose={() => setIsEarnCoinsModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onCoinsRewarded={(newCoins) => {
          updateUser({ coins: newCoins });
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
