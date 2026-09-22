'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { PersonProfile } from '@/types';
import { adminFetch, adminUploadFile } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface PeopleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: PersonProfile | null;
}

export function PeopleForm({ isOpen, onClose, onSuccess, initialData }: PeopleFormProps) {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    category: 'Gram Panchayat 🏛️',
    bio: '',
    photoUrl: '',
    achievements: '',
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        designation: initialData.designation || '',
        category: initialData.category || 'Gram Panchayat 🏛️',
        bio: initialData.bio || '',
        photoUrl: initialData.photoUrl || '',
        achievements: initialData.achievements || '',
        published: initialData.published !== false,
      });
    } else {
      setFormData({
        name: '',
        designation: '',
        category: 'Gram Panchayat 🏛️',
        bio: '',
        photoUrl: '',
        achievements: '',
        published: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminUploadFile(file, 'people');
      if (res.success && res.publicUrl) {
        setFormData((prev) => ({ ...prev, photoUrl: res.publicUrl! }));
        success('Profile photo uploaded successfully to battle-image bucket');
      } else {
        toastError(res.error || 'Failed to upload photo');
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastError('Name is required');
      return;
    }

    setIsSubmitting(true);
    const method = initialData?.id ? 'PUT' : 'POST';
    const payload = {
      ...formData,
      photo_url: formData.photoUrl,
      id: initialData?.id,
    };

    const res = await adminFetch(`/api/admin/content?type=people`, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      success(initialData ? 'Profile updated successfully' : 'Person added successfully');
      onSuccess();
      onClose();
    } else {
      toastError(res.error || 'Failed to save profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit Person Profile' : 'Add Person (Hall of Fame)'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. सरपंच साहब / राम सिंह जी"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Designation / Role</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="e.g. समाज सेवी / ग्राम प्रधान"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              >
                <option value="सम्मानित व्यक्तित्व">सम्मानित व्यक्तित्व</option>
                <option value="ग्राम पंचायत प्रतिनिधि">ग्राम पंचायत प्रतिनिधि</option>
                <option value="युवा प्रेरक">युवा प्रेरक</option>
                <option value="वरिष्ठ नागरिक">वरिष्ठ नागरिक</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bio / Description</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none leading-relaxed"
              placeholder="About contributions and village service..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Key Achievements</label>
            <input
              type="text"
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. 25 वर्षों से समाज सेवा, जल संरक्षण में योगदान"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Photo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="Photo URL or upload below..."
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
            {formData.photoUrl && (
              <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500 bg-slate-950">
                <img src={formData.photoUrl} alt="Photo Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="people-published-check"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="people-published-check" className="text-slate-300 font-medium cursor-pointer">
              Visible publicly in Hall of Fame
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-slate-950 bg-amber-500 hover:bg-amber-400 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{initialData ? 'Update Profile' : 'Save Person'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
