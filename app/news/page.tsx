'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Newspaper,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Share2,
  Calendar,
  Flame,
  Swords,
} from 'lucide-react';
import { NewsItem } from '@/types';
import { NewsCard } from '@/components/NewsCard';
import { NewsReaderModal } from '@/components/NewsReaderModal';
import { AdBanner } from '@/components/AdBanner';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { VIRAL_30_NEWS } from '@/lib/data/viral-news';

// High quality fallback village & trending news articles
const FALLBACK_NEWS: NewsItem[] = VIRAL_30_NEWS;

const CATEGORIES = [
  'सभी',
  'Technology',
  'Finance',
  'Sports',
  'Career',
  'Education',
  'Agriculture',
  'Government Schemes',
  'Entertainment',
  'Development',
  'World',
  'Village Notice 📢',
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
        // Merge API news with FALLBACK_NEWS so no researched posts are ever lost
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
        (selectedCategory === 'Village Notice 📢' && item.category?.includes('Notice'));

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
    // Update URL query param cleanly without reload
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
    <div className="min-h-screen bg-[#05070D] text-slate-100 antialiased pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#05070D]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-cyan-500/40 px-3.5 py-2 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-400" />
            <span>होमपेज (Home)</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Newspaper className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight block">
                ढोटी समाचार
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Village Headlines &amp; Media</span>
            </div>
          </div>

          <button
            onClick={fetchNews}
            disabled={isLoading}
            title="रिफ्रेश करें"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-950 border border-cyan-500/30 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>गाँव की प्रामाणिक आवाज़</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              ढोटी ग्राम समाचार एवं सूचना मंच
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-hindi">
              ढोटी पंचायत, सांगोद, कोटा क्षेत्र के ताजा समाचार, सरकारी योजनाएं, कृषि अपडेट्स और उत्सव की हर खबर सबसे पहले।
            </p>
          </div>

          {/* Decorative Background Circles */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
        </section>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="खबर खोजें (शीर्षक, विषय, लेखक)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 shadow-md transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs font-semibold text-slate-400">
              कुल <strong className="text-cyan-400">{filteredNews.length}</strong> समाचार उपलब्ध
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Story Callout (Latest News Banner) */}
        {filteredNews.length > 0 && selectedCategory === 'सभी' && !searchQuery && (
          <div
            onClick={() => handleReadArticle(filteredNews[0])}
            className="group relative rounded-3xl bg-white border border-stone-200/90 hover:border-amber-400 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Image side */}
              <div className="md:col-span-6 relative aspect-[16/10] md:aspect-auto min-h-[240px] md:min-h-[340px] bg-stone-100 overflow-hidden">
                {filteredNews[0].imageUrl ? (
                  <img
                    src={filteredNews[0].imageUrl}
                    alt={filteredNews[0].title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 p-6 text-center">
                    <Newspaper className="h-12 w-12 text-[#8D2817] mb-2" />
                    <span className="font-bold text-stone-700">ढोटी समाचार</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                  <Flame className="h-3.5 w-3.5" />
                  <span>मुख्य समाचार (Headlines)</span>
                </div>
              </div>

              {/* Text details side */}
              <div className="md:col-span-6 p-5 sm:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-bold text-[#8D2817] px-2.5 py-0.5 rounded-full bg-orange-100">
                      {filteredNews[0].category}
                    </span>
                    <span>•</span>
                    <span>
                      {filteredNews[0].createdAt
                        ? new Date(filteredNews[0].createdAt).toLocaleDateString('hi-IN')
                        : 'ताज़ा'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-2xl font-black text-stone-900 group-hover:text-[#8D2817] transition-colors leading-snug">
                    {filteredNews[0].title}
                  </h2>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                    {filteredNews[0].excerpt || filteredNews[0].content?.slice(0, 180)}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8D2817] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>विस्तार से पढ़ें (Read Story)</span>
                    <span>→</span>
                  </span>
                  <span className="text-xs text-stone-400">
                    स्रोत: {filteredNews[0].author || 'DHOTI AALE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-feed AdBanner for Monetization */}
        <AdBanner slot="2345678901" className="my-4 shadow-xs" label="विज्ञापन / Sponsored" />

        {/* Articles Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-[#8D2817]" />
              <span>ताज़ा समाचार सूची</span>
            </h2>
          </div>

          {filteredNews.length === 0 ? (
            <div className="rounded-3xl bg-white border border-stone-200 p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Newspaper className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800">कोई समाचार नहीं मिला</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                आपके द्वारा चुने गए विषय या खोज शब्द से संबंधित कोई खबर उपलब्ध नहीं है।
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('सभी');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
              >
                सभी समाचार देखें
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredNews.map((item) => (
                <NewsCard key={item.id} item={item} onRead={handleReadArticle} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Reader Modal */}
      <NewsReaderModal
        isOpen={isModalOpen}
        newsItem={selectedNews}
        onClose={handleCloseModal}
        allNews={newsList}
        onSelectNews={(item) => handleReadArticle(item)}
      />

      {/* Mobile Floating App CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-amber-500/40 p-2.5 flex items-center justify-between gap-2 shadow-2xl">
        <PWAInstallButton
          variant="pill"
          className="flex-1 text-center py-2 text-xs font-bold"
        />
        <Link
          href="/#battle"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md text-center"
        >
          <Swords className="w-3.5 h-3.5 shrink-0" />
          <span>फोटो बैटल खेलें</span>
        </Link>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="flex items-center gap-2 text-stone-600 font-bold text-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-[#8D2817]" />
            <span>समाचार लोड हो रहे हैं...</span>
          </div>
        </div>
      }
    >
      <NewsContent />
    </Suspense>
  );
}
