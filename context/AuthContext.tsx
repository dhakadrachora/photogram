'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '@/lib/types';
import { CURRENT_USER } from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, username: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: CURRENT_USER,
  isLoading: false,
  login: async () => ({ success: true }),
  signup: async () => ({ success: true }),
  logout: async () => {},
  updateProfile: () => {},
});

const REAL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(CURRENT_USER);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check local storage for persistent profile overrides
    const stored = localStorage.getItem('insta_current_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.username) setUser(parsed);
      } catch (e) {
        setUser(CURRENT_USER);
      }
    }

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
        }
      }).catch(() => {});

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user.id);
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
        localStorage.setItem('insta_current_user', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not fetch Supabase profile:', err);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (!error && data?.user) {
          await fetchSupabaseProfile(data.user.id);
          setIsLoading(false);
          return { success: true };
        }
      } catch (e) {
        // Fall through to real local login session
      }
    }

    // Real local session login
    const cleanUsername = email.includes('@') ? email.split('@')[0] : email;
    const realProfile: Profile = {
      ...CURRENT_USER,
      id: `usr_${cleanUsername.toLowerCase()}`,
      username: cleanUsername.toLowerCase(),
      full_name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
    };
    setUser(realProfile);
    localStorage.setItem('insta_current_user', JSON.stringify(realProfile));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (email: string, pass: string, username: string, name: string) => {
    setIsLoading(true);
    const chosenAvatar = REAL_AVATARS[Math.floor(Math.random() * REAL_AVATARS.length)];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              username: username.toLowerCase().trim(),
              full_name: name.trim(),
              avatar_url: chosenAvatar,
            },
          },
        });
        if (!error && data?.user) {
          const profile: Profile = {
            id: data.user.id,
            username: username.toLowerCase().trim(),
            full_name: name.trim(),
            avatar_url: chosenAvatar,
            bio: 'Visual Creator on Instagram Web 📸✨',
            posts_count: 0,
            followers_count: 0,
            following_count: 0,
            is_verified: false,
          };
          setUser(profile);
          localStorage.setItem('insta_current_user', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (e) {
        // Fall through to real local profile creation
      }
    }

    // Local profile creation
    const newProfile: Profile = {
      id: `usr_${Date.now()}`,
      username: username.toLowerCase().trim(),
      full_name: name.trim(),
      avatar_url: chosenAvatar,
      bio: 'Visual Creator on Instagram Web 📸✨',
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      is_verified: false,
    };
    setUser(newProfile);
    localStorage.setItem('insta_current_user', JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    localStorage.removeItem('insta_current_user');
    setUser(CURRENT_USER);
  };

  const updateProfile = (updated: Partial<Profile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    localStorage.setItem('insta_current_user', JSON.stringify(newProfile));

    if (isSupabaseConfigured()) {
      supabase.from('profiles').update(updated).eq('id', user.id).then(() => {}, () => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
