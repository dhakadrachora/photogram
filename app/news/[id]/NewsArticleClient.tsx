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
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const cleanExcerpt = (newsItem.excerpt || newsItem.content || '')
      .replace(/[#*`_]/g, '')
      .slice(0, 160)
      .trim();

    const text = `📰 *${newsItem.title}*\n\n${cleanExcerpt}...\n\n👉 पूरी खबर यहाँ पढ़ें:\n${url}\n\n_DHOTI AALE_`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('आपके डिवाइस में आवाज़ (Text-to-Speech) सपोर्ट उपलब्ध नहीं है।');
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
      .replace(/\n+/g, ' ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes('hi') || v.name.includes('Hindi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const formattedDate = newsItem.createdAt
    ? new Date(newsItem.createdAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'ताज़ा समाचार';

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
            className="text-lg sm:text-xl font-black text-stone-900 mt-5 mb-2 pb-1 border-b border-stone-200"
          >
            {trimmed.replace('# ', '')}
          </h2>
        );
      }

      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="text-base sm:text-lg font-bold text-stone-900 mt-4 mb-2 text-[#8D2817]"
          >
            {trimmed.replace(/^###?\s+/, '')}
          </h3>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-stone-700 my-1 leading-relaxed">
            {renderBoldSpans(trimmed.replace(/^[-*]\s+/, ''))}
          </li>
        );
      }

      return (
        <p key={idx} className="text-stone-700 leading-relaxed sm:leading-loose my-2.5">
          {renderBoldSpans(trimmed)}
        </p>
      );
    });
  };

  const renderBoldSpans = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-stone-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 1) return 'text-sm sm:text-base';
    if (fontSizeLevel === 3) return 'text-lg sm:text-xl';
    return 'text-base sm:text-lg';
  };

  const otherArticles = relatedNews.filter((n) => n.id !== newsItem.id).slice(0, 3);

  return (
    <article className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden p-5 sm:p-8 space-y-6">
      {/* Category & Date Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#8D2817] border border-orange-200">
            <Newspaper className="h-3.5 w-3.5" />
            <span>{newsItem.category || 'गाँव समाचार'}</span>
          </span>
          <span className="text-xs text-stone-400">•</span>
          <span className="text-xs text-stone-500 font-medium">{formattedDate}</span>
        </div>

        {/* Text Size & Audio Narration */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200 text-xs">
            <button
              onClick={() => setFontSizeLevel(1)}
              title="छोटा अक्षर"
              className={`px-2 py-1 font-bold rounded-lg ${fontSizeLevel === 1 ? 'bg-white shadow-xs' : 'text-stone-500'}`}
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel(2)}
              title="सामान्य अक्षर"
              className={`px-2 py-1 font-bold rounded-lg ${fontSizeLevel === 2 ? 'bg-white shadow-xs' : 'text-stone-500'}`}
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel(3)}
              title="बड़ा अक्षर"
              className={`px-2 py-1 font-bold rounded-lg ${fontSizeLevel === 3 ? 'bg-white shadow-xs' : 'text-stone-500'}`}
            >
              A+
            </button>
          </div>

          <button
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isSpeaking
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-amber-700" />}
            <span>{isSpeaking ? 'रोकें' : 'खबर सुनें'}</span>
          </button>
        </div>
      </div>

      {/* Main Headline */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 leading-tight tracking-tight">
          {newsItem.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1 font-medium text-stone-600">
            <User className="h-3.5 w-3.5 text-amber-600" />
            <span>लेखक: {newsItem.author || 'DHOTI AALE'}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            <span>{formattedDate}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-stone-400" />
            <span>{newsItem.views || 1} पाठक</span>
          </span>
        </div>
      </div>

      {/* Featured News Image */}
      {newsItem.imageUrl && !imageError ? (
        <div className="relative group rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200 bg-stone-100 shadow-md">
          <img
            src={newsItem.imageUrl}
            alt={newsItem.title}
            className="w-full max-h-[460px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            onError={() => setImageError(true)}
          />
          <button
            onClick={() => setIsImageLightboxOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/85 text-white text-[11px] font-medium backdrop-blur-md transition-all shadow-md"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span>बड़ी तस्वीर देखें (Zoom)</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-stone-100 border border-amber-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#8D2817] flex items-center justify-center shrink-0 border border-amber-300">
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#8D2817] uppercase tracking-wider">
              {newsItem.category || 'ढोटी समाचार'}
            </div>
            <div className="text-sm font-semibold text-stone-800">{newsItem.title}</div>
          </div>
        </div>
      )}

      {/* Share Bar */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
          <Share2 className="h-4 w-4 text-[#8D2817]" />
          <span>गाँव के व्हाट्सएप ग्रुप में शेयर करें:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>WhatsApp पर शेयर</span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'लिंक कॉपी हो गया!' : 'लिंक कॉपी करें'}</span>
          </button>
        </div>
      </div>

      {/* Excerpt Callout */}
      {newsItem.excerpt && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border-l-4 border-amber-500 text-stone-800 text-sm font-medium leading-relaxed italic">
          {newsItem.excerpt}
        </div>
      )}

      {/* Full Content */}
      <div className={`prose max-w-none font-hindi ${getFontSizeClass()} text-stone-800`}>
        {renderFormattedContent(newsItem.content || newsItem.excerpt || '')}
      </div>

      {/* Related News List */}
      {otherArticles.length > 0 && (
        <div className="pt-8 border-t border-stone-200 space-y-4">
          <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">
            अन्य मुख्य गाँव समाचार (Other Headlines)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/news/${encodeURIComponent(rel.id)}`}
                className="p-3.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-all hover:border-amber-400 block group"
              >
                <div className="text-[10px] font-bold text-[#8D2817] mb-1">
                  {rel.category}
                </div>
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#8D2817] line-clamp-2 leading-snug">
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
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setIsImageLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsImageLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-stone-300 font-bold flex items-center gap-1 text-xs"
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
