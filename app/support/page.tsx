'use client';

import React, { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { SupportView } from '@/components/SupportView';
import GoogleAuthModal from '@/components/GoogleAuthModal';
import { User } from '@/types';
import { supabase, isSupabaseConfigured, mapSupabaseUserToAppUser } from '@/lib/supabase';
import { useIsMounted } from '@/lib/useIsMounted';

function subscribeUser(callback: () => void) {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'dhoti_user') {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
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

export default function SupportPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // Sync Supabase user on load
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !currentUser) {
        const appUser = mapSupabaseUserToAppUser(session.user);
        try {
          localStorage.setItem('dhoti_user', JSON.stringify(appUser));
        } catch {}
      }
    });
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    try {
      localStorage.setItem('dhoti_user', JSON.stringify(user));
    } catch {}
    setIsAuthModalOpen(false);
  };

  return (
    <>
      <SupportView
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isStandalonePage={true}
      />

      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
