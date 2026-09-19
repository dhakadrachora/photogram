'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User, AppTab } from '@/types';
import {
  Coins,
  Trophy,
  Swords,
  ShieldCheck,
  Sparkles,
  LogOut,
  LogIn,
  Share2,
  Flame,
  Award,
  ArrowLeft,
  Crown,
  Smartphone,
  Edit3,
  Phone,
  Camera,
  X,
  Check,
  Loader2,
  Save,
  User as UserIcon,
} from 'lucide-react';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { PWAInstallButton } from './PWAInstallButton';
import { updateUserProfileDetails } from '@/lib/supabase';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: AppTab) => void;
  onUpdateUser?: (updated: Partial<User> | ((prev: User) => User)) => void;
}

const AVATAR_PRESETS = [
  { id: 'dhoti1', name: 'धोती किंग', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-king' },
  { id: 'dhoti2', name: 'देसी रॉकर', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=desi-rocker' },
  { id: 'dhoti3', name: 'सरपंच साहब', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarpanch-sahab' },
  { id: 'dhoti4', name: 'रैप उस्ताद', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rap-ustaad' },
  { id: 'dhoti5', name: 'गाँव का शेर', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=gaon-ka-sher' },
];

export function ProfileView({
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateTab,
  onUpdateUser,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleShare = () => {
    SoundEffects.playBell();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('DHOTI AALE invite link copied! Apne doston ke sath share karo! 🚀');
    }
  };

  const handleOpenEdit = () => {
    if (!currentUser) return;
    setEditName(currentUser.name || '');
    setEditPhone(currentUser.phone || '');
    setEditAvatar(currentUser.avatar || '');
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
    SoundEffects.playTap();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      const cleanName = editName.trim() || currentUser.name;
      const cleanPhone = editPhone.trim() || null;
      const cleanAvatar = editAvatar.trim() || currentUser.avatar;

      // 1. Update in Supabase
      const result = await updateUserProfileDetails(currentUser.id, {
        name: cleanName,
        phone: cleanPhone,
        avatar: cleanAvatar,
      });

      if (!result.success && result.error) {
        setSaveError(result.error);
        setIsSaving(false);
        return;
      }

      // 2. Update local state
      onUpdateUser?.({
        name: cleanName,
        phone: cleanPhone || undefined,
        avatar: cleanAvatar,
      });

      SoundEffects.playSuccess();
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 700);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#07080c]">
        <div className="max-w-md w-full rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <Crown className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Your Dhoti Aale Profile</h2>
          <p className="text-sm text-slate-400 mt-2">
            Sign in to your account to view your Dhoti Coins, battle trophies, rank badges, and chat history.
          </p>
          <button
            onClick={onOpenAuth}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-6 shadow-xl transition-all"
          >
            <LogIn className="h-5 w-5 text-slate-950" />
            <span>लॉगिन / साइन-अप करें (Sign In)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#07080c] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => onNavigateTab('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>

        {/* Profile Card Header */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="relative shrink-0">
              <Image
                src={currentUser.avatar}
                alt={currentUser.name}
                width={96}
                height={96}
                referrerPolicy="no-referrer"
                className="h-24 w-24 rounded-full object-cover border-4 border-amber-400 shadow-xl"
              />
              <button
                onClick={handleOpenEdit}
                title="Change Photo / Edit Profile"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs border-2 border-slate-900 shadow transition-transform hover:scale-110"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{currentUser.name}</h1>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40">
                  {currentUser.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{currentUser.email}</p>
              
              {/* Phone number badge if provided */}
              {currentUser.phone ? (
                <p className="text-xs text-amber-300/90 mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                  <Phone className="h-3.5 w-3.5 text-amber-400" />
                  <span>{currentUser.phone}</span>
                </p>
              ) : (
                <button
                  onClick={handleOpenEdit}
                  className="text-[11px] text-slate-500 hover:text-amber-400 mt-1.5 inline-flex items-center gap-1 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  <span>+ Add phone number</span>
                </button>
              )}

              {/* Stats Bar */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">{currentUser.coins}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Dhoti Coins</div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">{currentUser.wins}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Battle Wins</div>
                </div>
                <div className="rounded-2xl bg-slate-950/80 p-3 border border-slate-800 text-center">
                  <div className="text-xl sm:text-2xl font-black text-sky-400">{currentUser.battles}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Total Battles</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {/* Edit Profile Button */}
              <button
                onClick={handleOpenEdit}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-400 border border-amber-500/30 transition-colors shadow-sm"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Profile</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Launchpad to Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigateTab('worldchat')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                💬
              </div>
              <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Open →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Enter World Chat</h3>
            <p className="text-xs text-slate-400 mt-1">Talk live with verified Dhoti Aale members.</p>
          </button>

          <button
            onClick={() => onNavigateTab('battle')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-fuchsia-500/30 hover:border-fuchsia-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                ⚔️
              </div>
              <span className="text-xs font-bold text-fuchsia-400 group-hover:translate-x-1 transition-transform">
                Fight →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Live Battle Arena</h3>
            <p className="text-xs text-slate-400 mt-1">Compete in rap and roast clashes to earn +100 Coins.</p>
          </button>

          <button
            onClick={() => onNavigateTab('assistant')}
            className="p-5 rounded-2xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-400 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                🎙️
              </div>
              <span className="text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
                Talk →
              </span>
            </div>
            <h3 className="font-bold text-white text-base">Talk to AI Assistant</h3>
            <p className="text-xs text-slate-400 mt-1">Voice and text chat with witty desi buddy.</p>
          </button>
        </div>

        {/* App Installation & Live Updates Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-white">DHOTI AALE Mobile App</h4>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  PWA v1.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                अपने मोबाइल में इंस्टॉल करें और कभी भी नया अपडेट आने पर 1-क्लिक में रिफ्रेश करें।
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[220px]">
            <PWAInstallButton variant="profile" />
          </div>
        </div>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close edit profile modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Edit Profile</h3>
                <p className="text-xs text-slate-400">Add or change phone number and profile photo</p>
              </div>
            </div>

            {/* Error Message */}
            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {saveError}
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Photo Preview & Avatar Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  प्रोफ़ाइल फ़ोटो (Profile Photo)
                </label>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative shrink-0">
                    <Image
                      src={editAvatar || currentUser.avatar}
                      alt={editName || currentUser.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-2xl object-cover bg-slate-800 border-2 border-amber-400 shadow"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-400 block mb-1">फ़ोटो URL दर्ज करें या नीचे से चुनें:</span>
                    <input
                      type="url"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Avatar Presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {AVATAR_PRESETS.map((p) => {
                    const isChosen = editAvatar === p.url;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setEditAvatar(p.url);
                          SoundEffects.playTap();
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isChosen
                            ? 'border-amber-400 bg-amber-500/20 shadow-sm'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                        }`}
                      >
                        <Image
                          src={p.url}
                          alt={p.name}
                          width={32}
                          height={32}
                          className="rounded-lg object-cover bg-slate-800"
                        />
                        <span className="text-[9px] font-bold text-slate-300 truncate w-full text-center">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  पूरा नाम (Full Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="उदा. रोहित धाकड़"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Phone Number Field */}
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
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons: Save & Cancel */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

