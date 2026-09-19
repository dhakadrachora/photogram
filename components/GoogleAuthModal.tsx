'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import {
  X,
  ShieldCheck,
  Sparkles,
  Crown,
  Loader2,
} from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

/**
 * IMPORTANT
 * This component expects Firebase to already be initialized somewhere
 * in the existing project.
 *
 * It intentionally does NOT create a second Firebase app.
 */
function getFirebaseAuth() {
  return auth;
}

function getRole(email: string): 'admin' | 'resident' {
  return isSiteAdmin(email) ? 'admin' : 'resident';
}

function createAppUser(firebaseUser: FirebaseUser): User {
  const email = (firebaseUser.email || '').trim().toLowerCase();

  if (!email) {
    throw new Error('Google account email was not returned.');
  }

  const admin = isSiteAdmin(email);

  return {
    id: firebaseUser.uid,
    name:
      firebaseUser.displayName ||
      email.split('@')[0] ||
      'Google User',
    email,
    avatar: firebaseUser.photoURL || '',
    badge: admin
      ? 'Site Owner & Admin 👑'
      : 'Dhoti Resident',
    coins: 0,
    wins: 0,
    battles: 0,
    rank: admin ? 'Super Admin 👑' : 'Resident',
    isGoogle: true,
    role: getRole(email),
    isAdmin: admin,
  };
}

function getFirebaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google login window was closed. Please try again.';

    case 'auth/popup-blocked':
      return 'Your browser blocked the Google login window. Please allow popups and try again.';

    case 'auth/cancelled-popup-request':
      return 'Another Google login request is already running.';

    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';

    case 'auth/unauthorized-domain':
      return 'This website domain is not authorized for Google Sign-In in Firebase.';

    case 'auth/operation-not-allowed':
      return 'Google Sign-In is not enabled in Firebase Authentication.';

    case 'auth/invalid-api-key':
      return 'Firebase configuration is invalid.';

    case 'auth/app-not-authorized':
      return 'This app is not authorized for Google Sign-In.';

    case 'auth/account-exists-with-different-credential':
      return 'This email already uses another sign-in method.';

    case 'auth/internal-error':
      return 'Google Sign-In encountered an internal error. Please try again.';

    default:
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ) {
        return (error as { message: string }).message;
      }

      return 'Google Sign-In failed. Please try again.';
  }
}

export function GoogleAuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: GoogleAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /**
   * Complete login after Firebase has authenticated the Google account.
   */
  const completeLogin = React.useCallback(
    (firebaseUser: FirebaseUser) => {
      const appUser = createAppUser(firebaseUser);

      SoundEffects.playBell();

      onLoginSuccess(appUser);
      onClose();
    },
    [onLoginSuccess, onClose]
  );

  /**
   * Handle Google Sign-In.
   *
   * Popup is preferred because it gives the user Google's account
   * chooser and does not rely on localStorage or fake account data.
   *
   * On browsers/devices where popup cannot be used, redirect is used.
   */
  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Opening Google account chooser...');

    try {
      const auth = getFirebaseAuth();

      const provider = new GoogleAuthProvider();

      // Always ask Google to show the account selection UI.
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      try {
        const result = await signInWithPopup(auth, provider);

        if (!result.user) {
          throw new Error('Google did not return a user account.');
        }

        setStatusMessage('Google account verified.');

        completeLogin(result.user);
      } catch (popupError: unknown) {
        const code =
          typeof popupError === 'object' &&
          popupError !== null &&
          'code' in popupError
            ? String((popupError as { code?: unknown }).code)
            : '';

        /**
         * Mobile browsers can block popup authentication.
         * Redirect is the safe fallback.
         */
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          setStatusMessage('Opening secure Google login...');

          await signInWithRedirect(auth, provider);
          return;
        }

        throw popupError;
      }
    } catch (error: unknown) {
      console.error('DHOTI AALE Google Sign-In error:', error);

      setErrorMessage(getFirebaseErrorMessage(error));
      setStatusMessage(null);
      setIsLoading(false);
    }
  };

  /**
   * Handle a Google redirect result.
   *
   * This is mainly for mobile/browser environments where Firebase
   * needs to return to the website after Google authentication.
   */
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const checkRedirectLogin = async () => {
      try {
        const auth = getFirebaseAuth();

        const result = await getRedirectResult(auth);

        if (cancelled || !result?.user) return;

        setIsLoading(true);
        setErrorMessage(null);
        setStatusMessage('Google account verified.');

        completeLogin(result.user);
      } catch (error: unknown) {
        if (cancelled) return;

        console.error(
          'DHOTI AALE Google redirect error:',
          error
        );

        setErrorMessage(getFirebaseErrorMessage(error));
        setStatusMessage(null);
        setIsLoading(false);
      }
    };

    void checkRedirectLogin();

    return () => {
      cancelled = true;
    };
  }, [isOpen, completeLogin]);

  /**
   * Keep Firebase's already-authenticated state in sync.
   *
   * This does NOT create fake users.
   */
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) return;

        /**
         * Do not automatically force-login an old saved account.
         * Firebase itself is the source of truth.
         */
      });
    } catch (error) {
      console.error(
        'DHOTI AALE Firebase auth initialization error:',
        error
      );
    }

    return () => {
      unsubscribe?.();
    };
  }, [isOpen]);

  /**
   * Reset temporary UI state when modal closes.
   */
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setErrorMessage(null);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-auth-title"
    >
      <div
        id="google-auth-modal"
        className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-slate-100"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          id="close-auth-modal-btn"
          aria-label="Close Google login"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <svg
              className="h-9 w-9"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h2
            id="google-auth-title"
            className="text-xl font-black tracking-tight text-white sm:text-2xl"
          >
            Login to DHOTI AALE
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Choose your Google account to continue
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="text-xs">
            <div className="font-bold text-amber-300">
              Verified Google Access
            </div>

            <div className="mt-0.5 text-slate-400">
              Unlock World Chat, AI Voice and Battle Voting
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div
            className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-amber-400" />

            <div className="mt-4 text-sm font-bold text-white">
              {statusMessage || 'Signing in with Google...'}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Please complete Google account selection.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Login */}
            <button
              id="direct-google-sign-in-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>

              <span>Continue with Google</span>
            </button>

            <div className="text-center text-[11px] text-slate-500">
              Google will let you choose which account to use.
            </div>
          </div>
        )}

        {/* Admin information */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>
              Site Owner/Admin access is determined securely from the
              authenticated Google email.
            </span>
          </div>
        </div>

        {/* Security */}
        <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Secure Firebase Google Authentication</span>
        </div>
      </div>
    </div>
  );
}

export default GoogleAuthModal;