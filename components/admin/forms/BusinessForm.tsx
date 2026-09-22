'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { BusinessItem } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface BusinessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BusinessItem | null;
}

export function BusinessForm({ isOpen, onClose, onSuccess, initialData }: BusinessFormProps) {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'दुकान एवं व्यापार',
    phone: '',
    address: 'ढोटी, राजस्थान',
    description: '',
    logoUrl: '',
    verified: true,
    published: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'दुकान एवं व्यापार',
        phone: initialData.phone || '',
        address: initialData.address || 'ढोटी, राजस्थान',
        description: initialData.description || '',
        logoUrl: initialData.logoUrl || '',
        verified: initialData.verified !== false,
        published: initialData.published !== false,
      });
    } else {
      setFormData({
        name: '',
        category: 'दुकान एवं व्यापार',
        phone: '',
        address: 'ढोटी, राजस्थान',
        description: '',
        logoUrl: '',
        verified: true,
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
    body.append('folder', 'business');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (json.success && json.publicUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: json.publicUrl }));
        success('Business logo uploaded successfully');
      } else {
        toastError(json.error || 'Failed to upload logo');
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
      toastError('Business name is required');
      return;
    }

    setIsSubmitting(true);
    const method = initialData?.id ? 'PUT' : 'POST';
    const payload = {
      ...formData,
      logo_url: formData.logoUrl,
      id: initialData?.id,
    };

    const res = await adminFetch(`/api/admin/content?type=business`, {
      method,
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (res.success) {
      success(initialData ? 'Business updated successfully' : 'Business created successfully');
      onSuccess();
      onClose();
    } else {
      toastError(res.error || 'Failed to save business');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit Business Entry' : 'Add Village Business'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. धाकड़ जनरल स्टोर / किसान सेवा केंद्र"
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
                <option value="दुकान एवं व्यापार">दुकान एवं व्यापार (Retail)</option>
                <option value="कृषि एवं खाद-बीज">कृषि एवं खाद-बीज (Agri Store)</option>
                <option value="निर्माण एवं हार्डवेयर">निर्माण एवं हार्डवेयर (Hardware)</option>
                <option value="डेयरी एवं पशुपालन">डेयरी एवं पशुपालन (Dairy)</option>
                <option value="सेवाएं एवं कारीगर">सेवाएं एवं कारीगर (Services)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Address / Location</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              placeholder="e.g. मुख्य बाजार, ढोटी"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none leading-relaxed"
              placeholder="Items available, timings, specialty..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Logo / Store Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
                placeholder="Logo URL or upload below..."
              />
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>
            {formData.logoUrl && (
              <div className="mt-2 w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <img src={formData.logoUrl} alt="Store logo" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Verified Village Business Badge ✓</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Active on Directory</span>
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
              <span>{initialData ? 'Update Business' : 'Save Business'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
