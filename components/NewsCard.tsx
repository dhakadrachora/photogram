'use client';

import React, { useState } from 'react';
import { Newspaper, Share2, Copy, Check, Calendar, ArrowRight, User } from 'lucide-react';
import { NewsItem } from '@/types';

interface NewsCardProps {
  item: NewsItem;
  onRead: (item: NewsItem) => void;
  compact?: boolean;
}

export function NewsCard({ item, onRead, compact = false }: NewsCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/news?id=${encodeURIComponent(item.id)}`;
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareUrl();
    const cleanExcerpt = (item.excerpt || item.content || '')
      .replace(/[#*`_]/g, '')
      .slice(0, 140)
      .trim();

    const text = `📰 *${item.title}*\n\n${cleanExcerpt}...\n\n👉 पूरी खबर यहाँ पढ़ें:\n${url}\n\n_DHOTI AALE_`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'ताज़ा';

  return (
    <article
      onClick={() => onRead(item)}
      className="group relative flex flex-col justify-between bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div>
        {/* News Thumbnail Image */}
        <div className="relative w-full aspect-[16/10] bg-stone-100 overflow-hidden">
          {item.imageUrl && !imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageFailed(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-stone-100 text-stone-400 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-amber-200 flex items-center justify-center text-[#8D2817] mb-2 shadow-xs">
                <Newspaper className="h-6 w-6 text-[#8D2817]" />
              </div>
              <span className="text-[11px] font-bold text-stone-600 font-hindi">ढोटी ग्राम समाचार</span>
            </div>
          )}

          {/* Category Pill Tag */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-[#8D2817] shadow-xs border border-stone-200/80">
              {item.category || 'गाँव समाचार'}
            </span>
          </div>

          {/* Quick Floating Share Icon on Image */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleShareWhatsApp}
              title="WhatsApp पर शेयर करें"
              className="p-1.5 rounded-full bg-[#25D366] text-white hover:scale-110 shadow-md transition-transform"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </button>
            <button
              onClick={handleCopyLink}
              title="लिंक कॉपी करें"
              className="p-1.5 rounded-full bg-white/95 text-stone-700 hover:text-stone-900 hover:scale-110 shadow-md transition-transform"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Metadata */}
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-stone-400" />
              <span>{formattedDate}</span>
            </span>
            <span className="truncate max-w-[120px] text-stone-400">
              {item.author || 'DHOTI AALE'}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#8D2817] transition-colors">
            {item.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {item.excerpt || item.content?.slice(0, 120)}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8D2817] group-hover:translate-x-0.5 transition-transform">
          <span>पूरा पढ़ें</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>

        <div className="flex items-center gap-1.5">
          {/* WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            title="WhatsApp पर शेयर करें"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-emerald-700 hover:text-white text-[11px] font-bold transition-colors"
          >
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLink}
            title="लिंक कॉपी करें"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'कॉपी!' : 'लिंक'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
