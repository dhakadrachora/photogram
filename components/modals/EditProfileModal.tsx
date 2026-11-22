'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Camera, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile, checkUsernameAvailability } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real DP Upload from User's Device / Gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Fast FileReader preview + persistent base64 / Cloudinary upload
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);

        // Also upload to Cloudinary in background if available
        try {
          const res = await uploadToCloudinary(file);
          if (res?.secure_url) {
            setAvatarUrl(res.secure_url);
            updateProfile({ avatar_url: res.secure_url });
          } else {
            updateProfile({ avatar_url: dataUrl });
          }
        } catch {
          updateProfile({ avatar_url: dataUrl });
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setIsSaving(true);

    const cleanUser = username.toLowerCase().trim();
    if (!cleanUser || cleanUser.length < 3) {
      setIsSaving(false);
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    // Check if another user already owns this username
    if (cleanUser !== user?.username?.toLowerCase()) {
      const check = await checkUsernameAvailability(cleanUser, user?.id);
      if (!check.available) {
        setIsSaving(false);
        setUsernameError(check.reason || 'This username is already taken. Please choose another.');
        return;
      }
    }

    const res = await updateProfile({
      username: cleanUser,
      full_name: name.trim(),
      bio,
      website,
      avatar_url: avatarUrl,
    });

    setIsSaving(false);
    if (!res.success) {
      setUsernameError(res.error || 'Failed to update profile.');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#262626] border border-neutral-700 rounded-2xl p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="font-semibold text-base">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Profile updated successfully! ✨</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Avatar & Photo Upload Section */}
          <div className="flex items-center gap-4 bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold text-white">Profile Photo (DP)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload New Photo'}</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white outline-none focus:border-[#0095f6]"
            />
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                if (usernameError) setUsernameError(null);
              }}
              placeholder="username"
              className={`w-full px-3 py-2 bg-neutral-900 border rounded-lg text-xs text-white outline-none ${
                usernameError ? 'border-red-500 focus:border-red-400' : 'border-neutral-700 focus:border-[#0095f6]'
              }`}
            />
            {usernameError && (
              <p className="text-[11px] text-red-400 font-medium mt-1">
                {usernameError}
              </p>
            )}
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a bio..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white outline-none focus:border-[#0095f6] resize-none"
            />
          </div>

          {/* Website Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white outline-none focus:border-[#0095f6]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-5 py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
