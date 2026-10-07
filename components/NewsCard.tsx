'use client';

import React, { useState } from 'react';
import { Newspaper, Share2, Copy, Check, Calendar, ArrowRight, User, Eye } from 'lucide-react';
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareUrl();
    const cleanExcerpt = (item.excerpt || item.content || '')
      .replace(/[#*`_]/g, '')
      .slice(0, 140)
      .trim();

    const text = `📰 *${item.title}*\n\n${cleanExcerpt}...\n\n👉 पूरी खबर यहाँ पढ़ें:\n${url}\n\n_DHOTI AALE - राजस्थान का डिजिटल मंच_`;
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
      className="group relative flex flex-col justify-between rounded-2xl bg-[#0D1726]/85 border border-white/10 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md"
    >
      <div>
        {/* News Thumbnail Image */}
        <div className="relative w-full aspect-[16/10] bg-[#070B14] overflow-hidden">
          {item.imageUrl && !imageFailed ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageFailed(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1220] to-[#131F35] text-slate-500">
              <Newspaper className="w-10 h-10 text-cyan-500/30 mb-1" />
              <span className="text-[11px] font-hindi text-slate-400">ढोटी गाँव समाचार</span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#05070D]/85 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-md">
              {item.category || 'गाँव समाचार'}
            </span>
          </div>

          {/* Views Counter Badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-black/70 text-slate-300 backdrop-blur-md">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>{(item.views || 48).toLocaleString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              {formattedDate}
            </span>
            {item.author && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 truncate max-w-[120px]">
                  <User className="w-3 h-3 text-cyan-400" />
                  {item.author}
                </span>
              </>
            )}
          </div>

          <h3 className="font-hindi text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>

          <p className="font-hindi text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
            {item.excerpt || item.content || 'विस्तार से खबर पढ़ने के लिए क्लिक करें...'}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-white/5 bg-[#070B14]/40 flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
          पूरी खबर पढ़ें
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="लिंक कॉपी करें"
            aria-label="Copy Link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            title="व्हाट्सएप पर शेयर करें"
            aria-label="Share WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
