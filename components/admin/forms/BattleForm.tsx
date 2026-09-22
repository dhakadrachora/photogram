'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload, Swords } from 'lucide-react';
import { BattleEvent } from '@/types';
import { adminFetch, adminUploadFile } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface BattleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BattleEvent | null;
}

export function BattleForm({ isOpen, onClose, onSuccess, initialData }: BattleFormProps) {
  const { success, error: toastError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingA, setIsUploadingA] = useState(false);
  const [isUploadingB, setIsUploadingB] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Community Clash ⚔️',
    description: 'Vote for your favorite!',
    published: true,
    durationHours: 72,
    optionA: {
      id: 'option_a',
      label: '',
      tagline: '',
      emoji: '🔥',
      imageUrl: '',
    },
    optionB: {
      id: 'option_b',
      label: '',
      tagline: '',
      emoji: '⚡',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Community Clash ⚔️',
        description: initialData.description || 'Vote for your favorite!',
        published: initialData.published !== false,
        durationHours: 72,
        optionA: {
          id: initialData.optionA?.id || 'option_a',
          label: initialData.optionA?.label || '',
          tagline: initialData.optionA?.tagline || '',
          emoji: initialData.optionA?.emoji || '🔥',
          imageUrl: initialData.optionA?.imageUrl || '',
        },
        optionB: {
          id: initialData.optionB?.id || 'option_b',
          label: initialData.optionB?.label || '',
          tagline: initialData.optionB?.tagline || '',
          emoji: initialData.optionB?.emoji || '⚡',
          imageUrl: initialData.optionB?.imageUrl || '',
        },
      });
    } else {
      setFormData({
        title: '',
        category: 'Community Clash ⚔️',
        description: 'Vote for your favorite!',
        published: true,
        durationHours: 72,
        optionA: {
          id: `option_a_${Date.now()}`,
          label: '',
          tagline: '',
          emoji: '🔥',
          imageUrl: '',
        },
        optionB: {
          id: `option_b_${Date.now()}`,
          label: '',
          tagline: '',
          emoji: '⚡',
          imageUrl: '',
        },
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (side: 'A' | 'B', file: File) => {
    const isA = side === 'A';
    if (isA) setIsUploadingA(true);
    else setIsUploadingB(true);

    try {
      const res = await adminUploadFile(file, 'battles');
      if (res.success && res.publicUrl) {
        if (isA) {
          setFormData((prev) => ({
            ...prev,
            optionA: { ...prev.optionA, imageUrl: res.publicUrl! },
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            optionB: { ...prev.optionB, imageUrl: res.publicUrl! },
          }));
        }
        success(`Option ${side} image uploaded successfully to battle-image bucket`);
      } else {
        toastError(res.error || `Failed to upload Option ${side} image`);
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      if (isA) setIsUploadingA(false);
      else setIsUploadingB(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Battle title is required');
      return;
    }
    if (!formData.optionA.label.trim() || !formData.optionB.label.trim()) {
      toastError('Labels for both Option A and Option B are required');
      return;
    }

    setIsSubmitting(true);

    const now = Date.now();
    const durationMs = formData.durationHours * 60 * 60 * 1000;

    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      published: formData.published,
      optionA: formData.optionA,
      optionB: formData.optionB,
      startsAt: now,
      endsAt: now + durationMs,
      durationMinutes: formData.durationHours * 60,
    };

    let res;
    if (initialData?.id) {
      res = await adminFetch('/api/battles', {
        method: 'PUT',
        body: JSON.stringify({
          id: initialData.id,
          updates: {
            title: formData.title,
            category: formData.category,
            description: formData.description,
            published: formData.published,
          },
        }),
      });
    } else {
      res = await adminFetch('/api/battles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      success(initialData ? 'Battle updated successfully' : 'Battle created and live');
      onSuccess();
      onClose();
    } else {
      toastError(res.error || 'Failed to save battle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Swords className="h-5 w-5 text-amber-500" />
            <span>{initialData ? 'Edit Community Battle' : 'Create Live Battle'}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Battle Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none font-bold"
              placeholder="e.g. ढोटी क्रिकेट कप 2026 vs कबड्डी लीग"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Duration (Hours)</label>
              <select
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              >
                <option value={24}>24 Hours (1 Day)</option>
                <option value={48}>48 Hours (2 Days)</option>
                <option value={72}>72 Hours (3 Days)</option>
                <option value={168}>1 Week (7 Days)</option>
              </select>
            </div>
          </div>

          {/* DUAL OPTIONS BLOCK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* OPTION A */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-red-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400">Option A (Left)</span>
                <span className="text-base">{formData.optionA.emoji}</span>
              </div>
              <input
                type="text"
                required
                value={formData.optionA.label}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionA: { ...formData.optionA, label: e.target.value },
                  })
                }
                placeholder="Option A Label (e.g. Cricket)"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none"
              />
              <input
                type="text"
                value={formData.optionA.tagline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionA: { ...formData.optionA, tagline: e.target.value },
                  })
                }
                placeholder="Tagline (e.g. जोश और रोमांच)"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none"
              />
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Option A Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.optionA.imageUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        optionA: { ...formData.optionA, imageUrl: e.target.value },
                      })
                    }
                    placeholder="URL or Upload"
                    className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-[11px] outline-none"
                  />
                  <label className="px-2.5 py-1 bg-red-950/60 border border-red-800/60 hover:bg-red-900/60 text-red-300 font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                    {isUploadingA ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('A', e.target.files[0])}
                      className="hidden"
                      disabled={isUploadingA}
                    />
                  </label>
                </div>
                {formData.optionA.imageUrl && (
                  <img src={formData.optionA.imageUrl} alt="A" className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-800" />
                )}
              </div>
            </div>

            {/* OPTION B */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-sky-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400">Option B (Right)</span>
                <span className="text-base">{formData.optionB.emoji}</span>
              </div>
              <input
                type="text"
                required
                value={formData.optionB.label}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionB: { ...formData.optionB, label: e.target.value },
                  })
                }
                placeholder="Option B Label (e.g. Kabaddi)"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none"
              />
              <input
                type="text"
                value={formData.optionB.tagline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    optionB: { ...formData.optionB, tagline: e.target.value },
                  })
                }
                placeholder="Tagline (e.g. ताकत और रणनीति)"
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white outline-none"
              />
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Option B Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.optionB.imageUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        optionB: { ...formData.optionB, imageUrl: e.target.value },
                      })
                    }
                    placeholder="URL or Upload"
                    className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white text-[11px] outline-none"
                  />
                  <label className="px-2.5 py-1 bg-sky-950/60 border border-sky-800/60 hover:bg-sky-900/60 text-sky-300 font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1">
                    {isUploadingB ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('B', e.target.files[0])}
                      className="hidden"
                      disabled={isUploadingB}
                    />
                  </label>
                </div>
                {formData.optionB.imageUrl && (
                  <img src={formData.optionB.imageUrl} alt="B" className="mt-2 h-16 w-full object-cover rounded-lg border border-slate-800" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="battle-published-check"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
            <label htmlFor="battle-published-check" className="text-slate-300 font-medium cursor-pointer">
              Publish immediately on Live Battle Arena
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
              disabled={isSubmitting || isUploadingA || isUploadingB}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-slate-950 bg-amber-500 hover:bg-amber-400 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{initialData ? 'Update Battle' : 'Launch Battle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
