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
  Crown,
  Sparkles,
  Bot,
  HardDrive,
  CheckCircle2,
  Clock,
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

  const primaryCards = [
    {
      title: 'Community Residents',
      value: metrics?.totalUsers ?? 'Unavailable',
      subtitle: `${metrics?.activeUsers ?? 0} active in 24h`,
      icon: Users,
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.15)]',
      border: 'hover:border-sky-500/50',
      iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
      href: '/admin/users',
    },
    {
      title: 'Community Battles',
      value: metrics?.activeBattles ?? 'Unavailable',
      subtitle: `${metrics?.totalVotes ?? 0} total cast votes`,
      icon: Swords,
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      border: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      href: '/admin/battles',
    },
    {
      title: 'Village News Hub',
      value: metrics?.publishedNews ?? 'Unavailable',
      subtitle: `${metrics?.draftNews ?? 0} drafts in review`,
      icon: Newspaper,
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      border: 'hover:border-rose-500/50',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      href: '/admin/news',
    },
    {
      title: 'Village Businesses',
      value: metrics?.totalBusinesses ?? 'Unavailable',
      subtitle: 'Verified local directory',
      icon: Building2,
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      border: 'hover:border-purple-500/50',
      iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      href: '/admin/businesses',
    },
  ];

  const secondaryCards = [
    {
      title: 'Photo Gallery',
      value: metrics?.galleryCount ?? 'Unavailable',
      icon: Image,
      iconColor: 'text-teal-400',
      href: '/admin/gallery',
    },
    {
      title: 'Video Showcase',
      value: metrics?.videoCount ?? 'Unavailable',
      icon: Video,
      iconColor: 'text-orange-400',
      href: '/admin/videos',
    },
    {
      title: 'Support Reports',
      value: metrics?.openReports ?? 'Unavailable',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      href: '/admin/comments',
    },
    {
      title: 'Cloud Storage',
      value: 'Online',
      icon: HardDrive,
      iconColor: 'text-emerald-400',
      href: '/admin/storage',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Ultra-Luxury Hero Command Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121926] via-[#0D131F] to-[#090D16] border border-white/10 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>DHOTI AALE Official Command Center</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Governance Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Complete administrative control over village polls, cultural media, directory listings, and resident support with isolated fault-tolerant services.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All 16 Services Operational</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Real-time Supabase Sync</span>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchDashboardData()}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Metrics</span>
            </button>

            <button
              onClick={() => setIsBattleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
            >
              <Swords className="h-4 w-4" />
              <span>Launch Battle</span>
            </button>

            <button
              onClick={() => setIsNewsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Post News</span>
            </button>

            <Link
              href="/admin/ai"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all active:scale-95"
            >
              <Bot className="h-4 w-4 text-purple-400" />
              <span>AI Co-Pilot</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Glow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card) => {
          const Icon = card.icon;
          const isUnavailable = card.value === 'Unavailable';

          return (
            <Link
              key={card.title}
              href={card.href}
              className={`group p-5 rounded-2xl bg-gradient-to-b from-[#0E1422] to-[#090D16] border border-white/6 ${card.border} transition-all duration-200 shadow-lg ${card.glow} hover:-translate-y-0.5 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                    {card.title}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isUnavailable ? 'text-amber-500/70 text-base font-mono' : 'text-white'
                    }`}
                  >
                    {isUnavailable ? 'Unavailable' : card.value}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{card.subtitle}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary Fast Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secondaryCards.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.title}
              href={sec.href}
              className="p-3.5 rounded-xl bg-[#090D16] border border-white/6 hover:border-white/15 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${sec.iconColor}`} />
                <div className="truncate">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    {sec.title}
                  </div>
                  <div className="text-sm font-extrabold text-white">{sec.value}</div>
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-white transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Live Activity & Battles Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Community Battles Arena */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0A0E1A] border border-white/8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/6 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Swords className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Live Community Face-Offs</h3>
                <p className="text-[11px] text-slate-400">Real-time vote tallies directly from PostgreSQL</p>
              </div>
            </div>

            <Link
              href="/admin/battles"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
            >
              <span>Manage Arena</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBattles.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No battles active right now. Click &quot;Launch Battle&quot; above to create one.
              </div>
            ) : (
              recentBattles.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-[#060911] border border-white/6 hover:border-amber-500/30 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-white text-xs truncate">{b.title}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        b.is_ended || b.status === 'closed'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {b.is_ended || b.status === 'closed' ? 'Closed' : 'Active Voting'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Category: <strong className="text-slate-300">{b.category}</strong></span>
                    <span className="font-mono font-bold text-amber-400">
                      {(b.option_a?.votes || 0) + (b.option_b?.votes || 0)} votes
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Registrations & Quick Nav */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0A0E1A] border border-white/8 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/6 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Recent Dhoti Residents</h3>
                  <p className="text-[11px] text-slate-400">Verified members directory</p>
                </div>
              </div>

              <Link
                href="/admin/users"
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 group"
              >
                <span>All Users</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-2">
              {recentUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No recent resident signups</div>
              ) : (
                recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#060911] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-amber-400/40 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{u.email}</div>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('hi-IN') : 'Recent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick links footer */}
          <div className="pt-3 border-t border-white/6 grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/admin/notifications"
              className="p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 text-center font-bold text-slate-300 hover:text-amber-400 transition-colors"
            >
              📢 Broadcast Notice
            </Link>
            <Link
              href="/admin/settings"
              className="p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 text-center font-bold text-slate-300 hover:text-amber-400 transition-colors"
            >
              ⚙️ Portal Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Forms Modals */}
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
