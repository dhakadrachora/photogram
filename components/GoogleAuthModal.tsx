'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User } from '@/types';
import {
  X,
  Sparkles,
  Crown,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';
import {
  signUpWithEmail,
  signInWithEmail,
  sendPasswordResetEmail,
  updateUserPassword,
  isSupabaseConfigured,
} from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const AVATAR_PRESETS = [
  { id: 'dhoti-king', name: '👑 King', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-king' },
  { id: 'dhakad-warrior', name: '⚔️ Dhakad', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhakad-warrior' },
  { id: 'kisan-veer', name: '🌾 Farmer', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kisan-veer' },
  { id: 'dhoti-queen', name: '👸 Queen', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-queen' },
  { id: 'desi-bot', name: '🤖 Tech', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=desi-bot' },
];

export function GoogleAuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('reset-password')) {
        return 'reset';
      }
    }
    return 'login';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Password Reset Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Listen for recovery hash change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('reset-password')) {
        setMode('reset');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Reset fields when closing or switching mode
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    SoundEffects.playTabClick();
  };

  if (!isOpen) return null;

  // Sign in submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('कृपया अपना ईमेल पता दर्ज करें (Email is required).');
      return;
    }
    if (!password) {
      setErrorMessage('कृपया अपना पासवर्ड दर्ज करें (Password is required).');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmail({ email: cleanEmail, password });
      if (result.error) {
        if (result.error.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('ईमेल या पासवर्ड गलत है। कृपया जांचें या पासवर्ड रीसेट करें।');
        } else {
          setErrorMessage(result.error);
        }
        setIsLoading(false);
        return;
      }

      if (result.user) {
        SoundEffects.playSuccess();
        onLoginSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'लॉगिन करने में समस्या आई। पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage('कृपया अपना नाम दर्ज करें (Name is required).');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('कृपया वैध ईमेल पता दर्ज करें (Email is required).');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Minimum 6 characters).');
      return;
    }

    setIsLoading(true);
    try {
      const chosenAvatar = avatarUrl.trim() || (selectedPreset ? AVATAR_PRESETS.find(p => p.id === selectedPreset)?.url : undefined);

      const result = await signUpWithEmail({
        email: cleanEmail,
        password,
        name: cleanName,
        phone: phone.trim() || undefined,
        avatarUrl: chosenAvatar,
      });

      if (result.error) {
        if (result.error.toLowerCase().includes('already registered')) {
          setErrorMessage('यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।');
        } else {
          setErrorMessage(result.error);
        }
        setIsLoading(false);
        return;
      }

      if (result.user) {
        SoundEffects.playSuccess();
        onLoginSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'साइन-अप करने में समस्या आई।');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('कृपया अपना पंजीकृत ईमेल पता दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendPasswordResetEmail(cleanEmail);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        SoundEffects.playSuccess();
        setSuccessMessage('पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है! कृपया अपना ईमेल (Inbox या Spam) चेक करें।');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'रीसेट लिंक भेजने में समस्या आई।');
    } finally {
      setIsLoading(false);
    }
  };

  // New password submit (after recovery link)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('दोनों पासवर्ड मेल नहीं खाते हैं।');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserPassword(newPassword);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        SoundEffects.playSuccess();
        setSuccessMessage('पासवर्ड सफलतापूर्वक बदल दिया गया है! कृपया नए पासवर्ड से लॉगिन करें।');
        setTimeout(() => {
          switchMode('login');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'पासवर्ड अपडेट करने में समस्या आई।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          aria-label="Close auth modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20">
            <Crown className="h-7 w-7" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'login' && 'DHOTI AALE लॉगिन'}
            {mode === 'signup' && 'नया खाता बनाएं'}
            {mode === 'forgot' && 'पासवर्ड रीसेट करें'}
            {mode === 'reset' && 'नया पासवर्ड सेट करें'}
          </h3>

          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {mode === 'login' && 'ईमेल और पासवर्ड द्वारा सुरक्षित रूप से लॉगिन करें'}
            {mode === 'signup' && 'नाम, ईमेल और पासवर्ड दर्ज करें (फ़ोन और फ़ोटो वैकल्पिक हैं)'}
            {mode === 'forgot' && 'अपना पंजीकृत ईमेल दर्ज करें, हम रीसेट लिंक भेजेंगे'}
            {mode === 'reset' && 'अपने खाते के लिए नया सुरक्षित पासवर्ड दर्ज करें'}
          </p>

          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Supabase सुरक्षित ऑथेंटिकेशन</span>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ================= MODE 1: LOGIN ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ईमेल पता (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">पासवर्ड (Password)</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                >
                  पासवर्ड भूल गए?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>सत्यापन हो रहा है...</span>
                </>
              ) : (
                <span>लॉगिन करें (Sign In)</span>
              )}
            </button>

            {/* Switch to Sign Up */}
            <div className="pt-2 text-center border-t border-slate-800">
              <p className="text-xs text-slate-400">
                खाता नहीं है?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-amber-400 hover:text-amber-300 font-bold ml-1 hover:underline"
                >
                  नया खाता बनाएं (Sign Up)
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ================= MODE 2: SIGN UP ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            {/* Name Field (Required) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                पूरा नाम (Full Name) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="आपका पूरा नाम (Your Full Name)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Field (Required) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ईमेल पता (Email) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field (Required) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                पासवर्ड (Password) <span className="text-amber-400">* (न्यूनतम 6 अक्षर)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  फोन नंबर (Phone Number)
                </label>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  वैकल्पिक / Optional
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210 (वैकल्पिक)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Profile Photo / Avatar (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  प्रोफ़ाइल फ़ोटो / अवतार (Profile Photo)
                </label>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  वैकल्पिक / Optional
                </span>
              </div>

              {/* Avatar Preset Chips */}
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {AVATAR_PRESETS.map((p) => {
                  const isChosen = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(p.id);
                        setAvatarUrl(p.url);
                      }}
                      className={`p-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isChosen
                          ? 'border-amber-400 bg-amber-500/20 shadow-sm'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <Image
                        src={p.url}
                        alt={p.name}
                        width={28}
                        height={28}
                        className="rounded-lg object-cover bg-slate-800"
                      />
                      <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Or custom URL */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Camera className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="फ़ोटो URL (उदा. https://...)"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Note on Passwords */}
            <p className="text-[10px] text-slate-400 leading-tight">
              🔒 <span className="font-semibold text-slate-300">गोपनीयता सुरक्षा:</span> पासवर्ड एन्क्रिप्टेड रहता है और कभी भी किसी के साथ साझा नहीं होता।
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>खाता बनाया जा रहा है...</span>
                </>
              ) : (
                <span>Create Account / Save (खाता बनाएं)</span>
              )}
            </button>

            {/* Back to Login */}
            <div className="pt-2 text-center border-t border-slate-800">
              <p className="text-xs text-slate-400">
                पहले से खाता है?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-amber-400 hover:text-amber-300 font-bold ml-1 hover:underline"
                >
                  लॉगिन करें (Sign In)
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ================= MODE 3: FORGOT PASSWORD ================= */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                पंजीकृत ईमेल पता (Registered Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>लिंक भेजा जा रहा है...</span>
                </>
              ) : (
                <span>रीसेट लिंक भेजें (Send Reset Link)</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>वापस लॉगिन पर जाएं</span>
            </button>
          </form>
        )}

        {/* ================= MODE 4: RESET PASSWORD ================= */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                नया पासवर्ड (New Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="न्यूनतम 6 अक्षर"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                पासवर्ड दोबारा दर्ज करें (Confirm Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="वही पासवर्ड दोबारा दर्ज करें"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>पासवर्ड बदला जा रहा है...</span>
                </>
              ) : (
                <span>नया पासवर्ड सुरक्षित करें</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default GoogleAuthModal;
