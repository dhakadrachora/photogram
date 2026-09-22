'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Swords, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    battles: 0,
    activeChats: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin/content?type=overview', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load overview stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    { name: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Active Battles', value: stats.battles, icon: Swords, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Chat Messages', value: stats.activeChats, icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-sm font-medium text-stone-500">Welcome back, Super Admin. Here is what's happening today.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm border border-stone-200 transition hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-stone-500">{stat.name}</p>
              <h3 className="text-3xl font-black text-stone-900 mt-1">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-stone-300" /> : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
          <Swords className="h-8 w-8 text-stone-400" />
        </div>
        <h2 className="mt-4 text-xl font-black text-stone-900">Ready to manage your site?</h2>
        <p className="mt-2 text-stone-500 max-w-md mx-auto text-sm">
          Use the sleek sidebar on the left to manage Battles, Users, and Settings. Your new dashboard provides complete control over Dhotiaale in a safe and secure environment.
        </p>
      </div>
    </div>
  );
}
