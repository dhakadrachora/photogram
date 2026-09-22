'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users2, Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { PersonProfile } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { PeopleForm } from '@/components/admin/forms/PeopleForm';
import { useToast } from '@/components/admin/Toast';

export default function AdminPeoplePage() {
  const { success, error: toastError } = useToast();
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonProfile | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      type: 'people',
      page: String(page),
      limit: '15',
      search,
    });

    const res = await adminFetch(`/api/admin/content?${query.toString()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setPeople(
        res.data.map((item: any) => ({
          ...item,
          photoUrl: item.photo_url || item.photoUrl,
        }))
      );
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } else {
      toastError(res.error || 'Failed to fetch people');
    }
  }, [page, search, toastError]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const handleTogglePublish = async (item: PersonProfile) => {
    const newStatus = !item.published;
    const res = await adminFetch(`/api/admin/content?type=people`, {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, published: newStatus }),
    });

    if (res.success) {
      success(`Visibility updated to ${newStatus ? 'Public' : 'Hidden'}`);
      setPeople((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, published: newStatus } : p))
      );
    } else {
      toastError(res.error || 'Could not update publication state');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=people&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Person profile deleted');
      fetchPeople();
    } else {
      toastError(res.error || 'Failed to delete profile');
    }
  };

  const columns: Column<PersonProfile>[] = [
    {
      key: 'name',
      header: 'Person & Role',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-amber-400/40 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <Users2 className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-0.5 truncate max-w-sm">
            <div className="font-bold text-white truncate text-xs">{item.name}</div>
            <div className="text-[10px] text-amber-400 font-semibold">{item.designation || 'निवासी'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => <span className="text-slate-400 text-xs">{item.category || 'सम्मानित'}</span>,
    },
    {
      key: 'status',
      header: 'Visibility',
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
            title="Edit Profile"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            title="Delete Profile"
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
          <h2 className="text-lg font-black text-white tracking-tight">Village Hall of Fame (People)</h2>
          <p className="text-xs text-slate-400">Recognize and manage esteemed villagers, leaders, and contributors.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Person</span>
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
          placeholder="Search people by name or role..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      <AdminTable
        columns={columns}
        data={people}
        isLoading={isLoading}
        emptyTitle="No people profiles found"
        emptyDescription="Add remarkable personalities to showcase in DHOTI AALE."
        emptyActionLabel="Add First Person"
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

      <PeopleForm
        isOpen={isFormOpen}
        initialData={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchPeople()}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Person Profile"
        message="Are you sure you want to remove this person from the village directory?"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
