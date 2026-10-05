import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Newspaper, ArrowLeft, RefreshCw } from 'lucide-react';
import { createServerClient } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { NewsArticleClient } from './NewsArticleClient';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getNewsItem(id: string): Promise<NewsItem | null> {
  try {
    const sb = createServerClient();
    const { data, error } = await sb
      .from('news')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        category: data.category,
        excerpt: data.excerpt,
        content: data.content,
        imageUrl: data.image_url || data.imageUrl || '',
        author: data.author || 'DHOTI AALE',
        published: data.published ?? true,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        views: data.views || 0,
      };
    }
  } catch (e) {
    console.error('Error fetching news server item from supabase:', e);
  }

  // Fallback to local 30 viral news
  const fallback = VIRAL_30_NEWS.find((n) => n.id === id);
  return fallback || null;
}

async function getAllNews(): Promise<NewsItem[]> {
  try {
    const sb = createServerClient();
    const { data } = await sb
      .from('news')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data && data.length > 0) {
      return (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        excerpt: item.excerpt,
        content: item.content,
        imageUrl: item.image_url || item.imageUrl || '',
        author: item.author || 'DHOTI AALE',
        published: true,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        views: item.views || 0,
      }));
    }
  } catch {
    // ignore
  }

  return VIRAL_30_NEWS.slice(0, 6);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getNewsItem(id);

  if (!item) {
    return {
      title: 'समाचार | DHOTI AALE',
      description: 'ढोटी ग्राम समाचार मंच',
    };
  }

  const cleanDescription = item.excerpt || item.content?.slice(0, 150) || 'ढोटी समाचार';
  const ogImage = item.imageUrl || 'https://www.dhotiaale.online/app-logo.png';

  return {
    title: `${item.title} | ढोटी समाचार`,
    description: cleanDescription,
    alternates: {
      canonical: `https://www.dhotiaale.online/news/${encodeURIComponent(item.id)}`,
    },
    openGraph: {
      title: item.title,
      description: cleanDescription,
      url: `https://www.dhotiaale.online/news/${encodeURIComponent(item.id)}`,
      siteName: 'DHOTI AALE',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: cleanDescription,
      images: [ogImage],
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [item, allNews] = await Promise.all([getNewsItem(id), getAllNews()]);

  if (!item) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-stone-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#8D2817] flex items-center justify-center mx-auto">
            <Newspaper className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-stone-900">समाचार उपलब्ध नहीं है</h1>
          <p className="text-xs text-stone-500">
            यह समाचार हटाया जा चुका है या लिंक गलत है।
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>सभी समाचार देखें (View All News)</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 antialiased pb-16">
      {/* Schema.org NewsArticle Structured Data for Google News & Search Ranking */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: item.title,
            description: item.excerpt || item.content?.slice(0, 160) || item.title,
            image: item.imageUrl ? [item.imageUrl] : ['https://www.dhotiaale.online/app-logo.png'],
            datePublished: new Date(item.createdAt).toISOString(),
            dateModified: new Date(item.createdAt).toISOString(),
            author: {
              '@type': 'Person',
              name: item.author || 'DHOTI AALE Editorial',
            },
            publisher: {
              '@type': 'Organization',
              name: 'DHOTI AALE',
              logo: {
                '@type': 'ImageObject',
                url: 'https://www.dhotiaale.online/app-logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://www.dhotiaale.online/news/${encodeURIComponent(item.id)}`,
            },
          }),
        }}
      />

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-[#8D2817] bg-stone-100 hover:bg-stone-200/80 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>सभी समाचार (All News)</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <img src="/app-logo.png" alt="DHOTI AALE" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-black text-stone-900 text-xs sm:text-sm">DHOTI AALE</span>
          </Link>
        </div>
      </header>

      {/* Main Story Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <NewsArticleClient newsItem={item} relatedNews={allNews} />
      </main>
    </div>
  );
}
