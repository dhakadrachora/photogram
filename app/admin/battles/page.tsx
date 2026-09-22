'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Swords, Plus, Search, Edit2, Trash2, Trophy, Clock, Play, Square, Eye, EyeOff } from 'lucide-react';
import { BattleEvent } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { AdminTable, Column } from '@/components/admin/AdminTable';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { BattleForm } from '@/components/admin/forms/BattleForm';
import { useToast } from '@/components/admin/Toast';

export default function AdminBattlesPage() {
  const { success, error: toastError } = useToast();
  const [battles, setBattles] = useState<BattleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BattleEvent | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBattles = useCallback(async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/battles');
    setIsLoading(false);

    if (res.success && res.battles) {
      setBattles(res.battles);
    } else {
      toastError(res.error || 'Failed to fetch battles');
    }
  }, [toastError]);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const handleTogglePublish = async (item: BattleEvent) => {
    const res = await adminFetch('/api/battles', {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, action: 'toggle_publish' }),
    });

    if (res.success) {
      success(`Publication status updated`);
      fetchBattles();
    } else {
      toastError(res.error || 'Failed to toggle publication');
    }
  };

  const handleToggleState = async (item: BattleEvent) => {
    const isCurrentlyClosed = item.isEnded || item.status === 'closed';
    const action = isCurrentlyClosed ? 'start' : 'close';

    const res = await adminFetch('/api/battles', {
      method: 'PUT',
      body: JSON.stringify({ id: item.id, action }),
    });

    if (res.success) {
      success(`Battle is now ${action === 'start' ? 'Active' : 'Ended'}`);
      fetchBattles();
    } else {
      toastError(res.error || 'Failed to update battle state');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    const res = await adminFetch(`/api/battles?id=${deletingId}`, {
      method: 'DELETE',
    });

    setIsDeleting(false);
    setDeletingId(null);

    if (res.success) {
      success('Battle and associated votes deleted');
      fetchBattles();
    } else {
      toastError(res.error || 'Failed to delete battle');
    }
  };

  const filteredBattles = battles.filter((b) => {
    const isEnded = b.isEnded || b.status === 'closed';
    if (filter === 'active' && isEnded) return false;
    if (filter === 'closed' && !isEnded) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.optionA?.label.toLowerCase().includes(q) ||
        b.optionB?.label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: Column<BattleEvent>[] = [
    {
      key: 'title',
      header: 'Battle Title & Options',
      render: (item) => {
        const aVotes = item.optionA?.votes || 0;
        const bVotes = item.optionB?.votes || 0;
        const total = aVotes + bVotes;

        return (
          <div className="space-y-1.5 py-1">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>{item.title}</span>
              <span className="text-[10px] text-amber-400 font-semibold">({item.category})</span>
            </div>

            {/* Duel Options Pills */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 font-semibold">
                <span>{item.optionA?.emoji || '🔥'}</span>
                <span>{item.optionA?.label}</span>
                <span className="text-white font-mono font-bold">({aVotes})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-black">VS</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-sky-300 font-semibold">
                <span>{item.optionB?.emoji || '⚡'}</span>
                <span>{item.optionB?.label}</span>
                <span className="text-white font-mono font-bold">({bVotes})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Total: {total}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Live State',
      render: (item) => {
        const isEnded = item.isEnded || item.status === 'closed';
        return (
          <div className="space-y-1">
            <button
              onClick={() => handleToggleState(item)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                isEnded
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isEnded ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isEnded ? 'Closed (Click to Open)' : 'Live (Click to End)'}</span>
            </button>
            {item.winnerOptionId && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                <Trophy className="h-3 w-3" />
                <span>Winner Declared</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'published',
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
            title="Edit Battle"
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            title="Delete Battle"
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
          <h2 className="text-lg font-black text-white tracking-tight">Community Battles Control</h2>
          <p className="text-xs text-slate-400">
            Create face-offs, monitor real-time community votes, and close battles.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Launch New Battle</span>
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
          <Search className="h-4 w-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search battles by topic or option..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['all', 'active', 'closed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                filter === tab ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredBattles}
        isLoading={isLoading}
        emptyTitle="No community battles found"
        emptyDescription="Launch engaging polls and battles for the Dhoti village community."
        emptyActionLabel="Create First Battle"
        onEmptyAction={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
      />

      <BattleForm
        isOpen={isFormOpen}
        initialData={editingItem}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchBattles()}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Community Battle"
        message="Are you sure you want to permanently delete this battle and all its registered votes?"
        confirmLabel="Delete Battle"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
