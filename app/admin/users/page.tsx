'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserCog, Search, Shield, Trash2, Coins, Phone, Mail, Calendar, Sparkles, Check } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import { VerifiedTick } from '@/components/VerifiedTick';

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
  isOwner?: boolean;
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
    if (user.isOwner) {
      toastError('Site Owner is permanently verified.');
      return;
    }

    const isCurrentlyVerified =
      user.badge === 'Verified Resident ✓' ||
      String(user.badge || '').toLowerCase().includes('verified');

    const newBadge = isCurrentlyVerified ? 'Dhoti Resident' : 'Verified Resident ✓';

    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: user.id,
        updates: { badge: newBadge },
      }),
    });

    if (res.success) {
      success(
        isCurrentlyVerified
          ? `Removed Blue Tick from ${user.name}`
          : `Blue Tick (Verified) granted to ${user.name}! ✓`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, badge: newBadge } : u))
      );
    } else {
      toastError(res.error || 'Could not update verification status');
    }
  };

  const handleToggleRole = async (user: UserRecord) => {
    if (user.isOwner) {
      toastError('Site Owner permissions cannot be changed.');
      return;
    }

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
      render: (u) => {
        const isVerified =
          u.isOwner ||
          u.badge === 'Verified Resident ✓' ||
          String(u.badge || '').toLowerCase().includes('verified') ||
          String(u.badge || '').toLowerCase().includes('site owner');

        return (
          <div className="flex items-center gap-3">
            {u.avatar ? (
              <img
                src={u.avatar}
                alt=""
                className={`w-9 h-9 rounded-full object-cover border shrink-0 ${
                  u.isOwner
                    ? 'border-amber-400 ring-2 ring-amber-500/40'
                    : isVerified
                    ? 'border-sky-400 ring-2 ring-sky-500/40'
                    : 'border-slate-700'
                }`}
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                {u.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="space-y-0.5 truncate max-w-sm">
              <div className="font-bold text-white text-xs flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{u.name}</span>
                {isVerified && <VerifiedTick size={14} />}
                {u.isOwner && (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded-md">
                    OWNER 👑
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Mobile / Phone',
      render: (u) => (
        <span className="text-slate-300 font-mono text-xs">
          {u.phone ? `+91 ${u.phone.replace(/^\+?91/, '')}` : '—'}
        </span>
      ),
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
        if (u.isOwner) {
          return (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center gap-1 w-fit shadow-md">
              <Shield className="h-3 w-3" />
              <span>Owner 👑</span>
            </span>
          );
        }

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
            <span>{isAdmin ? 'Admin 🛡️' : 'Resident'}</span>
          </button>
        );
      },
    },
    {
      key: 'verification',
      header: 'Blue Tick Status',
      render: (u) => {
        if (u.isOwner) {
          return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-sky-500/15 text-sky-300 border border-sky-500/40">
              <VerifiedTick size={14} />
              <span>Owner Tick ✓</span>
            </div>
          );
        }

        const isVerified =
          u.badge === 'Verified Resident ✓' ||
          String(u.badge || '').toLowerCase().includes('verified');

        return (
          <button
            onClick={() => handleToggleVerified(u)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isVerified
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                : 'bg-slate-800/90 text-slate-400 border border-slate-700 hover:border-sky-500/50 hover:text-sky-300'
            }`}
            title={isVerified ? 'Click to remove Blue Tick' : 'Click to grant Blue Tick'}
          >
            {isVerified ? (
              <>
                <VerifiedTick size={13} />
                <span>Blue Tick Active</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>+ Give Blue Tick</span>
              </>
            )}
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
      render: (u) => {
        if (u.isOwner) {
          return <span className="text-[10px] text-amber-400 font-bold px-2">Owner</span>;
        }

        return (
          <button
            onClick={() => setDeletingId(u.id)}
            title="Delete User Record"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight">Resident User Directory & Blue Tick Control</h2>
        <p className="text-xs text-slate-400">
          यहाँ सभी रजिस्टर्ड व लॉग-इन यूज़र्स का डेटा मौजूद है। साइट ओनर किसी भी रेजिडेंट को यहाँ से ब्लू टिक (Verified Badge) लगा या हटा सकता है।
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
