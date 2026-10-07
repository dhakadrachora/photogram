'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Newspaper,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Share2,
  Calendar,
  Eye,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { NewsItem } from '@/types';
import { AppShell } from '@/components/app/AppShell';
import { NewsCard } from '@/components/NewsCard';
import { NewsReaderModal } from '@/components/NewsReaderModal';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';

const FALLBACK_NEWS: NewsItem[] = VIRAL_30_NEWS;

const CATEGORIES = [
  'सभी',
  'गाँव समाचार',
  'कृषि एवं मौसम',
  'शिक्षा एवं युवा',
  'विकास कार्य',
  'सांस्कृतिक उत्सव',
  'सरकारी अपडेट',
  'अन्य',
];

function NewsContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  const [newsList, setNewsList] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch news from API
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/content?type=news', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.news) && data.news.length > 0) {
        const mergedMap = new Map<string, NewsItem>();
        for (const item of FALLBACK_NEWS) {
          if (item && item.id) mergedMap.set(item.id, item);
        }
        for (const item of data.news) {
          if (item && item.id) mergedMap.set(item.id, item);
        }
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
        );
        setNewsList(mergedList);
      }
    } catch (e) {
      console.warn('Could not fetch news, using fallback list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle direct link with ?id=xyz
  useEffect(() => {
    if (queryId && newsList.length > 0) {
      const target = newsList.find((n) => n.id === queryId);
      if (target) {
        setSelectedNews(target);
        setIsModalOpen(true);
      }
    }
  }, [queryId, newsList]);

  // Filtered news
  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      const matchCategory =
        selectedCategory === 'सभी' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'गाँव समाचार' && item.category?.includes('गाँव')) ||
        (selectedCategory === 'कृषि एवं मौसम' && (item.category?.includes('कृषि') || item.category?.includes('मौसम') || item.category?.includes('Agriculture'))) ||
        (selectedCategory === 'शिक्षा एवं युवा' && (item.category?.includes('शिक्षा') || item.category?.includes('युवा') || item.category?.includes('Education'))) ||
        (selectedCategory === 'विकास कार्य' && (item.category?.includes('विकास') || item.category?.includes('Development'))) ||
        (selectedCategory === 'सरकारी अपडेट' && (item.category?.includes('सरकार') || item.category?.includes('Government') || item.category?.includes('योजना')));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.excerpt?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [newsList, selectedCategory, searchQuery]);

  const handleReadArticle = (item: NewsItem) => {
    setSelectedNews(item);
    setIsModalOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      const newUrl = `${window.location.pathname}?id=${encodeURIComponent(item.id)}`;
      window.history.pushState({ id: item.id }, '', newUrl);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  return (
    <AppShell>
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 border border-white/10 bg-[#0B1220] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <Newspaper className="w-3.5 h-3.5" />
            <span>गाँव की सच्ची और सटीक जानकारी</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-hindi leading-snug mb-3">
            ढोटी समाचार एवं अपडेट
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-hindi leading-relaxed">
            गाँव के विकास कार्य, कृषि, मौसम, सरकारी योजनाएं और सांस्कृतिक कार्यक्रमों की सबसे ताज़ा रिपोर्ट।
          </p>
        </div>

        {/* Live News Stats Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {newsList.length}+
              </span>
              <span className="block text-xs text-slate-400">कुल प्रकाशित खबरें</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                100%
              </span>
              <span className="block text-xs text-slate-400">सत्यापित स्थानीय स्रोत</span>
            </div>
          </div>

          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>रिफ्रेश करें</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खबरें खोजें (Search by title, topic, or author)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0D1726] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              साफ़ करें
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-[#0D1726] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} onRead={handleReadArticle} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0D1726] border border-white/10 p-12 text-center max-w-md mx-auto my-8">
          <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1 font-hindi">
            अभी कोई नई खबर नहीं है।
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            कृपया दूसरी श्रेणी चुनें या खोज शब्द बदलें।
          </p>
          <button
            onClick={() => {
              setSelectedCategory('सभी');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            सभी खबरें देखें
          </button>
        </div>
      )}

      {/* News Reader Modal */}
      <NewsReaderModal
        newsItem={selectedNews}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        allNews={newsList}
        onSelectNews={(nextItem) => {
          setSelectedNews(nextItem);
          if (typeof window !== 'undefined' && window.history) {
            const newUrl = `${window.location.pathname}?id=${encodeURIComponent(nextItem.id)}`;
            window.history.pushState({ id: nextItem.id }, '', newUrl);
          }
        }}
      />
    </AppShell>
  );
}

export default function NewsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 font-hindi">खबरें लोड हो रही हैं...</p>
          </div>
        </AppShell>
      }
    >
      <NewsContent />
    </Suspense>
  );
}
