'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Video, Plus, Search, Edit2, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { VideoItem } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { VideoForm } from '@/components/admin/forms/VideoForm';
import { useToast } from '@/components/admin/Toast';

export default function AdminVideosPage() {
  const { success, error: toastError } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      type: 'videos',
      page: String(page),
      limit: '15',
      search,
    });

    const res = await adminFetch(`/api/admin/content?${query.toString()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setVideos(
        res.data.map((v: any) => ({
          ...v,
          videoUrl: v.video_url || v.videoUrl,
          thumbnailUrl: v.thumbnail_url || v.thumbnailUrl,
        }))
      );
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } else {
      toastError(res.error || 'Failed to fetch videos');
    }
  }, [page, search, toastError]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleTogglePublish = async (item: VideoItem) => {
    const newStatus = !item.published;
    const res = await adminFetch(`/api/admin/content?type=videos`, {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, published: newStatus }),
    });

    if (res.success) {
      success(`Video visibility updated`);
      setVideos((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, published: newStatus } : v))
      );
    } else {
      toastError(res.error || 'Could not update publication state');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=videos&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Video removed successfully');
      fetchVideos();
    } else {
      toastError(res.error || 'Failed to delete video');
    }
  };

  const columns: Column<VideoItem>[] = [
    {
      key: 'title',
      header: 'Video & Category',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="w-12 h-8 rounded-lg object-cover border border-slate-800 shrink-0" />
          ) : (
            <div className="w-12 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <Video className="h-4 w-4" />
            </div>
          )}
          <div className="space-y-0.5 truncate max-w-sm">
            <div className="font-bold text-white truncate text-xs">{item.title}</div>
            <div className="text-[10px] text-amber-400 font-semibold">{item.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'url',
      header: 'Link',
      render: (item) => (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sky-400 hover:underline text-[11px] font-mono truncate max-w-[180px]"
        >
          <span className="truncate">{item.videoUrl}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Visibility',
      render: (item) => (
        <button
          onClick={() => handleTogglePublish(item)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
            item.published
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          {item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{item.published ? 'Visible' : 'Hidden'}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            title="Edit Video"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            title="Delete Video"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Village Video Showcase</h2>
          <p className="text-xs text-slate-400">Manage cultural videos, events, festivals, and documentaries.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Video</span>
        </button>
      </div>

      <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search videos by title or category..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      <AdminTable
        columns={columns}
        data={videos}
        isLoading={isLoading}
        emptyTitle="No videos found"
        emptyDescription="Add YouTube or hosted videos to the village showcase."
        emptyActionLabel="Add First Video"
        onEmptyAction={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
      />

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={15}
        onPageChange={(p) => setPage(p)}
      />

      <VideoForm
        isOpen={isFormOpen}
        initialData={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchVideos()}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Video"
        message="Are you sure you want to remove this video from the showcase?"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
