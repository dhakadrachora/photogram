'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface StoredAccount {
  id: string;
  email: string;
  username: string;
  full_name: string;
  password: string;
  avatar_url: string;
  bio: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  created_at: string;
}

// System-reserved handles that cannot be registered by users
export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'photogram',
  'instagram',
  'meta',
  'support',
  'help',
  'official',
  'security',
  'root',
  'system',
];

const REAL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
];

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (identifier: string, pass: string, username: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (emailOrUsername: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; reason?: string }>;
  updateProfile: (updated: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: true }),
  signup: async () => ({ success: true }),
  logout: async () => {},
  resetPassword: async () => ({ success: true }),
  updatePassword: async () => ({ success: true }),
  checkUsernameAvailability: async () => ({ available: true }),
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper: Read persistent real registered accounts
  const getStoredAccounts = (): StoredAccount[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('photogram_registered_accounts');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  // Helper: Save persistent real registered accounts
  const saveStoredAccounts = (accounts: StoredAccount[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('photogram_registered_accounts', JSON.stringify(accounts));
    }
  };

  // On Mount: Check persistent active session for real logged-in user
  useEffect(() => {
    try {
      const activeSession =
        localStorage.getItem('photogram_active_session') ||
        localStorage.getItem('insta_current_user');

      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        if (parsed?.username) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }

    // Check Supabase Auth session if configured
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        }
      }).catch(() => {});

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        } else if (!session) {
          const localSess = localStorage.getItem('photogram_active_session');
          if (!localSess) setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const fetchSupabaseProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (!error && data) {
        setUser(data);
        localStorage.setItem('photogram_active_session', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not fetch Supabase profile:', err);
    }
  };

  // 1. Real-time Unique Username Checker (Purely Real Accounts)
  const checkUsernameAvailability = async (rawUsername: string): Promise<{ available: boolean; reason?: string }> => {
    const clean = rawUsername.trim().toLowerCase();
    if (!clean) {
      return { available: false, reason: 'Please enter a username.' };
    }
    if (clean.length < 3) {
      return { available: false, reason: 'Username must be at least 3 characters.' };
    }
    if (!/^[a-zA-Z0-9._]+$/.test(clean)) {
      return { available: false, reason: 'Usernames can only use letters, numbers, underscores and periods.' };
    }

    // Check system reserved names
    if (RESERVED_USERNAMES.includes(clean)) {
      return { available: false, reason: `Username @${clean} is reserved. Please choose another.` };
    }

    // Check against real registered accounts
    const accounts = getStoredAccounts();
    const existsLocal = accounts.some((acc) => acc.username.toLowerCase() === clean);
    if (existsLocal) {
      return { available: false, reason: `Username @${clean} is already taken. Please try another.` };
    }

    // Check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', clean)
          .maybeSingle();
        if (data?.username) {
          return { available: false, reason: `Username @${clean} is already taken. Please try another.` };
        }
      } catch (e) {}
    }

    return { available: true };
  };

  // 2. Sign Up (Create Real Account with Unique Username & Password)
  const signup = async (
    emailOrPhone: string,
    pass: string,
    rawUsername: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanUsername = rawUsername.trim().toLowerCase();
    const identifier = emailOrPhone.trim().toLowerCase();

    // Check Unique Username
    const check = await checkUsernameAvailability(cleanUsername);
    if (!check.available) {
      setIsLoading(false);
      return { success: false, error: check.reason || 'This username is not available.' };
    }

    // Check Unique Email / Phone
    const accounts = getStoredAccounts();
    const emailExists = accounts.some(
      (acc) => acc.email.toLowerCase() === identifier || acc.username.toLowerCase() === identifier
    );
    if (emailExists) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Another account is using this email or mobile number. Please log in instead.',
      };
    }

    const chosenAvatar = REAL_AVATARS[Math.floor(Math.random() * REAL_AVATARS.length)];
    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: identifier,
      username: cleanUsername,
      full_name: name.trim() || cleanUsername,
      password: pass,
      avatar_url: chosenAvatar,
      bio: 'Photogram creator 📸✨',
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      is_verified: false,
      created_at: new Date().toISOString(),
    };

    // Save to real accounts registry
    accounts.push(newAccount);
    saveStoredAccounts(accounts);

    // Save to Supabase (if online)
    if (isSupabaseConfigured() && identifier.includes('@')) {
      try {
        await supabase.auth.signUp({
          email: identifier,
          password: pass,
          options: {
            data: {
              username: cleanUsername,
              full_name: newAccount.full_name,
              avatar_url: chosenAvatar,
            },
          },
        });
      } catch (e) {
        console.warn('Supabase signup fallback:', e);
      }
    }

    // Set real profile & active session
    const profile: Profile = {
      id: newAccount.id,
      username: newAccount.username,
      full_name: newAccount.full_name,
      avatar_url: newAccount.avatar_url,
      bio: newAccount.bio,
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      is_verified: false,
    };

    setUser(profile);
    localStorage.setItem('photogram_active_session', JSON.stringify(profile));
    localStorage.setItem('insta_current_user', JSON.stringify(profile));
    setIsLoading(false);
    return { success: true };
  };

  // 3. Log In (Authenticate ONLY against real registered accounts)
  const login = async (
    identifierRaw: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const identifier = identifierRaw.trim().toLowerCase();

    // Check Supabase auth if configured and looks like email
    if (isSupabaseConfigured() && identifier.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: pass,
        });
        if (!error && data?.user) {
          await fetchSupabaseProfile(data.user.id);
          setIsLoading(false);
          return { success: true };
        }
      } catch (e) {}
    }

    // Authenticate against real stored accounts
    const accounts = getStoredAccounts();
    const matched = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === identifier ||
        acc.email.toLowerCase() === identifier
    );

    if (!matched) {
      setIsLoading(false);
      return {
        success: false,
        error: "The username or email you entered doesn't belong to an account. Please check your username and try again.",
      };
    }

    if (matched.password !== pass) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Sorry, your password was incorrect. Please double-check your password.',
      };
    }

    // Successful authentication of real user
    const profile: Profile = {
      id: matched.id,
      username: matched.username,
      full_name: matched.full_name,
      avatar_url: matched.avatar_url,
      bio: matched.bio || 'Photogram creator 📸✨',
      posts_count: matched.posts_count || 0,
      followers_count: matched.followers_count || 0,
      following_count: matched.following_count || 0,
      is_verified: matched.is_verified || false,
    };

    setUser(profile);
    localStorage.setItem('photogram_active_session', JSON.stringify(profile));
    localStorage.setItem('insta_current_user', JSON.stringify(profile));
    setIsLoading(false);
    return { success: true };
  };

  // 4. Log Out (Complete session wipe & redirect)
  const logout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }

    localStorage.removeItem('photogram_active_session');
    localStorage.removeItem('insta_current_user');
    setUser(null);
    setIsLoading(false);

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // 5. Forgot Password (Look up real account)
  const resetPassword = async (
    emailOrUsername: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    setIsLoading(true);
    const target = emailOrUsername.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const matched = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === target ||
        acc.email.toLowerCase() === target
    );

    if (!matched) {
      setIsLoading(false);
      return {
        success: false,
        error: "No account found with that email or username. Please check your spelling or sign up.",
      };
    }

    if (isSupabaseConfigured() && matched.email.includes('@')) {
      try {
        await supabase.auth.resetPasswordForEmail(matched.email, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?mode=forgot` : undefined,
        });
      } catch (e) {}
    }

    localStorage.setItem('photogram_pending_reset_account', matched.username);
    setIsLoading(false);
    return {
      success: true,
      message: `Account found for @${matched.username}! You can now set your new password below.`,
    };
  };

  // 6. Update Password (Update real password in account)
  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const pendingUsername = localStorage.getItem('photogram_pending_reset_account');
    const accounts = getStoredAccounts();

    let targetAccount = accounts.find(
      (acc) => acc.username.toLowerCase() === pendingUsername?.toLowerCase()
    );

    if (!targetAccount && user) {
      targetAccount = accounts.find(
        (acc) => acc.username.toLowerCase() === user.username.toLowerCase()
      );
    }

    if (!targetAccount) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Could not find account to update password. Please try resetting again.',
      };
    }

    targetAccount.password = newPassword;
    saveStoredAccounts(accounts);

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (e) {}
    }

    // Auto-login with the updated credentials
    const profile: Profile = {
      id: targetAccount.id,
      username: targetAccount.username,
      full_name: targetAccount.full_name,
      avatar_url: targetAccount.avatar_url,
      bio: targetAccount.bio,
      posts_count: targetAccount.posts_count,
      followers_count: targetAccount.followers_count,
      following_count: targetAccount.following_count,
      is_verified: targetAccount.is_verified,
    };

    setUser(profile);
    localStorage.setItem('photogram_active_session', JSON.stringify(profile));
    localStorage.setItem('insta_current_user', JSON.stringify(profile));
    localStorage.removeItem('photogram_pending_reset_account');
    setIsLoading(false);
    return { success: true };
  };

  // 7. Update Profile
  const updateProfile = (updated: Partial<Profile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    localStorage.setItem('photogram_active_session', JSON.stringify(newProfile));
    localStorage.setItem('insta_current_user', JSON.stringify(newProfile));

    // Also update in accounts registry
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((acc) => acc.id === user.id || acc.username === user.username);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...updated };
      saveStoredAccounts(accounts);
    }

    if (isSupabaseConfigured()) {
      supabase.from('profiles').update(updated).eq('id', user.id).then(() => {}, () => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
        checkUsernameAvailability,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
