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

// 60-second in-memory cache TTL to eliminate database bottlenecks
const CACHE_TTL_MS = 60 * 1000;
let lastSyncTimestamp = 0;
let isSyncInProgress = false;

export function invalidateContentCache() {
  lastSyncTimestamp = 0;
}

export async function syncAllContentFromSupabase() {
  if (!isSupabaseConfigured()) return;
  if (isSyncInProgress) return;
  if (Date.now() - lastSyncTimestamp < CACHE_TTL_MS) return;

  isSyncInProgress = true;
  try {
    // Parallel fetch of all tables simultaneously
    const [sbNews, sbPeople, sbBusiness, sbGallery, sbVideos, sbUpdates] =
      await Promise.all([
        fetchSupabaseNews().catch(() => []),
        fetchSupabasePeople().catch(() => []),
        fetchSupabaseBusiness().catch(() => []),
        fetchSupabaseGallery().catch(() => []),
        fetchSupabaseVideos().catch(() => []),
        fetchSupabaseUpdates().catch(() => []),
      ]);

    if (Array.isArray(sbNews) && sbNews.length > 0) {
      for (const item of sbNews) contentStore.news.set(item.id, item);
    }
    if (Array.isArray(sbPeople) && sbPeople.length > 0) {
      for (const item of sbPeople) contentStore.people.set(item.id, item);
    }
    if (Array.isArray(sbBusiness) && sbBusiness.length > 0) {
      for (const item of sbBusiness) contentStore.business.set(item.id, item);
    }
    if (Array.isArray(sbGallery) && sbGallery.length > 0) {
      for (const item of sbGallery) contentStore.gallery.set(item.id, item);
    }
    if (Array.isArray(sbVideos) && sbVideos.length > 0) {
      for (const item of sbVideos) contentStore.videos.set(item.id, item);
    }
    if (Array.isArray(sbUpdates) && sbUpdates.length > 0) {
      for (const item of sbUpdates) contentStore.updates.set(item.id, item);
    }

    lastSyncTimestamp = Date.now();
  } catch (e) {
    console.error('Content parallel sync error:', e);
  } finally {
    isSyncInProgress = false;
  }
}
