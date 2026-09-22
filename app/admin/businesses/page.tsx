'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, CheckCircle2, Phone } from 'lucide-react';
import { BusinessItem } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { BusinessForm } from '@/components/admin/forms/BusinessForm';
import { useToast } from '@/components/admin/Toast';

export default function AdminBusinessesPage() {
  const { success, error: toastError } = useToast();
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessItem | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      type: 'business',
      page: String(page),
      limit: '15',
      search,
    });

    const res = await adminFetch(`/api/admin/content?${query.toString()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setBusinesses(
        res.data.map((item: any) => ({
          ...item,
          logoUrl: item.logo_url || item.logoUrl,
        }))
      );
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } else {
      toastError(res.error || 'Failed to fetch businesses');
    }
  }, [page, search, toastError]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleToggleVerified = async (item: BusinessItem) => {
    const newStatus = !item.verified;
    const res = await adminFetch(`/api/admin/content?type=business`, {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, verified: newStatus }),
    });

    if (res.success) {
      success(`Verification status updated`);
      setBusinesses((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, verified: newStatus } : b))
      );
    } else {
      toastError(res.error || 'Could not update verification status');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/content?type=business&id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Business record removed');
      fetchBusinesses();
    } else {
      toastError(res.error || 'Failed to delete business');
    }
  };

  const columns: Column<BusinessItem>[] = [
    {
      key: 'name',
      header: 'Business & Category',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.logoUrl ? (
            <img src={item.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-0.5 truncate max-w-sm">
            <div className="font-bold text-white truncate text-xs flex items-center gap-1.5">
              <span>{item.name}</span>
              {item.verified && <CheckCircle2 className="h-3 w-3 text-sky-400 shrink-0" />}
            </div>
            <div className="text-[10px] text-amber-400 font-semibold">{item.category}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone / Contact',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-300">
          <Phone className="h-3 w-3 text-slate-500" />
          <span>{item.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location',
      render: (item) => <span className="text-slate-400 truncate max-w-[150px] block">{item.address || 'ढोटी'}</span>,
    },
    {
      key: 'verified',
      header: 'Badge',
      render: (item) => (
        <button
          onClick={() => handleToggleVerified(item)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
            item.verified
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {item.verified ? 'Verified ✓' : 'Unverified'}
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
            title="Edit Business"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            title="Delete Business"
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
          <h2 className="text-lg font-black text-white tracking-tight">Village Business Directory</h2>
          <p className="text-xs text-slate-400">Manage village retail shops, artisans, services, and local enterprises.</p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Village Business</span>
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
          placeholder="Search businesses by name, category or phone..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      <AdminTable
        columns={columns}
        data={businesses}
        isLoading={isLoading}
        emptyTitle="No businesses registered"
        emptyDescription="Support the local economy by adding Dhoti businesses."
        emptyActionLabel="Add First Business"
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

      <BusinessForm
        isOpen={isFormOpen}
        initialData={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchBusinesses()}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Business Entry"
        message="Are you sure you want to remove this business from the directory?"
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
