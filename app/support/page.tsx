'use client';

import React from 'react';
import { SupportView } from '@/components/SupportView';
import { AppShell } from '@/components/app/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SupportPage() {
  const { currentUser, openAuthModal } = useAuth();

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <SupportView
          currentUser={currentUser}
          onOpenAuth={openAuthModal}
          isStandalonePage={true}
        />
      </div>
    </AppShell>
  );
}
