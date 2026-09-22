'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Newspaper, Plus, Search, Edit2, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { NewsItem } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { NewsForm } from '@/components/admin/forms/NewsForm';
import { useToast } from '@/components/admin/Toast';

export default function AdminNewsPage() {
  const { success, error: toastError } = useToast();
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

  // Delete dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      type: 'news',
      page: String(page),
      limit: '15',
      search,
    });

    const res = await adminFetch(`/api/admin/content?${query.toString()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setNewsList(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } else {
      toastError(res.error || 'Failed to fetch news');
    }
  }, [page, search, toastError]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleTogglePublish = async (item: NewsItem) => {
    const newStatus = !item.published;
    const res = await adminFetch(`/api/admin/content?type=news`, {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, published: newStatus }),
    });

    if (res.success) {
      success(`Article marked as ${newStatus ? 'Published' : 'Draft'}`);
      setNewsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, published: newStatus } : n))
      );
    } else {
      toastError(res.error || 'Could not update publication state');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=news&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('News article deleted permanently');
      fetchNews();
    } else {
      toastError(res.error || 'Failed to delete article');
    }
  };

  const columns: Column<NewsItem>[] = [
    {
      key: 'title',
      header: 'Article Title & Category',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <Newspaper className="h-5 w-5" />
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
      key: 'author',
      header: 'Author',
      render: (item) => <span className="text-slate-400">{item.author || 'DHOTI AALE'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <button
          onClick={() => handleTogglePublish(item)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
            item.published
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          {item.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          <span>{item.published ? 'Published' : 'Draft'}</span>
        </button>
      ),
    },
    {
      key: 'created',
      header: 'Date',
      render: (item) => (
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <Calendar className="h-3 w-3" />
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('hi-IN') : 'N/A'}</span>
        </div>
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
            title="Edit Article"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            title="Delete Article"
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
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Village News & Articles</h2>
          <p className="text-xs text-slate-400">Manage, draft, and publish village community news.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Article</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search news by title or content..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      {/* Data Table */}
      <AdminTable
        columns={columns}
        data={newsList}
        isLoading={isLoading}
        emptyTitle="No news articles found"
        emptyDescription="Start creating articles to inform the DHOTI AALE community."
        emptyActionLabel="Create First Article"
        onEmptyAction={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
      />

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={15}
        onPageChange={(p) => setPage(p)}
      />

      {/* Form Modal */}
      <NewsForm
        isOpen={isFormOpen}
        initialData={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchNews()}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete News Article"
        message="Are you sure you want to permanently delete this news article? This action cannot be reversed."
        confirmLabel="Delete Article"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
