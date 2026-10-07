import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Newspaper, ArrowLeft } from 'lucide-react';
import { createServerClient } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { NewsArticleClient } from './NewsArticleClient';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';
import { AppShell } from '@/components/app/AppShell';

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
        published: item.published ?? true,
        createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        views: item.views || 0,
      }));
    }
  } catch (e) {
    console.error('Error fetching all news items from supabase:', e);
  }

  return VIRAL_30_NEWS.slice(0, 6);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getNewsItem(id);

  if (!item) {
    return {
      title: 'समाचार उपलब्ध नहीं है | DHOTI AALE',
      description: 'ढोटी गाँव का आधिकारिक डिजिटल समाचार पोर्टल।',
    };
  }

  const cleanDescription = (item.excerpt || item.content || item.title)
    .replace(/[#*`_]/g, '')
    .slice(0, 160)
    .trim();

  const ogImage = item.imageUrl || 'https://www.dhotiaale.online/app-logo.png';

  return {
    title: `${item.title} | DHOTI AALE`,
    description: cleanDescription,
    authors: [{ name: item.author || 'DHOTI AALE Team' }],
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
      <AppShell>
        <div className="flex items-center justify-center py-20 p-4">
          <div className="max-w-md w-full bg-[#0D1726] p-8 rounded-3xl border border-white/10 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Newspaper className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black text-white font-hindi">समाचार उपलब्ध नहीं है</h1>
            <p className="text-xs text-slate-400 font-hindi">
              यह समाचार हटाया जा चुका है या लिंक गलत है।
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>सभी समाचार देखें</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Schema.org NewsArticle Structured Data */}
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
              name: item.author || 'DHOTI AALE',
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

      <div className="max-w-4xl mx-auto pt-2 pb-12">
        <div className="mb-4">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>सभी समाचार (All News)</span>
          </Link>
        </div>

        <NewsArticleClient newsItem={item} relatedNews={allNews} />
      </div>
    </AppShell>
  );
}
