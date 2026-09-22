'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { VideoItem } from '@/types';
import { adminFetch, adminUploadFile } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface VideoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: VideoItem | null;
}

export function VideoForm({ isOpen, onClose, onSuccess, initialData }: VideoFormProps) {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Cultural Events 🎭',
    videoUrl: '',
    thumbnailUrl: '',
    description: '',
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Cultural Events 🎭',
        videoUrl: initialData.videoUrl || (initialData as any).video_url || '',
        thumbnailUrl: initialData.thumbnailUrl || (initialData as any).thumbnail_url || '',
        description: initialData.description || '',
        published: initialData.published !== false,
      });
    } else {
      setFormData({
        title: '',
        category: 'Cultural Events 🎭',
        videoUrl: '',
        thumbnailUrl: '',
        description: '',
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
      const res = await adminUploadFile(file, 'videos');
      if (res.success && res.publicUrl) {
        setFormData((prev) => ({ ...prev, thumbnailUrl: res.publicUrl! }));
        success('Thumbnail uploaded successfully to battle-image bucket');
      } else {
        toastError(res.error || 'Failed to upload thumbnail');
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toastError('Title and Video URL are required');
      return;
    }

    setIsSubmitting(true);
    const method = initialData?.id ? 'PUT' : 'POST';
    const payload = {
      ...formData,
      video_url: formData.videoUrl,
      thumbnail_url: formData.thumbnailUrl,
      id: initialData?.id,
    };

    const res = await adminFetch(`/api/admin/content?type=videos`, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      success(initialData ? 'Video updated successfully' : 'Video published successfully');
      onSuccess();
      onClose();
    } else {
      toastError(res.error || 'Failed to save video');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit Video Showcase' : 'Add Video to Showcase'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Video Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. ढोटी गाँव का ऐतिहासिक मंदिर दर्शन"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              >
                <option value="गाँव दर्शन">गाँव दर्शन (Village Tour)</option>
                <option value="उत्सव एवं मेले">उत्सव एवं मेले (Festivals)</option>
                <option value="सांस्कृतिक कार्यक्रम">सांस्कृतिक कार्यक्रम (Culture)</option>
                <option value="कृषि एवं पर्यावरण">कृषि एवं पर्यावरण (Farming)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Video URL (YouTube/MP4) *</label>
              <input
                type="text"
                required
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="https://youtu.be/... or MP4 link"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none leading-relaxed"
              placeholder="About video content, location..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Custom Thumbnail</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="Thumbnail URL or upload below..."
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
            {formData.thumbnailUrl && (
              <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={formData.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="video-published-check"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="video-published-check" className="text-slate-300 font-medium cursor-pointer">
              Visible on Video Showcase
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
              <span>{initialData ? 'Update Video' : 'Save Video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
