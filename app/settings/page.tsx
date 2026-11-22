'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Lock,
  Shield,
  Bell,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type SettingsTab = 'profile' | 'privacy' | 'appearance' | 'security' | 'help';

export default function SettingsPage() {
  const { user, updateProfile, updatePassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Privacy Settings
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);

  // Password Update Fields
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');

      try {
        const priv = localStorage.getItem(`photogram_private_${user.id || user.username}`);
        if (priv) setIsPrivateAccount(JSON.parse(priv));
      } catch {}
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName.trim(),
      username: username.toLowerCase().trim(),
      bio,
      website,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  const handleTogglePrivate = () => {
    const nextVal = !isPrivateAccount;
    setIsPrivateAccount(nextVal);
    if (user) {
      try {
        localStorage.setItem(
          `photogram_private_${user.id || user.username}`,
          JSON.stringify(nextVal)
        );
      } catch {}
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    const res = await updatePassword(newPass);
    if (res.success) {
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassSuccess(false), 3000);
    } else {
      setPassError(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 md:my-8 px-4 select-none">
      <div className="border border-neutral-800 rounded-2xl bg-black overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-2xl">
        {/* Left Settings Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 p-4 space-y-1 shrink-0 bg-neutral-950">
          <h2 className="text-lg font-bold text-white px-3 py-2 mb-2">Settings</h2>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Account Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'help'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & About</span>
          </button>

          <div className="pt-6 border-t border-neutral-800 mt-4">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Right Settings Detail Column */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <p className="text-xs text-neutral-400 mt-1">Manage your public information on Photogram.</p>
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully! ✨</span>
                </div>
              )}

              {/* User Avatar Summary */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700">
                  <Image
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.username || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">{user?.username}</h4>
                  <p className="text-xs text-neutral-400">{user?.full_name}</p>
                </div>
                <Link
                  href="/profile"
                  className="ml-auto text-xs font-semibold text-[#0095f6] hover:underline"
                >
                  Change DP
                </Link>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600 resize-none"
                    placeholder="Tell your visual story..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Save changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Account Privacy</h3>
                <p className="text-xs text-neutral-400 mt-1">Control who can see your photos and visual stories.</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Private account</h4>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      When your account is private, only people you approve can see your photos and videos.
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePrivate}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                      isPrivateAccount ? 'bg-[#0095f6]' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        isPrivateAccount ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-white">Activity Status</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Allow accounts you follow to see when you were last active.</p>
                  </div>
                  <button
                    onClick={() => setActivityStatus(!activityStatus)}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                      activityStatus ? 'bg-[#0095f6]' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        activityStatus ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Appearance</h3>
                <p className="text-xs text-neutral-400 mt-1">Customize how Photogram looks on your device.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Dark Theme Option */}
                <div
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'border-[#0095f6] bg-neutral-900 ring-1 ring-[#0095f6]'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                  }`}
                >
                  <div className="w-full h-20 bg-black border border-neutral-800 rounded-xl mb-3 flex items-center justify-center">
                    <Moon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm text-white text-center">Dark Mode</h4>
                  <p className="text-[11px] text-neutral-400 text-center mt-0.5">OLED Black & Slate</p>
                </div>

                {/* Light Theme Option */}
                <div
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'border-[#0095f6] bg-neutral-900 ring-1 ring-[#0095f6]'
                      : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                  }`}
                >
                  <div className="w-full h-20 bg-neutral-100 border border-neutral-300 rounded-xl mb-3 flex items-center justify-center">
                    <Sun className="w-8 h-8 text-neutral-900" />
                  </div>
                  <h4 className="font-semibold text-sm text-white text-center">Light Mode</h4>
                  <p className="text-[11px] text-neutral-400 text-center mt-0.5">Clean White</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Password & Security</h3>
                <p className="text-xs text-neutral-400 mt-1">Update your password to keep your Photogram account safe.</p>
              </div>

              {passSuccess && (
                <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              {passError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-neutral-600"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Update password
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: HELP & ABOUT */}
          {activeTab === 'help' && (
            <div className="max-w-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Help & About</h3>
                <p className="text-xs text-neutral-400 mt-1">Information about the Photogram web platform.</p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Application Version</span>
                  <span className="font-semibold text-white">Photogram 2.4.0-prod</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Live Domain</span>
                  <span className="font-semibold text-sky-400">photogramweb.online</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Media CDN</span>
                  <span className="font-semibold text-white">Cloudinary Global CDN</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Database Engine</span>
                  <span className="font-semibold text-white">Supabase PostgreSQL</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Admin Panel</span>
                  <Link href="/admin" className="font-semibold text-[#0095f6] hover:underline">
                    Access /admin →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
