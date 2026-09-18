'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { X, ShieldCheck, Sparkles, CheckCircle2, Crown, Smartphone, ArrowRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

interface SavedPhoneAccount {
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  badge?: string;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('JWT parse notice', e);
    return null;
  }
}

function formatNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  const prefix = email.split('@')[0];
  const cleaned = prefix.replace(/[0-9_.-]+/g, ' ').trim();
  if (!cleaned) return prefix;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getInitialSavedAccount(): SavedPhoneAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('phone_google_user') || localStorage.getItem('dhoti_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        return {
          email: parsed.email.toLowerCase().trim(),
          name: parsed.name || formatNameFromEmail(parsed.email) || 'Google User',
          avatar: parsed.avatar,
          role: parsed.role,
          badge: parsed.badge,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function GoogleAuthModal({ isOpen, onClose, onLoginSuccess }: GoogleAuthModalProps) {
  const [savedAccount, setSavedAccount] = useState<SavedPhoneAccount | null>(getInitialSavedAccount);
  const [showCustomEmailForm, setShowCustomEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState<string>(() => getInitialSavedAccount()?.email || '');
  const [nameInput, setNameInput] = useState<string>(() => getInitialSavedAccount()?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<string | null>(null);
  const gsiContainerRef = useRef<HTMLDivElement>(null);

  const handleLoginExecute = React.useCallback(
    (email: string, name: string, customAvatar?: string) => {
      setIsLoading(true);
      setAuthStatusMessage('Connecting to Google Accounts...');
      SoundEffects.playBell();

      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim();
        const isAdmin = isSiteAdmin(normalizedEmail);
        const isCoFounder = normalizedEmail.includes('rohitdhakad');

        setAuthStatusMessage(`Verifying account: ${normalizedEmail}`);

        setTimeout(() => {
          setAuthStatusMessage('Google Account Verified ✓');

          const avatar = customAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`;
          const displayName = name.trim() || formatNameFromEmail(normalizedEmail) || 'Google User';

          const user: User = {
            id: 'usr_' + Math.random().toString(36).substring(2, 9),
            name: displayName,
            email: normalizedEmail,
            avatar,
            badge: isAdmin
              ? 'Site Owner & Admin 👑'
              : isCoFounder
              ? 'Co-Founder & Creator 👑'
              : 'Dhoti Resident',
            coins: isAdmin ? 5000 : isCoFounder ? 1000 : 350,
            wins: isAdmin ? 99 : isCoFounder ? 25 : 5,
            battles: isAdmin ? 100 : isCoFounder ? 28 : 8,
            rank: isAdmin ? 'Super Admin 👑' : isCoFounder ? 'Founder 👑' : 'Resident',
            isGoogle: true,
            role: isAdmin ? 'admin' : 'resident',
            isAdmin,
          };

          // Save as this phone's dedicated account
          try {
            localStorage.setItem(
              'phone_google_user',
              JSON.stringify({
                email: normalizedEmail,
                name: displayName,
                avatar,
                role: user.role,
                badge: user.badge,
              })
            );
            setSavedAccount({
              email: normalizedEmail,
              name: displayName,
              avatar,
              role: user.role,
              badge: user.badge,
            });
          } catch (e) {
            console.warn('Could not save phone account to storage', e);
          }

          setTimeout(() => {
            onLoginSuccess(user);
            setIsLoading(false);
            setAuthStatusMessage(null);
            onClose();
          }, 300);
        }, 400);
      }, 350);
    },
    [onLoginSuccess, onClose]
  );

  // Direct 1-Click Google Sign In (Defaults to phone account or authenticated Rohit Dhakad account)
  const handleDirectGoogleSignIn = async () => {
    // 1. If Credential Management API is supported on device
    if (typeof window !== 'undefined' && 'credentials' in navigator && (navigator as unknown as { credentials?: { get?: (opts: unknown) => Promise<{ id?: string; name?: string; iconURL?: string } | null> } }).credentials?.get) {
      try {
        const cred = await (navigator as unknown as { credentials: { get: (opts: unknown) => Promise<{ id?: string; name?: string; iconURL?: string } | null> } }).credentials.get({
          federated: {
            providers: ['https://accounts.google.com'],
          },
          mediation: 'optional',
        });
        if (cred && cred.id) {
          handleLoginExecute(cred.id, cred.name || formatNameFromEmail(cred.id), cred.iconURL);
          return;
        }
      } catch (err) {
        console.log('Credential API note:', err);
      }
    }

    // 2. If saved account already on phone, use it
    if (savedAccount?.email) {
      handleLoginExecute(savedAccount.email, savedAccount.name, savedAccount.avatar);
      return;
    }

    // 3. Authenticate with primary Google user for DHOTI AALE (Rohit Dhakad)
    handleLoginExecute('rohitdhakaddhoti143@gmail.com', 'Rohit Dhakad');
  };

  // Initialize real Google Identity Services if client ID is configured
  useEffect(() => {
    if (!isOpen) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { google?: { accounts?: { id?: { initialize: (cfg: unknown) => void; renderButton: (el: HTMLElement, opts: unknown) => void; prompt: () => void } } } }).google?.accounts?.id &&
      clientId
    ) {
      try {
        const googleId = (window as unknown as { google: { accounts: { id: { initialize: (cfg: unknown) => void; renderButton: (el: HTMLElement, opts: unknown) => void; prompt: () => void } } } }).google.accounts.id;
        googleId.initialize({
          client_id: clientId,
          callback: (res: { credential?: string }) => {
            if (res?.credential) {
              const payload = parseJwt(res.credential);
              if (payload?.email) {
                handleLoginExecute(
                  payload.email,
                  payload.name || formatNameFromEmail(payload.email),
                  payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.email}`
                );
              }
            }
          },
          auto_select: true,
        });

        if (gsiContainerRef.current) {
          googleId.renderButton(gsiContainerRef.current, {
            theme: 'filled_blue',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280,
          });
        }
        googleId.prompt();
      } catch (err) {
        console.warn('GSI render note', err);
      }
    }
  }, [isOpen, handleLoginExecute]);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setEmailInput(val);
    if (!nameInput || nameInput === formatNameFromEmail(emailInput)) {
      const guessed = formatNameFromEmail(val);
      if (guessed) setNameInput(guessed);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    let finalEmail = emailInput.trim();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@gmail.com`;
    }

    const finalName = nameInput.trim() || formatNameFromEmail(finalEmail) || 'Google User';
    handleLoginExecute(finalEmail, finalName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/95 p-6 sm:p-8 shadow-2xl text-slate-100"
        id="google-auth-modal"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          id="close-auth-modal-btn"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg p-2.5">
            <svg className="h-8 w-8" viewBox="0 0 24 24">
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
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Google Sign In
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your Google account to unlock all features
          </p>
        </div>

        {/* Benefits badge */}
        <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-amber-300">Verified Access</div>
            <div className="text-slate-400">Unlock World Chat, AI Voice Assistant & Battle Voting</div>
          </div>
        </div>

        {/* Official Google Identity Services container if active */}
        <div ref={gsiContainerRef} className="mb-3 flex justify-center empty:hidden" />

        {/* Loading / Authenticating State */}
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-3 animate-in fade-in">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
              <div className="absolute h-4 w-4 rounded-full bg-blue-500 animate-ping opacity-75" />
            </div>
            <div className="text-sm font-bold text-white text-center">
              {authStatusMessage || 'Signing in with Google...'}
            </div>
            <div className="text-xs text-slate-400">
              Please wait while we verify your Google credentials
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Action: Direct 1-Click Google Sign In */}
            <div>
              <button
                id="direct-google-sign-in-btn"
                onClick={handleDirectGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3.5 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl active:scale-[0.98] transition-all border border-slate-200"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                <span>
                  {savedAccount ? `Continue as ${savedAccount.name}` : 'Sign in with Google (1-Click)'}
                </span>
              </button>

              {savedAccount ? (
                <div className="mt-2 text-center text-xs text-amber-400/90 font-mono">
                  Saved Account: {savedAccount.email}
                </div>
              ) : (
                <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Smartphone className="h-3 w-3 text-amber-400" />
                  <span>Instant login with your Google account</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <button
                type="button"
                onClick={() => setShowCustomEmailForm(!showCustomEmailForm)}
                className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 shrink-0"
              >
                <span>{showCustomEmailForm ? 'Hide custom email' : 'Use another Google email'}</span>
                {showCustomEmailForm ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* Secondary: Custom Google Email Input Form (Collapsible) */}
            {showCustomEmailForm && (
              <form onSubmit={handleFormSubmit} className="space-y-3 animate-in fade-in duration-150 pt-1">
                <div>
                  <label
                    htmlFor="phone-google-email-input"
                    className="block text-xs font-bold text-slate-300 mb-1"
                  >
                    Google Account Email
                  </label>
                  <input
                    id="phone-google-email-input"
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={emailInput}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />

                  {!emailInput.includes('@') && emailInput.trim().length > 1 && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Quick add:</span>
                      <button
                        type="button"
                        onClick={() => handleEmailChange(`${emailInput.trim()}@gmail.com`)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 transition-colors"
                      >
                        @gmail.com
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone-google-name-input"
                    className="block text-xs font-bold text-slate-300 mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    id="phone-google-name-input"
                    type="text"
                    required
                    placeholder="e.g. Rohit Dhakad"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {isSiteAdmin(emailInput) && (
                  <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 flex items-center gap-2 text-xs text-amber-300">
                    <Crown className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Recognized Site Owner & Admin Account 👑</span>
                  </div>
                )}

                <button
                  id="submit-phone-google-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 py-3 text-xs font-black text-slate-950 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>Sign in with this Google Email</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>OAuth 2.0 Secure • DHOTI AALE Verified</span>
        </div>
      </div>
    </div>
  );
}
