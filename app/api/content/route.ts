import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';
import { syncAllContentFromSupabase } from '@/lib/cache/content-cache';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  // Synchronize in-memory cache if stale
  await syncAllContentFromSupabase();

  const responseData: Record<string, any> = {};

  if (type === 'all' || type === 'updates') {
    responseData.updates = Array.from(contentStore.updates.values())
      .filter((u) => u.published)
      .reverse();
  }

  const singleId = searchParams.get('id');

  if (type === 'all' || type === 'news') {
    const storeItems = Array.from(contentStore.news.values()).filter((n) => n.published);
    const combinedMap = new Map<string, any>();
    for (const item of VIRAL_30_NEWS) {
      if (item && item.id) combinedMap.set(item.id, item);
    }
    for (const item of storeItems) {
      if (item && item.id) combinedMap.set(item.id, item);
    }
    const allNews = Array.from(combinedMap.values()).sort(
      (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
    );

    if (singleId) {
      const item = combinedMap.get(singleId);
      if (item) {
        responseData.newsItem = item;
      }
    }
    responseData.news = allNews;
  }

  if (type === 'all' || type === 'people') {
    responseData.people = Array.from(contentStore.people.values())
      .filter((p) => p.published)
      .reverse();
  }

  if (type === 'all' || type === 'business') {
    responseData.business = Array.from(contentStore.business.values())
      .filter((b) => b.published)
      .reverse();
  }

  if (type === 'all' || type === 'gallery') {
    responseData.gallery = Array.from(contentStore.gallery.values())
      .filter((g) => g.published)
      .reverse();
  }

  if (type === 'all' || type === 'videos') {
    responseData.videos = Array.from(contentStore.videos.values())
      .filter((v) => v.published)
      .reverse();
  }

  if (type === 'all' || type === 'settings') {
    responseData.settings = contentStore.settings;
  }

  return NextResponse.json(responseData, {
    headers: {
      'Cache-Control': 'public, max-age=15, stale-while-revalidate=45',
    },
  });
}
