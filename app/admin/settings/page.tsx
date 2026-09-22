'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, Loader2, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

export default function AdminSettingsPage() {
  const { success, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    site_title: 'DHOTI AALE',
    site_tagline: 'राजस्थान का पहला डिजिटल गाँव समुदाय',
    hero_badge: 'Pure Desi Vibe • 100% Real Community 👑',
    contact_email: 'rohitdhakaddhoti143@gmail.com',
    announcement_banner: '',
    is_announcement_active: true,
    allow_world_chat: true,
    allow_guest_ai: true,
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/admin/content?type=settings');
    setIsLoading(false);

    if (res.success && res.data) {
      setFormData({
        site_title: res.data.site_title || 'DHOTI AALE',
        site_tagline: res.data.site_tagline || 'राजस्थान का पहला डिजिटल गाँव समुदाय',
        hero_badge: res.data.hero_badge || 'Pure Desi Vibe • 100% Real Community 👑',
        contact_email: res.data.contact_email || 'rohitdhakaddhoti143@gmail.com',
        announcement_banner: res.data.announcement_banner || '',
        is_announcement_active: res.data.is_announcement_active ?? true,
        allow_world_chat: res.data.allow_world_chat ?? true,
        allow_guest_ai: res.data.allow_guest_ai ?? true,
      });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res = await adminFetch('/api/admin/content?type=settings', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });

    setIsSaving(false);

    if (res.success) {
      success('Site settings updated in production database');
    } else {
      toastError(res.error || 'Failed to save settings');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            <span>Portal Global Settings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure metadata, public announcement banners, and site-wide feature flags.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading site settings...</div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Site Title *</label>
            <input
              type="text"
              required
              value={formData.site_title}
              onChange={(e) => setFormData({ ...formData, site_title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
            <input
              type="text"
              value={formData.site_tagline}
              onChange={(e) => setFormData({ ...formData, site_tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hero Badge Text</label>
            <input
              type="text"
              value={formData.hero_badge}
              onChange={(e) => setFormData({ ...formData, hero_badge: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Administrative Contact Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Announcement Banner (Top of Site)</label>
            <textarea
              rows={2}
              value={formData.announcement_banner}
              onChange={(e) => setFormData({ ...formData, announcement_banner: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 leading-relaxed"
              placeholder="Leave empty or type custom headline banner..."
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Community Feature Flags
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.is_announcement_active}
                onChange={(e) => setFormData({ ...formData, is_announcement_active: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Enable Top Announcement Banner</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.allow_world_chat}
                onChange={(e) => setFormData({ ...formData, allow_world_chat: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Allow World Chat messaging</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.allow_guest_ai}
                onChange={(e) => setFormData({ ...formData, allow_guest_ai: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Allow Guest AI voice & chat interaction</span>
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Portal Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
