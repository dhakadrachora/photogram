'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Plus, Trash2, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { CommunityUpdate } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

export default function AdminNotificationsPage() {
  const { success, error: toastError } = useToast();
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tag, setTag] = useState('सूचना');
  const [badgeColor, setBadgeColor] = useState<'amber' | 'emerald' | 'blue' | 'rose'>('amber');
  const [linkUrl, setLinkUrl] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/admin/content?type=updates&limit=50');
    setIsLoading(false);

    if (res.success && res.data) {
      setUpdates(res.data);
    } else {
      toastError(res.error || 'Failed to fetch announcements');
    }
  }, [toastError]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError('Title is required');
      return;
    }

    setIsSaving(true);
    const res = await adminFetch('/api/admin/content?type=updates', {
      method: 'POST',
      body: JSON.stringify({
        title,
        summary,
        tag,
        badge_color: badgeColor,
        link_url: linkUrl || null,
        published: true,
        date: new Date().toLocaleDateString('hi-IN'),
      }),
    });
    setIsSaving(false);

    if (res.success) {
      success('Announcement published to Dhoti portal');
      setIsModalOpen(false);
      setTitle('');
      setSummary('');
      setLinkUrl('');
      fetchUpdates();
    } else {
      toastError(res.error || 'Failed to publish announcement');
    }
  };

  const handleTogglePublish = async (item: CommunityUpdate) => {
    const newStatus = !item.published;
    const res = await adminFetch('/api/admin/content?type=updates', {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, published: newStatus }),
    });

    if (res.success) {
      success(`Announcement visibility updated`);
      setUpdates((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, published: newStatus } : u))
      );
    } else {
      toastError(res.error || 'Could not update publication state');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=updates&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Announcement removed');
      fetchUpdates();
    } else {
      toastError(res.error || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Village Announcements & Ticker</h2>
          <p className="text-xs text-slate-400">Broadcast important alerts, festival news, and village notices.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading announcements...</div>
      ) : updates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No active announcements. Broadcast your first notice above.
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      item.badgeColor === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.badgeColor === 'rose'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {item.tag || 'Notice'}
                  </span>
                  <span className="font-bold text-white text-xs">{item.title}</span>
                </div>
                {item.summary && <p className="text-xs text-slate-400">{item.summary}</p>}
                <div className="text-[10px] text-slate-500 font-mono">Date: {item.date || 'Recent'}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                    item.published
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span>{item.published ? 'Live' : 'Draft'}</span>
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Broadcast Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  placeholder="e.g. गाँव में कल सुबह 10 बजे विशेष ग्राम सभा"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Color Style</label>
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  >
                    <option value="amber">Amber (General)</option>
                    <option value="emerald">Green (Good News)</option>
                    <option value="rose">Red (Urgent Alert)</option>
                    <option value="blue">Blue (Notice)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Details</label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 leading-relaxed"
                  placeholder="Additional information for residents..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Broadcast Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Announcement"
        message="Are you sure you want to delete this notice?"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
