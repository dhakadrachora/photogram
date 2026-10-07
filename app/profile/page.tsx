'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Crown,
  Coins,
  Trophy,
  Swords,
  ShieldCheck,
  Edit3,
  LogOut,
  Sparkles,
  Settings,
  HelpCircle,
  Gift,
  CheckCircle2,
  Share2,
  Camera,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { useAuth } from '@/components/providers/AuthProvider';
import { updateUserProfileDetails } from '@/lib/supabase';
import { isSiteAdmin } from '@/lib/admin-auth';

const AVATAR_PRESETS = [
  { id: 'dhoti1', name: 'धोती किंग 👑', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-king' },
  { id: 'dhoti2', name: 'देसी रॉकर ⚡', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=desi-rocker' },
  { id: 'dhoti3', name: 'सरपंच साहब 🎖️', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarpanch-sahab' },
  { id: 'dhoti4', name: 'रैप उस्ताद 🎤', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rap-ustaad' },
  { id: 'dhoti5', name: 'गाँव का शेर 🦁', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=gaon-ka-sher' },
];

export default function ProfilePage() {
  const { currentUser, logout, openAuthModal, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-[#0B1220] border border-white/10 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <UserIcon className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white font-hindi mb-2">
            लॉगिन आवश्यक है
          </h2>

          <p className="text-xs text-slate-400 mb-6 font-hindi leading-relaxed">
            अपनी प्रोफ़ाइल देखने, Dhoti Coins बैलेंस चेक करने और बैटल में हिस्सा लेने के लिए कृपया लॉगिन करें।
          </p>

          <button
            onClick={openAuthModal}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            अभी लॉगिन करें (Login)
          </button>
        </div>
      </AppShell>
    );
  }

  const isAdmin = currentUser.isAdmin || isSiteAdmin(currentUser.email);
  const coins = currentUser.coins ?? 50;
  const wins = currentUser.wins ?? 0;
  const battles = currentUser.battles ?? 0;
  const username = `@${currentUser.email.split('@')[0] || 'dhoti_user'}`;

  // Level & XP based on coins and wins
  const xp = (wins * 100) + (coins * 2);
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  const currentLevelXP = xp % 200;
  const xpProgress = Math.min(100, Math.round((currentLevelXP / 200) * 100));

  const handleOpenEdit = () => {
    setEditName(currentUser.name);
    setEditPhone(currentUser.phone || '');
    setEditAvatar(currentUser.avatar);
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    try {
      const cleanName = editName.trim() || currentUser.name;
      const cleanPhone = editPhone.trim() || null;
      const cleanAvatar = editAvatar.trim() || currentUser.avatar;

      const result = await updateUserProfileDetails(currentUser.id, {
        name: cleanName,
        phone: cleanPhone,
        avatar: cleanAvatar,
      });

      if (!result.success) {
        setSaveError(result.error || 'प्रोफ़ाइल अपडेट विफल रहा।');
        return;
      }

      updateUser({
        name: cleanName,
        phone: cleanPhone || undefined,
        avatar: cleanAvatar,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 1200);
    } catch (err: any) {
      setSaveError(err?.message || 'समस्या आई।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('क्या आप सचमुच लॉगआउट करना चाहते हैं?')) {
      await logout();
      router.push('/');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header Card */}
        <div className="relative rounded-3xl overflow-hidden bg-[#0B1220] border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Glow Ring */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-800 ring-4 ring-cyan-500/40 p-1 shadow-xl">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                      currentUser.id
                    )}`
                  }
                  alt={currentUser.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <button
                onClick={handleOpenEdit}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition-all active:scale-95"
                title="Edit Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {currentUser.name}
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>निवासी</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {username} • {currentUser.email}
              </div>

              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-slate-300 border border-white/5">
                  {currentUser.badge || (isAdmin ? 'Site Owner & Admin 👑' : 'Dhoti Resident 🏅')}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Level & XP Bar */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level {level} Resident</span>
              </span>
              <span className="text-slate-400 font-mono">
                {currentLevelXP} / 200 XP ({xpProgress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#070B14] overflow-hidden border border-white/5">
              <div
                style={{ width: `${xpProgress}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/rewards"
            className="p-4 rounded-2xl bg-[#0B1220] border border-white/10 hover:border-amber-400/30 text-center transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-1 text-sm">
              🪙
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono block">
              {coins.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-hindi">
              Dhoti Coins
            </span>
          </Link>

          <Link
            href="/battle"
            className="p-4 rounded-2xl bg-[#0B1220] border border-white/10 hover:border-red-400/30 text-center transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-1 text-sm">
              ⚔️
            </div>
            <span className="text-xl sm:text-2xl font-black text-white font-mono block">
              {wins}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-hindi">
              Battles Won
            </span>
          </Link>

          <div className="p-4 rounded-2xl bg-[#0B1220] border border-white/10 text-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-1 text-sm">
              🏆
            </div>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono block">
              {isAdmin ? '5' : '2'}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-hindi">
              Badges
            </span>
          </div>
        </div>

        {/* Menu Options */}
        <div className="rounded-3xl bg-[#0B1220] border border-white/10 divide-y divide-white/5 overflow-hidden">
          <button
            onClick={handleOpenEdit}
            className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">Edit Profile</span>
            </div>
            <span className="text-xs text-slate-500">बदलें →</span>
          </button>

          <Link
            href="/battle"
            className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <Swords className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">My Battles</span>
            </div>
            <span className="text-xs text-slate-500">देखें →</span>
          </Link>

          <Link
            href="/rewards"
            className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">My Rewards</span>
            </div>
            <span className="text-xs text-slate-500">रिडीम →</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-300">Admin Dashboard</span>
                  <span className="text-[10px] text-amber-400/80 block">सुपर एडमिन नियंत्रण कक्ष</span>
                </div>
              </div>
              <span className="text-xs text-amber-400 font-bold">खोलें →</span>
            </Link>
          )}

          <Link
            href="/support"
            className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white">Help & Support</span>
            </div>
            <span className="text-xs text-slate-500">मदद →</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-red-500/5 transition-colors text-red-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">लॉगआउट करें (Logout)</span>
            </div>
            <span className="text-xs text-red-400">बाहर निकलें →</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0B1220] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-lg font-hindi">
                प्रोफ़ाइल संपादित करें (Edit Profile)
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>सफलतापूर्वक सहेजा गया!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  आपका नाम:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  मोबाइल नंबर (वैकल्पिक):
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D1726] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  देसी अवतार चुनें:
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setEditAvatar(preset.url)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                        editAvatar === preset.url
                          ? 'border-cyan-400 scale-105 ring-2 ring-cyan-400/30'
                          : 'border-white/10 opacity-70'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 font-semibold text-xs border border-white/10"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>सहेजें (Save)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
