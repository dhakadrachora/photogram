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
    let newsItems = Array.from(contentStore.news.values()).filter((n) => n.published);
    if (newsItems.length === 0) {
      newsItems = VIRAL_30_NEWS;
      for (const item of VIRAL_30_NEWS) contentStore.news.set(item.id, item);
    }

    if (singleId) {
      const item = contentStore.news.get(singleId) || VIRAL_30_NEWS.find((n) => n.id === singleId);
      if (item && item.published) {
        responseData.newsItem = item;
      }
    }
    responseData.news = newsItems.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
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
