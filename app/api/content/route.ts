import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  const responseData: Record<string, any> = {};

  if (type === 'all' || type === 'updates') {
    responseData.updates = Array.from(contentStore.updates.values())
      .filter((u) => u.published)
      .reverse();
  }

  if (type === 'all' || type === 'news') {
    responseData.news = Array.from(contentStore.news.values())
      .filter((n) => n.published)
      .reverse();
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
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
