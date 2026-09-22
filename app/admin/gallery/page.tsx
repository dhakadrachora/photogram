'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Image as ImageIcon, Plus, Search, Trash2, Eye, EyeOff, Upload, Loader2, X } from 'lucide-react';
import { GalleryItem } from '@/types';
import { adminFetch, adminUploadFile } from '@/lib/admin/api';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

export default function AdminGalleryPage() {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Festivals 🪔');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(true);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/admin/content?type=gallery&limit=100');
    setIsLoading(false);

    if (res.success && res.data) {
      setItems(
        res.data.map((g: any) => ({
          ...g,
          imageUrl: g.image_url || g.imageUrl,
        }))
      );
    } else {
      toastError(res.error || 'Failed to load gallery');
    }
  }, [toastError]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminUploadFile(file, 'gallery');
      if (res.success && res.publicUrl) {
        setImageUrl(res.publicUrl);
        success('Photo uploaded to battle-image bucket');
      } else {
        toastError(res.error || 'Upload failed');
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toastError('Title and Image are required');
      return;
    }

    setIsSaving(true);
    const res = await adminFetch('/api/admin/content?type=gallery', {
      method: 'POST',
      body: JSON.stringify({
        title,
        category,
        caption,
        image_url: imageUrl,
        published: true,
      }),
    });
    setIsSaving(false);

    if (res.success) {
      success('Photo added to village gallery');
      setIsModalOpen(false);
      setTitle('');
      setCaption('');
      setImageUrl('');
      fetchGallery();
    } else {
      toastError(res.error || 'Failed to save photo');
    }
  };

  const handleTogglePublish = async (item: GalleryItem) => {
    const newStatus = !item.published;
    const res = await adminFetch(`/api/admin/content?type=gallery`, {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, published: newStatus }),
    });

    if (res.success) {
      success(`Visibility updated to ${newStatus ? 'Published' : 'Hidden'}`);
      setItems((prev) =>
        prev.map((g) => (g.id === item.id ? { ...g, published: newStatus } : g))
      );
    } else {
      toastError(res.error || 'Could not update photo visibility');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=gallery&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Photo deleted');
      fetchGallery();
    } else {
      toastError(res.error || 'Failed to delete photo');
    }
  };

  const filteredItems = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Village Photo Gallery</h2>
          <p className="text-xs text-slate-400">Upload cultural, festive, and village landscape photos.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Photo</span>
        </button>
      </div>

      <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gallery photos by title or tag..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      {/* Grid of gallery photos */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No photos uploaded yet. Click &quot;Add Photo&quot; to upload community pictures.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md flex flex-col"
            >
              <div className="aspect-4/3 w-full bg-slate-950 overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePublish(item)}
                    className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                      item.published
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-500/30 hover:bg-red-900 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <div className="font-bold text-white text-xs truncate">{item.title}</div>
                <div className="text-[10px] text-amber-400 font-semibold">{item.category}</div>
                {item.caption && <p className="text-[10px] text-slate-400 line-clamp-1">{item.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Photo to Gallery</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  placeholder="e.g. ढोटी होली उत्सव 2026"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Caption / Details</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  placeholder="Brief description of the moment..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Photo Upload *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                    placeholder="URL or Upload..."
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl cursor-pointer shrink-0">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="" className="mt-2 h-24 w-full object-cover rounded-xl border border-slate-800" />
                )}
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
                  disabled={isSaving || isUploading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Photo"
        message="Are you sure you want to delete this photo from the gallery?"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
