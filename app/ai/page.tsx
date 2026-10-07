'use client';

import React from 'react';
import { AppShell } from '@/components/app/AppShell';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { AppTab } from '@/types';

export default function AIPage() {
  const { currentUser, openAuthModal } = useAuth();
  const router = useRouter();

  const handleNavigateTab = (tab: AppTab) => {
    switch (tab) {
      case 'home':
        router.push('/');
        break;
      case 'news':
        router.push('/news');
        break;
      case 'battle':
        router.push('/battle');
        break;
      case 'worldchat':
        router.push('/chat');
        break;
      case 'rewards':
        router.push('/rewards');
        break;
      case 'profile':
        router.push('/profile');
        break;
      case 'tools':
        router.push('/tools');
        break;
      case 'support':
        router.push('/support');
        break;
      default:
        break;
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <VoiceAssistant
          currentUser={currentUser}
          onNavigateTab={handleNavigateTab}
          onOpenAuth={openAuthModal}
        />
      </div>
    </AppShell>
  );
}
