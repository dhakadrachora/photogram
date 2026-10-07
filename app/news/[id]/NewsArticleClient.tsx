'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Share2,
  Copy,
  Check,
  Calendar,
  User,
  Eye,
  Volume2,
  VolumeX,
  ZoomIn,
  Newspaper,
  X,
  ArrowRight,
} from 'lucide-react';
import { NewsItem } from '@/types';

interface NewsArticleClientProps {
  newsItem: NewsItem;
  relatedNews: NewsItem[];
}

export function NewsArticleClient({ newsItem, relatedNews }: NewsArticleClientProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<1 | 2 | 3>(2);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/news/${encodeURIComponent(newsItem.id)}`;
  };

  const handleCopyLink = async () => {
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

  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const cleanExcerpt = (newsItem.excerpt || newsItem.content || '')
      .replace(/[#*`_]/g, '')
      .slice(0, 160)
      .trim();

    const text = `📰 *${newsItem.title}*\n\n${cleanExcerpt}...\n\n👉 पूरी खबर यहाँ पढ़ें:\n${url}\n\n_DHOTI AALE - राजस्थान का डिजिटल मंच_`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('आपके ब्राउज़र में आवाज़ (Text-to-Speech) सपोर्ट उपलब्ध नहीं है।');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `${newsItem.title}. ${newsItem.content || newsItem.excerpt || ''}`
      .replace(/[#*`_]/g, '')
      .slice(0, 1000);

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const formattedDate = newsItem.createdAt
    ? new Date(newsItem.createdAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'ताज़ा खबर';

  const renderBoldSpans = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-cyan-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }

      if (trimmed.startsWith('# ')) {
        return (
          <h2
            key={idx}
            className="text-lg sm:text-2xl font-black text-white mt-5 mb-2 pb-1 border-b border-white/10 font-hindi"
          >
            {trimmed.replace('# ', '')}
          </h2>
        );
      }

      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="text-base sm:text-xl font-bold text-cyan-400 mt-4 mb-2 font-hindi"
          >
            {trimmed.replace(/^###?\s+/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-1 leading-relaxed">
            {renderBoldSpans(trimmed.replace(/^[-*]\s+/, ''))}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-300 leading-relaxed sm:leading-loose my-3">
          {renderBoldSpans(trimmed)}
        </p>
      );
    });
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 1) return 'text-sm sm:text-base';
    if (fontSizeLevel === 3) return 'text-lg sm:text-xl';
    return 'text-base sm:text-lg';
  };

  const otherArticles = relatedNews.filter((n) => n.id !== newsItem.id).slice(0, 3);

  return (
    <article className="rounded-3xl bg-[#0B1220] border border-white/10 shadow-2xl overflow-hidden p-5 sm:p-8 space-y-6">
      {/* Category & Date Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Newspaper className="h-3.5 w-3.5" />
            <span>{newsItem.category || 'गाँव समाचार'}</span>
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
        </div>

        {/* Text Size & Audio Narration */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10 text-xs">
            <button
              onClick={() => setFontSizeLevel(1)}
              title="छोटा अक्षर"
              className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                fontSizeLevel === 1 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel(2)}
              title="सामान्य अक्षर"
              className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                fontSizeLevel === 2 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel(3)}
              title="बड़ा अक्षर"
              className={`px-2 py-1 rounded-lg transition-colors font-bold ${
                fontSizeLevel === 3 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              A+
            </button>
          </div>

          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isSpeaking
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30'
            }`}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{isSpeaking ? 'रोकें' : 'सुनें'}</span>
          </button>
        </div>
      </div>

      {/* Headline */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight font-hindi">
          {newsItem.title}
        </h1>

        {/* Author & Readers Count */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            <span>लेखक: {newsItem.author || 'DHOTI AALE'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>{(newsItem.views || 48).toLocaleString()} पाठक</span>
          </div>
        </div>
      </div>

      {/* Featured Banner Image */}
      {newsItem.imageUrl && !imageError && (
        <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#070B14] shadow-xl">
          <img
            src={newsItem.imageUrl}
            alt={newsItem.title}
            className="w-full max-h-[460px] object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            onError={() => setImageError(true)}
          />
          <button
            onClick={() => setIsImageLightboxOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md"
          >
            <ZoomIn className="h-3.5 w-3.5 text-cyan-400" />
            <span>बड़ी तस्वीर देखें</span>
          </button>
        </div>
      )}

      {/* Top Share Actions Bar */}
      <div className="p-4 rounded-2xl bg-[#0D1726] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Share2 className="h-4 w-4 text-cyan-400" />
          <span>गाँव के व्हाट्सएप ग्रुप में शेयर करें:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>WhatsApp पर शेयर करें</span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'लिंक कॉपी हो गया!' : 'लिंक कॉपी'}</span>
          </button>
        </div>
      </div>

      {/* Excerpt Lead */}
      {newsItem.excerpt && (
        <div className="p-4 sm:p-5 rounded-2xl bg-cyan-500/10 border-l-4 border-cyan-400 text-slate-200 text-sm sm:text-base font-medium leading-relaxed italic">
          {newsItem.excerpt}
        </div>
      )}

      {/* Main Body Content */}
      <div className={`prose max-w-none font-hindi ${getFontSizeClass()} text-slate-200`}>
        {renderFormattedContent(newsItem.content || newsItem.excerpt || '')}
      </div>

      {/* Related News Stories */}
      {otherArticles.length > 0 && (
        <div className="pt-8 border-t border-white/10">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 font-hindi">
            अन्य संबंधित समाचार (Related Stories)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/news/${encodeURIComponent(rel.id)}`}
                className="p-4 rounded-2xl bg-[#0D1726] hover:bg-[#132238] border border-white/10 hover:border-cyan-500/40 transition-all group"
              >
                <span className="text-[10px] font-bold text-cyan-400 mb-1.5 block">
                  {rel.category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 line-clamp-2 leading-snug">
                  {rel.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isImageLightboxOpen && newsItem.imageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsImageLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-cyan-400 font-bold flex items-center gap-1 text-xs"
            >
              <X className="h-5 w-5" />
              <span>बंद करें</span>
            </button>
            <img
              src={newsItem.imageUrl}
              alt={newsItem.title}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </article>
  );
}
