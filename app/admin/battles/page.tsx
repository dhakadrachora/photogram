'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BattleEvent } from '@/types';
import { BattleForm } from '@/components/battles/BattleForm';
import { Swords, Plus, Loader2, Trash2 } from 'lucide-react';

export default function AdminBattles() {
  const [battles, setBattles] = useState<BattleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchBattles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/battles', { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.battles) setBattles(data.battles);
      }
    } catch (err) {
      console.error('Failed to load battles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this battle? This cannot be undone.')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/battles?id=${id}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        fetchBattles();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete battle');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting battle.');
    }
  };

  const handleSaveSuccess = () => {
    setShowForm(false);
    fetchBattles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Battle Management</h1>
          <p className="mt-1 text-sm font-medium text-stone-500">Create, edit, and oversee Dhotiaale battles.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          {showForm ? 'Cancel' : <><Plus className="h-4 w-4" /> Create Battle</>}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-stone-900 mb-6">Create New Battle</h2>
          {/* We supply an onSave callback that fetches the token securely and POSTs to /api/battles */}
          <BattleForm 
            onSave={async (payload) => {
              const { data: { session } } = await supabase.auth.getSession();
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }
              const res = await fetch('/api/battles', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create battle');
              }
              handleSaveSuccess();
            }} 
          />
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : battles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 mb-4">
              <Swords className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-black text-stone-900">No Battles Found</h3>
            <p className="mt-1 text-sm text-stone-500 max-w-sm">You haven't created any battles yet. Click the Create Battle button above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Votes</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {battles.map((battle) => (
                  <tr key={battle.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-900">{battle.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
                        {battle.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        battle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {battle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-600">
                      A: {battle.optionA?.votes || 0} | B: {battle.optionB?.votes || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(battle.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Battle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
