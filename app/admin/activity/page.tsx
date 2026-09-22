'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollText, Clock, UserPlus, Swords, Newspaper, Bell, RefreshCw } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';

interface ActivityItem {
  id: string;
  type: 'user' | 'battle' | 'news' | 'update';
  title: string;
  details: string;
  timestamp: string;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    setIsLoading(true);

    const [usersRes, battlesRes, newsRes] = await Promise.all([
      adminFetch('/api/admin/users?limit=10'),
      adminFetch('/api/battles'),
      adminFetch('/api/admin/content?type=news&limit=10'),
    ]);

    setIsLoading(false);

    const feed: ActivityItem[] = [];

    if (usersRes.success && usersRes.data) {
      for (const u of usersRes.data) {
        feed.push({
          id: `u_${u.id}`,
          type: 'user',
          title: 'New Resident Registration',
          details: `${u.name} registered (${u.email})`,
          timestamp: u.created_at || new Date().toISOString(),
        });
      }
    }

    if (battlesRes.success && battlesRes.battles) {
      for (const b of battlesRes.battles) {
        feed.push({
          id: `b_${b.id}`,
          type: 'battle',
          title: 'Community Battle Update',
          details: `Battle "${b.title}" (${b.status || 'active'}) with ${b.totalVotes || 0} votes`,
          timestamp: b.startsAt ? new Date(b.startsAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    if (newsRes.success && newsRes.data) {
      for (const n of newsRes.data) {
        feed.push({
          id: `n_${n.id}`,
          type: 'news',
          title: 'News Article Published/Updated',
          details: `"${n.title}" under ${n.category || 'गाँव समाचार'}`,
          timestamp: n.created_at || new Date().toISOString(),
        });
      }
    }

    // Sort by timestamp descending
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(feed);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">System & Community Activity Feed</h2>
          <p className="text-xs text-slate-400">
            Real-time chronological events from portal database tables.
          </p>
        </div>

        <button
          onClick={fetchActivity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Aggregating database events...</div>
      ) : activities.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No activity records found.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item) => {
            let Icon = ScrollText;
            let iconColor = 'text-amber-400';
            let iconBg = 'bg-amber-500/10 border-amber-500/20';

            if (item.type === 'user') {
              Icon = UserPlus;
              iconColor = 'text-sky-400';
              iconBg = 'bg-sky-500/10 border-sky-500/20';
            } else if (item.type === 'battle') {
              Icon = Swords;
              iconColor = 'text-purple-400';
              iconBg = 'bg-purple-500/10 border-purple-500/20';
            } else if (item.type === 'news') {
              Icon = Newspaper;
              iconColor = 'text-rose-400';
              iconBg = 'bg-rose-500/10 border-rose-500/20';
            }

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${iconBg} ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-white text-xs">{item.title}</div>
                    <div className="text-xs text-slate-300">{item.details}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(item.timestamp).toLocaleString('hi-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
