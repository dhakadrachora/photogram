'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function getIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !getIsStandalone();
}

function getIsOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(getIsStandalone);
  const [isIOS, setIsIOS] = useState<boolean>(getIsIOS);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(getIsOnline);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check online status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker Registration & Update Detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          setSwRegistration(reg);

          // Check if an updated worker is already waiting
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Listen for new worker installing
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new version has been installed and is ready
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });

      // Reload page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Method to trigger installation
  const installApp = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unsupported'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setCanInstall(false);
          setDeferredPrompt(null);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.error('Error prompting install:', err);
        return 'dismissed';
      }
    } else if (isIOS) {
      return 'ios';
    }
    return 'unsupported';
  }, [deferredPrompt, isIOS]);

  // Method to apply the update immediately
  const applyUpdate = useCallback(() => {
    setIsUpdating(true);
    if (swRegistration && swRegistration.waiting) {
      // Post message to waiting service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback reload
      window.location.reload();
    }
  }, [swRegistration]);

  // Method to manually check for updates (e.g. user taps "Check for updates")
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        if (swRegistration.waiting) {
          setUpdateAvailable(true);
          return true;
        }
      } catch (err) {
        console.warn('Failed to check for updates:', err);
      }
    }
    return false;
  }, [swRegistration]);

  return {
    isInstalled,
    canInstall,
    isIOS,
    updateAvailable,
    isUpdating,
    isOnline,
    installApp,
    applyUpdate,
    checkForUpdates,
  };
}
