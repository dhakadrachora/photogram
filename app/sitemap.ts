import { MetadataRoute } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.dhotiaale.online';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#battle`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#worldchat`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#assistant`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamically include all published news articles for Googlebot indexing
  const newsUrlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  // 1. Add viral fallback articles
  for (const article of VIRAL_30_NEWS) {
    if (article.id) {
      newsUrlMap.set(article.id, {
        url: `${baseUrl}/news/${encodeURIComponent(article.id)}`,
        lastModified: new Date(article.createdAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // 2. Add Supabase articles if configured
  if (isSupabaseConfigured()) {
    try {
      const sb = createServerClient();
      const { data: dbNews } = await sb
        .from('news')
        .select('id, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbNews) {
        for (const item of dbNews) {
          if (item.id) {
            newsUrlMap.set(item.id, {
              url: `${baseUrl}/news/${encodeURIComponent(item.id)}`,
              lastModified: item.created_at ? new Date(item.created_at) : now,
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        }
      }
    } catch {
      // fallback smoothly to static + viral news
    }
  }

  return [...staticRoutes, ...Array.from(newsUrlMap.values())];
}
