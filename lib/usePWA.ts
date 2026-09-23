'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useIsMounted } from './useIsMounted';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as {
      standalone?: boolean;
    }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function getIsIOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const ua = window.navigator.userAgent.toLowerCase();

  return /iphone|ipad|ipod/.test(ua) && !getIsStandalone();
}

function getIsOnline(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

export function usePWA() {
  const isMounted = useIsMounted();

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] =
    useState<boolean>(() => getIsStandalone());

  const [isIOS, setIsIOS] =
    useState<boolean>(() => getIsIOS());

  const [canInstall, setCanInstall] = useState(false);

  const [updateAvailable, setUpdateAvailable] =
    useState(false);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [isOnline, setIsOnline] =
    useState<boolean>(() => getIsOnline());

  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  /*
   * Keep the latest service-worker registration in a ref.
   *
   * This prevents the update-checking effect from constantly
   * restarting whenever the registration state changes.
   */
  const registrationRef =
    useRef<ServiceWorkerRegistration | null>(null);

  /*
   * Prevent multiple reloads when controllerchange fires.
   */
  const refreshingRef = useRef(false);

  /*
   * Track initial deployment timestamp to detect live updates.
   */
  const initialBuildTimeRef = useRef<string | null>(null);

  /*
   * Activate a waiting service worker immediately.
   */
  const activateWaitingWorker = useCallback(
    (registration: ServiceWorkerRegistration): boolean => {
      const waitingWorker = registration.waiting;

      if (!waitingWorker) {
        return false;
      }

      setIsUpdating(true);
      setUpdateAvailable(false);

      waitingWorker.postMessage({
        type: 'SKIP_WAITING',
      });

      return true;
    },
    []
  );

  /*
   * Check whether a new deployment is available.
   *
   * The service worker itself uses updateViaCache: 'none',
   * so the browser must check the latest /sw.js and /api/version.
   */
  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // 1. Check version endpoint
      try {
        const verRes = await fetch('/api/version', { cache: 'no-store' });
        if (verRes.ok) {
          const verData = await verRes.json();
          if (!initialBuildTimeRef.current) {
            initialBuildTimeRef.current = verData.buildTime;
          } else if (initialBuildTimeRef.current !== verData.buildTime) {
            console.log('[DHOTI AALE] New deployment detected:', verData.buildTime);
            setUpdateAvailable(true);
            if (registrationRef.current) {
              await registrationRef.current.update();
              activateWaitingWorker(registrationRef.current);
            }
            return true;
          }
        }
      } catch {
        // Ignore network errors in offline mode
      }

      // 2. Check service worker registration
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration =
        registrationRef.current ||
        (await navigator.serviceWorker.getRegistration('/'));

      if (!registration) {
        return false;
      }

      registrationRef.current = registration;

      await registration.update();

      if (registration.waiting) {
        setUpdateAvailable(true);

        activateWaitingWorker(registration);

        return true;
      }

      return false;
    } catch (error) {
      console.warn(
        '[DHOTI AALE] Service worker update check failed:',
        error
      );

      return false;
    }
  }, [activateWaitingWorker]);

  /*
   * Register PWA service worker.
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let mounted = true;
    let updateInterval: number | null = null;

    const handleOnline = () => {
      setIsOnline(true);

      /*
       * Internet वापस आते ही latest deployment check.
       */
      void checkForUpdates();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    /*
     * Android / Chrome installation prompt.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setDeferredPrompt(
        event as BeforeInstallPromptEvent
      );

      setCanInstall(true);
    };

    /*
     * App successfully installed.
     */
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);

      // Trigger local welcome notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const sendWelcomeNotice = () => {
          try {
            new Notification('Dhoti Aale App Installed! 🎉', {
              body: 'स्वागत है! Dhoti Aale ऐप आपके फोन में सफलतापूर्वक इंस्टॉल हो चुका है। अब आप हर नया अपडेट और गाँव की खबरें सीधे पा सकते हैं।',
              icon: '/icons/icon-192x192.png',
            });
          } catch (e) {
            console.log('[DHOTI AALE] Notification error:', e);
          }
        };

        if (Notification.permission === 'granted') {
          sendWelcomeNotice();
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              sendWelcomeNotice();
            }
          });
        }
      }
    };

    /*
     * When the new service worker becomes active,
     * reload the application exactly once.
     */
    const handleControllerChange = () => {
      if (refreshingRef.current) {
        return;
      }

      refreshingRef.current = true;

      setIsUpdating(true);

      /*
       * Small delay gives the new service worker a moment
       * to take control before the page reloads.
       */
      window.setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    /*
     * When the app becomes visible again,
     * check for a new deployment.
     */
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine
      ) {
        void checkForUpdates();
      }
    };

    window.addEventListener(
      'online',
      handleOnline
    );

    window.addEventListener(
      'offline',
      handleOffline
    );

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      'appinstalled',
      handleAppInstalled
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    /*
     * SERVICE WORKER REGISTRATION
     */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleControllerChange
      );

      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(async (registration) => {
          if (!mounted) {
            return;
          }

          registrationRef.current = registration;

          setSwRegistration(registration);

          /*
           * Check immediately when the PWA opens.
           */
          try {
            await registration.update();
          } catch (error) {
            console.warn(
              '[DHOTI AALE] Initial service worker update check failed:',
              error
            );
          }

          /*
           * If an updated worker is already waiting,
           * activate it automatically.
           */
          if (registration.waiting) {
            setUpdateAvailable(true);

            activateWaitingWorker(registration);
          }

          /*
           * Watch future deployments.
           */
          registration.addEventListener(
            'updatefound',
            () => {
              const newWorker =
                registration.installing;

              if (!newWorker) {
                return;
              }

              newWorker.addEventListener(
                'statechange',
                () => {
                  if (
                    newWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    setUpdateAvailable(true);

                    /*
                     * Automatically activate latest version.
                     */
                    activateWaitingWorker(
                      registration
                    );
                  }
                }
              );
            }
          );

          /*
           * Check every 60 seconds while the app
           * remains open.
           */
          updateInterval = window.setInterval(() => {
            if (navigator.onLine) {
              void checkForUpdates();
            }
          }, 60 * 1000);

          /*
           * Also check immediately after registration.
           */
          if (navigator.onLine) {
            void checkForUpdates();
          }
        })
        .catch((error) => {
          console.error(
            '[DHOTI AALE] Service Worker registration failed:',
            error
          );
        });
    }

    return () => {
      mounted = false;

      window.removeEventListener(
        'online',
        handleOnline
      );

      window.removeEventListener(
        'offline',
        handleOffline
      );

      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        'appinstalled',
        handleAppInstalled
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleControllerChange
        );
      }

      if (updateInterval !== null) {
        window.clearInterval(updateInterval);
      }
    };
  }, [activateWaitingWorker, checkForUpdates]);

  /*
   * Install PWA.
   */
  const installApp = useCallback(
    async (): Promise<
      'accepted' | 'dismissed' | 'ios' | 'unsupported'
    > => {
      if (deferredPrompt) {
        try {
          await deferredPrompt.prompt();

          const choice =
            await deferredPrompt.userChoice;

          if (choice.outcome === 'accepted') {
            setIsInstalled(true);
            setCanInstall(false);
            setDeferredPrompt(null);

            return 'accepted';
          }

          return 'dismissed';
        } catch (error) {
          console.error(
            '[DHOTI AALE] Install prompt failed:',
            error
          );

          return 'dismissed';
        }
      }

      if (isIOS) {
        return 'ios';
      }

      return 'unsupported';
    },
    [deferredPrompt, isIOS]
  );

  /*
   * Manual update method.
   *
   * Existing PWAInstallBanner can continue using this.
   */
  const applyUpdate = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      window.location.reload();
      return;
    }

    const registration =
      registrationRef.current ||
      swRegistration;

    if (registration?.waiting) {
      activateWaitingWorker(registration);
      return;
    }

    /*
     * No waiting worker means there may simply be
     * a fresh server deployment. Reload normally.
     */
    setIsUpdating(true);

    window.location.reload();
  }, [
    swRegistration,
    activateWaitingWorker,
  ]);

  return {
    isInstalled,
    canInstall,
    isIOS,
    updateAvailable,
    isUpdating,
    isOnline,
    isMounted,
    installApp,
    applyUpdate,
    checkForUpdates,
  };
}