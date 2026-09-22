'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserCog, Search, CheckCircle2, Shield, Trash2, Coins, Phone, Mail, Calendar } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  badge?: string;
  rank?: string;
  role?: string;
  is_admin?: boolean;
  coins?: number;
  wins?: number;
  battles?: number;
  created_at?: string;
}

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Delete dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      page: String(page),
      limit: '15',
      search,
    });

    const res = await adminFetch(`/api/admin/users?${query.toString()}`);
    setIsLoading(false);

    if (res.success && res.data) {
      setUsers(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalItems(res.pagination.total);
      }
    } else {
      toastError(res.error || 'Failed to fetch users');
    }
  }, [page, search, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleVerified = async (user: UserRecord) => {
    const isCurrentlyVerified = user.badge === 'Verified Resident ✓';
    const newBadge = isCurrentlyVerified ? 'Dhoti Resident' : 'Verified Resident ✓';

    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: user.id,
        updates: { badge: newBadge },
      }),
    });

    if (res.success) {
      success(`User status updated to ${newBadge}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, badge: newBadge } : u))
      );
    } else {
      toastError(res.error || 'Could not update verification status');
    }
  };

  const handleToggleRole = async (user: UserRecord) => {
    const isCurrentlyAdmin = user.is_admin || user.role === 'admin';
    const newRole = isCurrentlyAdmin ? 'resident' : 'admin';
    const newIsAdmin = !isCurrentlyAdmin;

    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: user.id,
        updates: { role: newRole, is_admin: newIsAdmin },
      }),
    });

    if (res.success) {
      success(`User role updated to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: newRole, is_admin: newIsAdmin } : u
        )
      );
    } else {
      toastError(res.error || 'Could not update role');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/admin/users?userId=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('User profile removed');
      fetchUsers();
    } else {
      toastError(res.error || 'Failed to delete user');
    }
  };

  const columns: Column<UserRecord>[] = [
    {
      key: 'user',
      header: 'Resident Profile',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {u.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="space-y-0.5 truncate max-w-sm">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>{u.name}</span>
              {u.badge === 'Verified Resident ✓' && <CheckCircle2 className="h-3 w-3 text-sky-400 shrink-0" />}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className="text-slate-400 font-mono text-xs">{u.phone || '—'}</span>,
    },
    {
      key: 'coins',
      header: 'Dhoti Coins',
      render: (u) => (
        <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
          <Coins className="h-3.5 w-3.5" />
          <span>{u.coins ?? 50}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role & Access',
      render: (u) => {
        const isAdmin = u.is_admin || u.role === 'admin';
        return (
          <button
            onClick={() => handleToggleRole(u)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
              isAdmin
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="h-2.5 w-2.5" />
            <span>{isAdmin ? 'Admin 👑' : 'Resident'}</span>
          </button>
        );
      },
    },
    {
      key: 'verification',
      header: 'Verification Badge',
      render: (u) => {
        const isVerified = u.badge === 'Verified Resident ✓';
        return (
          <button
            onClick={() => handleToggleVerified(u)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              isVerified
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isVerified ? 'Verified ✓' : 'Unverified'}
          </button>
        );
      },
    },
    {
      key: 'created',
      header: 'Registered',
      render: (u) => (
        <span className="text-slate-500 text-[10px] font-mono">
          {u.created_at ? new Date(u.created_at).toLocaleDateString('hi-IN') : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <button
          onClick={() => setDeletingId(u.id)}
          title="Delete User Record"
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight">Resident User Directory</h2>
        <p className="text-xs text-slate-400">
          Search registered members, inspect verification badges, and manage administrative privileges.
        </p>
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
          placeholder="Search by resident name, email, or mobile number..."
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
        />
      </div>

      <AdminTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyTitle="No residents found"
        emptyDescription="No users matched your search query."
      />

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={15}
        onPageChange={(p) => setPage(p)}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete User Account"
        message="Are you sure you want to delete this resident record? All profile data will be permanently cleared."
        confirmLabel="Delete User"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
