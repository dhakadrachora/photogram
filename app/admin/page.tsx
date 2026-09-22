'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Radio,
  Newspaper,
  Swords,
  Vote,
  Building2,
  Image,
  Video,
  AlertCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/api';
import { DashboardMetrics } from '@/lib/admin/types';
import { AdminLoading } from '@/components/admin/AdminLoading';
import { NewsForm } from '@/components/admin/forms/NewsForm';
import { BattleForm } from '@/components/admin/forms/BattleForm';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBattles, setRecentBattles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick modals
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    const res = await adminFetch('/api/admin/analytics');
    setIsRefreshing(false);
    setIsLoading(false);

    if (res.success && res.data) {
      setMetrics(res.data.metrics);
      setRecentUsers(res.data.recentUsers || []);
      setRecentBattles(res.data.recentBattles || []);
    } else {
      // Fallback unavailable metrics rather than crash
      setMetrics({
        totalUsers: 'Unavailable',
        activeUsers: 'Unavailable',
        totalNews: 'Unavailable',
        publishedNews: 'Unavailable',
        draftNews: 'Unavailable',
        activeBattles: 'Unavailable',
        completedBattles: 'Unavailable',
        totalVotes: 'Unavailable',
        totalBusinesses: 'Unavailable',
        galleryCount: 'Unavailable',
        videoCount: 'Unavailable',
        openReports: 'Unavailable',
        systemStatus: 'Degraded',
      });
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <AdminLoading count={4} />;
  }

  const metricCards = [
    {
      title: 'Total Registered Users',
      value: metrics?.totalUsers ?? 'Unavailable',
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      href: '/admin/users',
    },
    {
      title: 'Active Community Users',
      value: metrics?.activeUsers ?? 'Unavailable',
      icon: Radio,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/users',
    },
    {
      title: 'Active Battles',
      value: metrics?.activeBattles ?? 'Unavailable',
      icon: Swords,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      href: '/admin/battles',
    },
    {
      title: 'Total Battle Votes',
      value: metrics?.totalVotes ?? 'Unavailable',
      icon: Vote,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      href: '/admin/battles',
    },
    {
      title: 'Published News',
      value: metrics?.publishedNews ?? 'Unavailable',
      icon: Newspaper,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      href: '/admin/news',
    },
    {
      title: 'Draft News',
      value: metrics?.draftNews ?? 'Unavailable',
      icon: Newspaper,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/20',
      href: '/admin/news',
    },
    {
      title: 'Village Businesses',
      value: metrics?.totalBusinesses ?? 'Unavailable',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      href: '/admin/businesses',
    },
    {
      title: 'Gallery Photos',
      value: metrics?.galleryCount ?? 'Unavailable',
      icon: Image,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      href: '/admin/gallery',
    },
    {
      title: 'Video Showcase',
      value: metrics?.videoCount ?? 'Unavailable',
      icon: Video,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      href: '/admin/videos',
    },
    {
      title: 'Open Reports / Support',
      value: metrics?.openReports ?? 'Unavailable',
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      href: '/admin/comments',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white tracking-tight">System Overview</h2>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                metrics?.systemStatus === 'Optimal'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              ● {metrics?.systemStatus || 'Online'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time analytics and direct administration for DHOTI AALE community.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchDashboardData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsBattleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Battle</span>
          </button>
          <button
            onClick={() => setIsNewsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Post News</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Every metric fails independently */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const isUnavailable = card.value === 'Unavailable';

          return (
            <Link
              key={card.title}
              href={card.href}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>

              <div className="mt-3">
                <div
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isUnavailable ? 'text-amber-500/70 text-sm font-mono' : 'text-white'
                  }`}
                >
                  {isUnavailable ? 'Unavailable' : card.value}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Activity & Recent Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Community Battles */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Community Battles</h3>
            </div>
            <Link
              href="/admin/battles"
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBattles.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No battles active right now</div>
            ) : (
              recentBattles.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="text-xs font-bold text-white truncate">{b.title}</div>
                    <div className="text-[10px] text-slate-500">{b.category}</div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                      b.is_ended || b.status === 'closed'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {b.is_ended || b.status === 'closed' ? 'Closed' : 'Active'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Registered Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Recent Dhoti Residents</h3>
            </div>
            <Link
              href="/admin/users"
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No recent registrations</div>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono shrink-0">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('hi-IN') : 'Recent'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Modals */}
      <NewsForm
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
      <BattleForm
        isOpen={isBattleModalOpen}
        onClose={() => setIsBattleModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
