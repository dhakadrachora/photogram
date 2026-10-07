'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Search,
  Sparkles,
  Flame,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { ToolCard, ToolItem } from '@/components/tools/ToolCard';

const VIRAL_TOOLS_DATA: ToolItem[] = [
  {
    id: 'qr-generator',
    title: 'QR Code Generator',
    description: 'किसी भी वेबसाइट, व्हाट्सएप, टेक्स्ट या वाईफाई के लिए एचडी क्यूआर कोड बनाएं व डाउनलोड करें।',
    category: 'Utility',
    icon: '📱',
    href: '/tools/qr-generator',
    badge: '100% Free',
    isPopular: true,
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor (MB to KB)',
    description: 'फोटो की क्वालिटी खोए बिना इमेज का साइज़ तुरंत कम करें और मोबाइल डेटा बचाएं।',
    category: 'Image',
    icon: '🗜️',
    href: '/tools/image-compressor',
    badge: 'फास्ट',
    isPopular: true,
  },
  {
    id: 'youtube',
    title: 'YouTube Thumbnail Downloader',
    description: 'किसी भी यूट्यूब वीडियो का 4K व Full HD थंबनेल एक क्लिक में डाउनलोड करें।',
    category: 'YouTube',
    icon: '🎬',
    href: '/tools/youtube',
    badge: 'HD/4K',
    isPopular: true,
  },
  {
    id: 'hashtag-generator',
    title: 'Viral Hashtag Generator',
    description: 'इंस्टाग्राम रील्स और यूट्यूब शॉर्ट्स के लिए ट्रेंडिंग राजस्थानी व वायरल हैशटैग खोजें।',
    category: 'Instagram',
    icon: '#️⃣',
    href: '/tools/hashtag-generator',
    badge: 'ट्रेंडिंग',
    isPopular: true,
  },
  {
    id: 'bio-generator',
    title: 'Desi Bio Generator',
    description: 'इंस्टाग्राम और व्हाट्सएप के लिए रॉयल, देसी, धाकड़ और एटीट्यूड बायो बनाएं।',
    category: 'Social',
    icon: '✍️',
    href: '/tools/bio-generator',
    badge: 'रॉयल',
  },
  {
    id: 'instagram',
    title: 'Instagram Caption & Font Styler',
    description: 'रील्स के लिए आकर्षक कैप्शन्स और स्टाइलिश फॉन्ट बनाएं और सीधे कॉपी करें।',
    category: 'Instagram',
    icon: '📸',
    href: '/tools/instagram',
    badge: 'स्टाइलिश',
  },
  {
    id: 'image-resizer',
    title: 'Photo Resizer & Dimension Tool',
    description: 'सरकारी फॉर्म, आधार, पैन या प्रोफाइल के लिए फोटो की सटीक चौड़ाई और ऊंचाई सेट करें।',
    category: 'Image',
    icon: '📐',
    href: '/tools/image-resizer',
    badge: 'उपयोगी',
  },
  {
    id: 'background-remover',
    title: 'Color Background Remover',
    description: 'सफेद, हरे या किसी भी ठोस बैकग्राउंड को हटाकर ट्रांसपेरेंट PNG इमेज बनाएं।',
    category: 'Image',
    icon: '✂️',
    href: '/tools/background-remover',
    badge: 'PNG',
  },
  {
    id: 'whatsapp-direct',
    title: 'WhatsApp Direct Chat',
    description: 'बिना फोन नंबर सेव किए सीधे किसी भी व्हाट्सएप नंबर पर संदेश भेजें।',
    category: 'Social',
    icon: '💬',
    href: '/tools/whatsapp-direct',
    badge: 'डायरेक्ट',
  },
  {
    id: 'upi-qr',
    title: 'UPI Payment QR Generator',
    description: 'दुकान या दोस्तों से पेमेंट प्राप्त करने के लिए अपना कस्टम UPI QR कोड बनाएं।',
    category: 'Utility',
    icon: '💳',
    href: '/tools/upi-qr',
    badge: 'पेमेंट',
  },
  {
    id: 'unit-converter',
    title: 'Rajasthan Land & Bigha Converter',
    description: 'बीघा, बिस्वा, एकड़, हेक्टेयर, गज और स्क्वायर फीट का सटीक देसी ज़मीनी कैलकुलेटर।',
    category: 'Utility',
    icon: '🌾',
    href: '/tools/unit-converter',
    badge: 'देसी ज़मीन',
  },
  {
    id: 'age-calculator',
    title: 'Age & Birthday Calculator',
    description: 'अपनी सटीक उम्र वर्ष, महीने, दिन, घंटे और अगले जन्मदिन का काउंटडाउन जानें।',
    category: 'Utility',
    icon: '🎂',
    href: '/tools/age-calculator',
  },
  {
    id: 'text-case',
    title: 'Text Case & URL Slug Converter',
    description: 'टेक्स्ट को Uppercase, Lowercase, Title Case या वेबसाइट लिंक स्लग में बदलें।',
    category: 'Utility',
    icon: '🔤',
    href: '/tools/text-case',
  },
  {
    id: 'password-generator',
    title: 'Secure Password & PIN Generator',
    description: 'बैंकिंग, वाईफाई और सोशल मीडिया अकाउंट्स के लिए अटूट पासवर्ड और पिन बनाएं।',
    category: 'Utility',
    icon: '🔒',
    href: '/tools/password-generator',
  },
  {
    id: 'reels-boost-tool',
    title: '100 Free Reels Booster',
    description: 'हर 3 घंटे में अपनी रील का लिंक डालें और मुफ़्त व्यूज बूस्ट क्लेम करें।',
    category: 'Instagram',
    icon: '🚀',
    href: '/rewards',
    badge: 'फ्री बूस्ट',
  },
];

const CATEGORIES = ['All', 'Instagram', 'YouTube', 'Image', 'Social', 'Utility'];

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = useMemo(() => {
    return VIRAL_TOOLS_DATA.filter((tool) => {
      const matchCat =
        selectedCategory === 'All' || tool.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <AppShell>
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10 bg-[#0B1220] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <Wrench className="w-3.5 h-3.5" />
            <span>सुपरफास्ट और 100% मुफ़्त टूल्स</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-hindi leading-snug mb-2">
            🛠️ 20+ Viral Tools
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-hindi leading-relaxed">
            सोशल मीडिया क्रिएटर्स, ग्रामीणों और दैनिक उपयोग के लिए उपयोगी टूल्स — बिना किसी विज्ञापन रुकावट के।
          </p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools (QR code, thumbnail, compressor, bio...)..."
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

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0D1726] border border-white/10 p-12 text-center max-w-md mx-auto">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1 font-hindi">कोई टूल नहीं मिला</h3>
          <p className="text-xs text-slate-400 mb-4">कृपया दूसरा नाम खोजें।</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            सभी टूल्स देखें
          </button>
        </div>
      )}
    </AppShell>
  );
}
