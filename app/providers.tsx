'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PostsProvider } from '@/context/PostsContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  // PWA Service Worker Registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[Photogram PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[Photogram PWA] Service Worker registration notice:', error);
          });
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PostsProvider>
            <AppLayout>{children}</AppLayout>
          </PostsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
