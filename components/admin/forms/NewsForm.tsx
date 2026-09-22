'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload, Check } from 'lucide-react';
import { NewsItem } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface NewsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: NewsItem | null;
}

export function NewsForm({ isOpen, onClose, onSuccess, initialData }: NewsFormProps) {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'गाँव समाचार',
    excerpt: '',
    content: '',
    imageUrl: '',
    author: 'DHOTI AALE सम्पादक',
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'गाँव समाचार',
        excerpt: initialData.excerpt || '',
        content: initialData.content || '',
        imageUrl: initialData.imageUrl || '',
        author: initialData.author || 'DHOTI AALE सम्पादक',
        published: initialData.published !== false,
      });
    } else {
      setFormData({
        title: '',
        category: 'गाँव समाचार',
        excerpt: '',
        content: '',
        imageUrl: '',
        author: 'DHOTI AALE सम्पादक',
        published: true,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'news');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (json.success && json.publicUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: json.publicUrl }));
        success('News image uploaded successfully');
      } else {
        toastError(json.error || 'Failed to upload image');
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    setIsSubmitting(true);
    const method = initialData?.id ? 'PUT' : 'POST';
    const payload = initialData?.id ? { ...formData, id: initialData.id } : formData;

    const res = await adminFetch(`/api/admin/content?type=news`, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      success(initialData ? 'News updated successfully' : 'News published successfully');
      onSuccess();
      onClose();
    } else {
      toastError(res.error || 'Failed to save news article');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit News Article' : 'Create News Article'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. ढोटी गाँव में नया सामुदायिक भवन प्रारंभ"
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
                <option value="गाँव समाचार">गाँव समाचार (Village News)</option>
                <option value="कृषि एवं मौसम">कृषि एवं मौसम (Agriculture)</option>
                <option value="शिक्षा एवं युवा">शिक्षा एवं युवा (Education)</option>
                <option value="विकास कार्य">विकास कार्य (Development)</option>
                <option value="सांस्कृतिक उत्सव">सांस्कृतिक उत्सव (Festivals)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Excerpt (Short Summary)</label>
            <input
              type="text"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="Brief summary for card preview..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Article Content</label>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none leading-relaxed"
              placeholder="Full article content in Hindi / English..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Featured Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="Image URL or upload below..."
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
            {formData.imageUrl && (
              <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="news-published-check"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="news-published-check" className="text-slate-300 font-medium cursor-pointer">
              Publish immediately on live portal
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
              <span>{initialData ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
