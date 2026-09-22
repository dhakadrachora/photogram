import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient } from '@/lib/supabase';
import { DashboardMetrics } from '@/lib/admin/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const sb = createServerClient();

  const metrics: DashboardMetrics = {
    totalUsers: 0,
    activeUsers: 0,
    totalNews: 0,
    publishedNews: 0,
    draftNews: 0,
    activeBattles: 0,
    completedBattles: 0,
    totalVotes: 0,
    totalBusinesses: 0,
    galleryCount: 0,
    videoCount: 0,
    openReports: 0,
    systemStatus: 'Optimal',
  };

  let recentUsers: any[] = [];
  let recentBattles: any[] = [];

  // 1. Users
  try {
    const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true });
    if (!error && count !== null) metrics.totalUsers = count;
  } catch (e) {
    console.warn('[Analytics metric: totalUsers]', e);
  }

  // 2. Active users (online / recent)
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true }).gte('updated_at', oneDayAgo);
    if (!error && count !== null) metrics.activeUsers = count;
    else if (typeof metrics.totalUsers === 'number') metrics.activeUsers = Math.max(1, Math.min(metrics.totalUsers, 1));
  } catch (e) {
    console.warn('[Analytics metric: activeUsers]', e);
  }

  // 3. News (Total, Published, Draft)
  try {
    const { data: newsItems, error } = await sb.from('news').select('id, published');
    if (!error && newsItems) {
      metrics.totalNews = newsItems.length;
      metrics.publishedNews = newsItems.filter((n) => n.published !== false).length;
      metrics.draftNews = newsItems.filter((n) => n.published === false).length;
    }
  } catch (e) {
    console.warn('[Analytics metric: news]', e);
  }

  // 4. Battles (Active, Completed)
  try {
    const { data: battles, error } = await sb.from('battles').select('id, is_ended, status, ends_at');
    if (!error && battles) {
      const now = Date.now();
      const active = battles.filter(
        (b) => !b.is_ended && b.status !== 'closed' && (!b.ends_at || new Date(b.ends_at).getTime() > now)
      ).length;
      metrics.activeBattles = active;
      metrics.completedBattles = battles.length - active;
    }
  } catch (e) {
    console.warn('[Analytics metric: battles]', e);
  }

  // 5. Total Votes
  try {
    const { count, error } = await sb.from('battle_votes').select('*', { count: 'exact', head: true });
    if (!error && count !== null) metrics.totalVotes = count;
  } catch (e) {
    console.warn('[Analytics metric: totalVotes]', e);
  }

  // 6. Businesses
  try {
    const { count, error } = await sb.from('business').select('*', { count: 'exact', head: true });
    if (!error && count !== null) metrics.totalBusinesses = count;
  } catch (e) {
    console.warn('[Analytics metric: totalBusinesses]', e);
  }

  // 7. Gallery
  try {
    const { count, error } = await sb.from('gallery').select('*', { count: 'exact', head: true });
    if (!error && count !== null) metrics.galleryCount = count;
  } catch (e) {
    console.warn('[Analytics metric: galleryCount]', e);
  }

  // 8. Videos
  try {
    const { count, error } = await sb.from('videos').select('*', { count: 'exact', head: true });
    if (!error && count !== null) metrics.videoCount = count;
  } catch (e) {
    console.warn('[Analytics metric: videoCount]', e);
  }

  // 9. Open Reports
  try {
    const { count, error } = await sb.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'Open');
    if (!error && count !== null) metrics.openReports = count;
    else metrics.openReports = 0;
  } catch {
    metrics.openReports = 0;
  }

  // Recent Users
  try {
    const { data, error } = await sb
      .from('users')
      .select('id, name, email, avatar, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error && data) recentUsers = data;
  } catch (e) {
    console.warn('[Analytics: recentUsers]', e);
  }

  // Recent Battles
  try {
    const { data, error } = await sb
      .from('battles')
      .select('id, title, category, is_ended, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error && data) recentBattles = data;
  } catch (e) {
    console.warn('[Analytics: recentBattles]', e);
  }

  // Determine system status
  const unavailableCount = Object.values(metrics).filter((v) => v === 'Unavailable').length;
  if (unavailableCount > 5) {
    metrics.systemStatus = 'Degraded';
  }

  return NextResponse.json({
    success: true,
    data: {
      metrics,
      recentUsers,
      recentBattles,
      timestamp: Date.now(),
    },
  });
}
