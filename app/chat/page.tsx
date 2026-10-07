'use client';

import React from 'react';
import { AppShell } from '@/components/app/AppShell';
import { WorldChat } from '@/components/WorldChat';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { currentUser, openAuthModal } = useAuth();
  const router = useRouter();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <WorldChat
          currentUser={currentUser}
          onOpenAuth={openAuthModal}
          onStartBattleInvite={(opponentName) => {
            router.push(`/battle?invite=${encodeURIComponent(opponentName)}`);
          }}
        />
      </div>
    </AppShell>
  );
}
