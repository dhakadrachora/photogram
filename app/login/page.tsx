'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  XCircle,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';

type AuthMode = 'login' | 'signup' | 'forgot';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, resetPassword, updatePassword, checkUsernameAvailability } = useAuth();

  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email, Phone, or Username
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Real-time Username availability state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message?: string;
  }>({
    checking: false,
    available: null,
  });

  // Reset Password Specific Fields
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const urlMode = searchParams.get('mode') as AuthMode;
    if (urlMode && ['login', 'signup', 'forgot'].includes(urlMode)) {
      setMode(urlMode);
    }
  }, [searchParams]);

  // Debounced real-time username availability check
  useEffect(() => {
    if (mode !== 'signup') return;
    const cleanUser = username.trim().toLowerCase();

    if (cleanUser.length < 3) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    setUsernameStatus({ checking: true, available: null });
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(cleanUser);
      setUsernameStatus({
        checking: false,
        available: res.available,
        message: res.available ? 'Username available' : res.reason || 'Username already taken',
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [username, mode, checkUsernameAvailability]);

  // Switch between Login, Signup, Forgot tabs
  const switchMode = (newMode: AuthMode) => {
    setError(null);
    setSuccessMsg(null);
    setResetSent(false);
    setMode(newMode);
  };

  // 1. Handle Real Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!identifier.trim() || !password) {
      setError('Please enter your phone number, username, or email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        setSuccessMsg('Logged in successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      } else {
        setError(res.error || 'Sorry, your password was incorrect. Please double-check your password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Real Sign Up (Create Real Account)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!identifier.trim()) {
      setError('Please provide a mobile number or email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (usernameStatus.available === false) {
      setError(usernameStatus.message || "This username isn't available. Please try another.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup(identifier, password, cleanUsername, fullName || cleanUsername);
      if (res.success) {
        setSuccessMsg(`Welcome @${cleanUsername}! Account created successfully.`);
        setTimeout(() => {
          window.location.href = '/';
        }, 400);
      } else {
        setError(res.error || 'Could not create account. Please try a different username.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Real Forgot Password Request
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetIdentifier.trim()) {
      setError('Please enter your email, phone, or username.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(resetIdentifier);
      if (res.success) {
        setResetSent(true);
        setSuccessMsg(res.message || 'Account found! You can now set your new password below.');
      } else {
        setError(res.error || 'No account found with that email or username.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error finding account.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Real Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccessMsg('Your password has been updated successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const isIdentifierValid = identifier.trim().length >= 3;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between items-center px-4 py-8 select-none">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex items-center justify-center gap-8 w-full max-w-4xl">
          {/* Left Side: Mock Phone Preview with Official App Icon (Desktop only) */}
          <div className="hidden lg:block relative w-[380px] h-[580px] shrink-0">
            <div className="w-full h-full rounded-[44px] border-4 border-[#262626] bg-neutral-950 p-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#262626] rounded-full z-20" />
              <div className="w-full h-full rounded-[34px] overflow-hidden relative bg-gradient-to-b from-neutral-900 via-black to-neutral-950 flex flex-col items-center justify-between p-6">
                {/* Status Bar */}
                <div className="w-full flex items-center justify-between text-[11px] text-neutral-400 font-semibold px-2 pt-2 z-10">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>5G</span>
                  </div>
                </div>

                {/* Centered Glowing Official App Icon */}
                <div className="flex flex-col items-center justify-center my-auto z-10">
                  <div className="relative group">
                    <div className="absolute -inset-6 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-3xl blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative w-44 h-44 rounded-[36px] overflow-hidden shadow-2xl ring-2 ring-white/20">
                      <Image
                        src="/app-logo.png"
                        alt="Photogram App Icon"
                        width={176}
                        height={176}
                        priority
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <h3 className="font-serif italic text-3xl font-normal text-white mt-6">Photogram</h3>
                  <p className="text-xs text-neutral-400 mt-1 tracking-wide">Capture • Share • Connect</p>
                </div>

                {/* Bottom App Card */}
                <div className="w-full bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-white text-center z-10">
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 bg-[#0095f6] rounded-full">
                    Live on photogramweb.online
                  </span>
                  <p className="text-sm font-bold mt-2">Pure Visual Web</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Real Accounts • Zero Bots • Instant Direct Chat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card Container */}
          <div className="w-full max-w-[350px] space-y-2.5">
            {/* Main Auth Box */}
            <div className="bg-black border border-[#262626] rounded-sm px-10 py-9 flex flex-col items-center">
              {/* MODE 1: LOGIN */}
              {mode === 'login' && (
                <>
                  {/* App Icon + Title */}
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/20">
                      <Image
                        src="/app-logo.png"
                        alt="Photogram"
                        width={56}
                        height={56}
                        priority
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <h1 className="text-3xl font-normal tracking-tight text-white font-serif italic select-none">
                      Photogram
                    </h1>
                  </div>

                  {/* Feedback Messages */}
                  {error && (
                    <div className="w-full bg-red-950/40 border border-red-800 text-red-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="w-full bg-green-950/40 border border-green-800 text-green-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="w-full space-y-2">
                    {/* Identifier */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Phone number, username, or email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500 transition-colors"
                      />
                    </div>

                    {/* Password with Show/Hide toggle */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white pl-2.5 pr-12 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500 transition-colors"
                      />
                      {password.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-white"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>

                    {/* Log in Button */}
                    <button
                      type="submit"
                      disabled={loading || !identifier.trim() || !password}
                      className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:hover:bg-[#0095f6] text-white text-xs font-semibold rounded-lg transition-colors mt-2"
                    >
                      {loading ? 'Logging in...' : 'Log in'}
                    </button>
                  </form>

                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="mt-6 text-[12px] text-neutral-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </>
              )}

              {/* MODE 2: SIGN UP (CREATE REAL NEW ACCOUNT) */}
              {mode === 'signup' && (
                <>
                  {/* App Icon + Title */}
                  <div className="flex flex-col items-center gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/20">
                      <Image
                        src="/app-logo.png"
                        alt="Photogram"
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <h1 className="text-3xl font-normal tracking-tight text-white font-serif italic select-none">
                      Photogram
                    </h1>
                  </div>

                  <p className="text-sm font-semibold text-neutral-400 text-center mb-4 leading-snug">
                    Sign up to see photos and visual stories from your friends.
                  </p>

                  {error && (
                    <div className="w-full bg-red-950/40 border border-red-800 text-red-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="w-full bg-green-950/40 border border-green-800 text-green-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignup} className="w-full space-y-2">
                    {/* Mobile or Email */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Mobile Number or Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500"
                      />
                      {isIdentifierValid && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white pl-2.5 pr-12 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500"
                      />
                      {password.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-white"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>

                    {/* Full Name */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500"
                      />
                    </div>

                    {/* Username with Real-time Unique Availability Checker */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className={`w-full bg-[#121212] border text-xs text-white pl-2.5 pr-8 py-2.5 rounded-sm outline-none placeholder:text-neutral-500 transition-colors ${
                          usernameStatus.available === true
                            ? 'border-green-600 focus:border-green-500'
                            : usernameStatus.available === false
                            ? 'border-red-600 focus:border-red-500'
                            : 'border-[#262626] focus:border-neutral-500'
                        }`}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {usernameStatus.checking ? (
                          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                        ) : usernameStatus.available === true ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : usernameStatus.available === false ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>

                    {/* Availability Status Message */}
                    {usernameStatus.message && (
                      <p
                        className={`text-[11px] font-medium px-1 ${
                          usernameStatus.available === true ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {usernameStatus.message}
                      </p>
                    )}

                    {/* Disclaimers */}
                    <p className="text-[10px] text-neutral-500 text-center leading-relaxed pt-1">
                      People who use our service may have uploaded your contact information to Photogram.{' '}
                      <span className="text-neutral-400 hover:underline cursor-pointer">Learn More</span>
                    </p>

                    <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                      By signing up, you agree to our{' '}
                      <span className="text-neutral-400 hover:underline cursor-pointer">Terms</span>,{' '}
                      <span className="text-neutral-400 hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                      <span className="text-neutral-400 hover:underline cursor-pointer">Cookies Policy</span>.
                    </p>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !identifier.trim() ||
                        !password ||
                        password.length < 6 ||
                        !username.trim() ||
                        usernameStatus.available === false
                      }
                      className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:hover:bg-[#0095f6] text-white text-xs font-semibold rounded-lg transition-colors mt-2"
                    >
                      {loading ? 'Creating account...' : 'Sign up'}
                    </button>
                  </form>
                </>
              )}

              {/* MODE 3: FORGOT PASSWORD / TROUBLE LOGGING IN */}
              {mode === 'forgot' && (
                <>
                  {/* Instagram Lock Icon Outline */}
                  <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Lock className="w-10 h-10 stroke-[1.4] text-white" />
                  </div>

                  <h2 className="text-base font-bold text-white mb-2">Trouble logging in?</h2>
                  <p className="text-xs text-neutral-400 text-center mb-4 leading-relaxed">
                    Enter your email, phone, or username and we&apos;ll send you a link to get back into your account.
                  </p>

                  {error && (
                    <div className="w-full bg-red-950/40 border border-red-800 text-red-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="w-full bg-green-950/40 border border-green-800 text-green-300 text-xs p-2.5 rounded-sm mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {!resetSent ? (
                    <form onSubmit={handleResetRequest} className="w-full space-y-3">
                      <input
                        type="text"
                        placeholder="Email, Phone, or Username"
                        value={resetIdentifier}
                        onChange={(e) => setResetIdentifier(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2.5 rounded-sm outline-none focus:border-neutral-500 placeholder:text-neutral-500"
                      />

                      <button
                        type="submit"
                        disabled={loading || !resetIdentifier.trim()}
                        className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 disabled:hover:bg-[#0095f6] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        {loading ? 'Searching account...' : 'Send login link'}
                      </button>
                    </form>
                  ) : (
                    /* Inline Instant Password Reset Form */
                    <form onSubmit={handleUpdatePassword} className="w-full space-y-2.5 mt-1 border-t border-[#262626] pt-3">
                      <p className="text-xs font-semibold text-[#0095f6] flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Enter New Password:</span>
                      </p>

                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="New Password (min 6 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2 rounded-sm outline-none focus:border-neutral-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#121212] border border-[#262626] text-xs text-white px-2.5 py-2 rounded-sm outline-none focus:border-neutral-500"
                      />

                      <button
                        type="submit"
                        disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        {loading ? 'Updating Password...' : 'Save Password & Log in'}
                      </button>
                    </form>
                  )}

                  {/* OR Divider */}
                  <div className="w-full flex items-center my-4">
                    <div className="flex-1 h-[1px] bg-[#262626]" />
                    <span className="px-4 text-[12px] font-semibold text-neutral-500">OR</span>
                    <div className="flex-1 h-[1px] bg-[#262626]" />
                  </div>

                  {/* Create New Account Link */}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-xs font-semibold text-white hover:text-neutral-300 transition-colors"
                  >
                    Create new account
                  </button>
                </>
              )}
            </div>

            {/* Bottom Sub-Card (Toggles between modes) */}
            <div className="bg-black border border-[#262626] rounded-sm py-5 text-center text-xs text-neutral-300">
              {mode === 'login' && (
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-[#0095f6] hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold text-[#0095f6] hover:underline"
                  >
                    Log in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </button>
              )}
            </div>

            {/* App Store Links */}
            <div className="pt-2 text-center text-xs text-neutral-400">
              <p className="mb-2.5">Get the app.</p>
              <div className="flex items-center justify-center gap-2">
                <div className="px-3 py-1.5 rounded-md bg-[#121212] border border-[#262626] text-[11px] font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                  Google Play
                </div>
                <div className="px-3 py-1.5 rounded-md bg-[#121212] border border-[#262626] text-[11px] font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                  App Store
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Official Footer */}
      <footer className="w-full max-w-4xl pt-8 pb-4 text-[11px] text-neutral-500 flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/privacy" className="hover:underline text-emerald-400 font-semibold">Privacy (Zero-Knowledge)</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <span className="hover:underline cursor-pointer">Help</span>
          <span className="hover:underline cursor-pointer">API</span>
          <span className="hover:underline cursor-pointer">Locations</span>
          <span className="hover:underline cursor-pointer">Photogram Lite</span>
          <span className="hover:underline cursor-pointer">Threads</span>
          <span className="hover:underline cursor-pointer">Meta Verified</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-500">
          <select className="bg-transparent border-none text-[11px] outline-none cursor-pointer">
            <option value="en" className="bg-neutral-900 text-white">English</option>
            <option value="hi" className="bg-neutral-900 text-white">हिन्दी</option>
            <option value="es" className="bg-neutral-900 text-white">Español</option>
          </select>
          <span>© 2026 Photogram from Meta</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white select-none">
          <h1 className="text-3xl font-serif italic mb-4">Photogram</h1>
          <div className="w-5 h-5 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
