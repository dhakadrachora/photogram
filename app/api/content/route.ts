import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';
import {
  fetchSupabaseNews,
  fetchSupabasePeople,
  fetchSupabaseBusiness,
  fetchSupabaseGallery,
  fetchSupabaseVideos,
  fetchSupabaseUpdates,
  isSupabaseConfigured,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  // Sync with Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      if (type === 'all' || type === 'news') {
        const sbNews = await fetchSupabaseNews();
        if (sbNews && sbNews.length > 0) {
          for (const item of sbNews) {
            contentStore.news.set(item.id, item);
          }
        }
      }

      if (type === 'all' || type === 'people') {
        const sbPeople = await fetchSupabasePeople();
        if (sbPeople && sbPeople.length > 0) {
          for (const item of sbPeople) {
            contentStore.people.set(item.id, item);
          }
        }
      }

      if (type === 'all' || type === 'business') {
        const sbBusiness = await fetchSupabaseBusiness();
        if (sbBusiness && sbBusiness.length > 0) {
          for (const item of sbBusiness) {
            contentStore.business.set(item.id, item);
          }
        }
      }

      if (type === 'all' || type === 'gallery') {
        const sbGallery = await fetchSupabaseGallery();
        if (sbGallery && sbGallery.length > 0) {
          for (const item of sbGallery) {
            contentStore.gallery.set(item.id, item);
          }
        }
      }

      if (type === 'all' || type === 'videos') {
        const sbVideos = await fetchSupabaseVideos();
        if (sbVideos && sbVideos.length > 0) {
          for (const item of sbVideos) {
            contentStore.videos.set(item.id, item);
          }
        }
      }

      if (type === 'all' || type === 'updates') {
        const sbUpdates = await fetchSupabaseUpdates();
        if (sbUpdates && sbUpdates.length > 0) {
          for (const item of sbUpdates) {
            contentStore.updates.set(item.id, item);
          }
        }
      }
    } catch (err) {
      console.warn('Error syncing content with Supabase:', err);
    }
  }

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
