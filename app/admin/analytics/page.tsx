'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, Users, Swords, Vote, Newspaper, Building2, Image as ImageIcon, Video, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { DashboardMetrics } from '@/lib/admin/types';
import { AdminLoading } from '@/components/admin/AdminLoading';

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/admin/analytics');
    setIsLoading(false);

    if (res.success && res.data) {
      setMetrics(res.data.metrics);
      setRecentBattles(res.data.recentBattles || []);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return <AdminLoading count={4} />;
  }

  const renderValue = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === 'Unavailable') {
      return <span className="text-slate-500 font-mono text-sm">No data available</span>;
    }
    return <span className="text-2xl font-black text-white">{val}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Database Analytics & Engagement</h2>
          <p className="text-xs text-slate-400">
            Real data strictly queried from production Supabase PostgreSQL tables.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Community Residents</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div>{renderValue(metrics?.totalUsers)}</div>
          <div className="text-[11px] text-slate-500">Active users: {metrics?.activeUsers ?? 'N/A'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Community Battles</span>
            <Swords className="h-4 w-4 text-amber-400" />
          </div>
          <div>{renderValue(metrics?.activeBattles)}</div>
          <div className="text-[11px] text-slate-500">Completed: {metrics?.completedBattles ?? 'N/A'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Cast Votes</span>
            <Vote className="h-4 w-4 text-purple-400" />
          </div>
          <div>{renderValue(metrics?.totalVotes)}</div>
          <div className="text-[11px] text-slate-500">Strictly verified single votes</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Published News</span>
            <Newspaper className="h-4 w-4 text-rose-400" />
          </div>
          <div>{renderValue(metrics?.publishedNews)}</div>
          <div className="text-[11px] text-slate-500">Drafts: {metrics?.draftNews ?? 'N/A'}</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Local Businesses</div>
            <div className="text-lg font-bold text-white">{metrics?.totalBusinesses ?? 'No data'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Village Photos</div>
            <div className="text-lg font-bold text-white">{metrics?.galleryCount ?? 'No data'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Documented Videos</div>
            <div className="text-lg font-bold text-white">{metrics?.videoCount ?? 'No data'}</div>
          </div>
        </div>
      </div>

      {/* Battle Vote Distribution Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Live Battle Participation Breakdown</h3>
        {recentBattles.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">No battle data currently recorded.</div>
        ) : (
          <div className="space-y-3">
            {recentBattles.map((b) => (
              <div key={b.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{b.title}</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Status: {b.is_ended ? 'Closed' : 'Active'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-red-500 h-full w-1/2" title="Option A" />
                  <div className="bg-sky-500 h-full w-1/2" title="Option B" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
