'use client';

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function BattleForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: any;
  onSave: (payload: any) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Community Clash ⚔️');
  const [description, setDescription] = useState(initialData?.description || '');
  
  const [optALabel, setOptALabel] = useState(initialData?.optionA?.label || '');
  const [optATagline, setOptATagline] = useState(initialData?.optionA?.tagline || '');
  const [optAEmoji, setOptAEmoji] = useState(initialData?.optionA?.emoji || '🔥');
  const [optAImage, setOptAImage] = useState(initialData?.optionA?.imageUrl || '');
  const [optAFile, setOptAFile] = useState<File | null>(null);

  const [optBLabel, setOptBLabel] = useState(initialData?.optionB?.label || '');
  const [optBTagline, setOptBTagline] = useState(initialData?.optionB?.tagline || '');
  const [optBEmoji, setOptBEmoji] = useState(initialData?.optionB?.emoji || '⚡');
  const [optBImage, setOptBImage] = useState(initialData?.optionB?.imageUrl || '');
  const [optBFile, setOptBFile] = useState<File | null>(null);

  const [durationMinutes, setDurationMinutes] = useState(initialData?.duration_minutes || 1440);
  const [customDuration, setCustomDuration] = useState(false);
  const [published, setPublished] = useState(initialData?.published ?? true);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'a' | 'b') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Limit is 10MB.');
      return;
    }

    if (side === 'a') {
      setOptAFile(file);
      setOptAImage(URL.createObjectURL(file)); // preview
    } else {
      setOptBFile(file);
      setOptBImage(URL.createObjectURL(file)); // preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !optALabel.trim() || !optBLabel.trim()) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let finalAUrl = initialData?.optionA?.imageUrl || optAImage;
      let finalBUrl = initialData?.optionB?.imageUrl || optBImage;

      // Upload if new files are selected
      if (optAFile || optBFile) {
        const formData = new FormData();
        if (initialData?.id) formData.append('battleId', initialData.id);
        if (optAFile) formData.append('optionA', optAFile);
        if (optBFile) formData.append('optionB', optBFile);

        // Fetch auth token
        let token = '';
        if (isSupabaseConfigured()) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            token = session?.access_token || '';
          } catch {}
        }

        const uploadRes = await fetch('/api/battles/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload images to Supabase');
        }

        if (uploadData.optionAUrl) finalAUrl = uploadData.optionAUrl;
        if (uploadData.optionBUrl) finalBUrl = uploadData.optionBUrl;
      }

      // Prepare payload to save to database
      const payload = {
        title,
        category,
        description,
        published,
        durationMinutes: Math.max(1, Math.round(Number(durationMinutes) || 1440)),
        optionA: {
          id: initialData?.optionA?.id || 'opt_a_' + Math.random().toString(36).substring(2, 6),
          label: optALabel,
          tagline: optATagline,
          emoji: optAEmoji,
          imageUrl: finalAUrl,
          votes: initialData?.optionA?.votes || 0,
        },
        optionB: {
          id: initialData?.optionB?.id || 'opt_b_' + Math.random().toString(36).substring(2, 6),
          label: optBLabel,
          tagline: optBTagline,
          emoji: optBEmoji,
          imageUrl: finalBUrl,
          votes: initialData?.optionB?.votes || 0,
        },
      };

      await onSave(payload);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during save.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      {errorMsg && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4">
          ⚠️ {errorMsg}
        </div>
      )}
      
      <div>
        <label className="font-bold text-slate-300 block mb-1">Battle Title *</label>
        <input
          type="text"
          required
          placeholder="e.g. Village Swag vs City Hustle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="font-bold text-slate-300 block mb-1">Battle Duration</label>
          <select
            value={customDuration ? 'custom' : String(durationMinutes)}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'custom') {
                setCustomDuration(true);
                return;
              }
              setCustomDuration(false);
              setDurationMinutes(Number(value));
            }}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours (1 day)</option>
            <option value="4320">3 days</option>
            <option value="10080">7 days</option>
            <option value="custom">Custom minutes</option>
          </select>
          {customDuration && (
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value) || 1))}
              placeholder="Enter minutes"
              className="w-full mt-2 rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          )}
        </div>
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Description</label>
        <textarea
          rows={2}
          placeholder="Explain the battle context for community voters..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Participant Option A */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
        <span className="font-bold text-amber-400 block">Participant Option A *</span>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Label (e.g. Chole Bhature)"
            value={optALabel}
            onChange={(e) => setOptALabel(e.target.value)}
            className="col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={optAEmoji}
            onChange={(e) => setOptAEmoji(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-center"
          />
        </div>
        <input
          type="text"
          placeholder="Tagline (e.g. Desi Makkhan Swag)"
          value={optATagline}
          onChange={(e) => setOptATagline(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
        />
        <div className="flex items-center gap-2">
          {optAImage && (
            <img src={optAImage} alt="Preview A" className="h-8 w-8 object-cover rounded-md" />
          )}
          <input
            type="text"
            placeholder="Image URL or upload"
            value={optAImage}
            readOnly
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 text-[11px]"
          />
          <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[10px] flex items-center gap-1">
            <Upload className="h-3 w-3" />
            <span>Select</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'a')}
            />
          </label>
        </div>
      </div>

      {/* Participant Option B */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-2">
        <span className="font-bold text-sky-400 block">Participant Option B *</span>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Label (e.g. Cheesy Pizza)"
            value={optBLabel}
            onChange={(e) => setOptBLabel(e.target.value)}
            className="col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={optBEmoji}
            onChange={(e) => setOptBEmoji(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-center"
          />
        </div>
        <input
          type="text"
          placeholder="Tagline (e.g. Extra Crust & Toppings)"
          value={optBTagline}
          onChange={(e) => setOptBTagline(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
        />
        <div className="flex items-center gap-2">
          {optBImage && (
            <img src={optBImage} alt="Preview B" className="h-8 w-8 object-cover rounded-md" />
          )}
          <input
            type="text"
            placeholder="Image URL or upload"
            value={optBImage}
            readOnly
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 text-[11px]"
          />
          <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[10px] flex items-center gap-1">
            <Upload className="h-3 w-3" />
            <span>Select</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'b')}
            />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded accent-amber-500"
        />
        <span className="text-slate-300 font-medium">Publish directly to public Community Battle Arena</span>
      </label>

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="w-1/3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 text-xs transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isUploading}
          className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all"
        >
          {isUploading ? 'Uploading & Saving...' : 'Save Battle'}
        </button>
      </div>
    </form>
  );
}
