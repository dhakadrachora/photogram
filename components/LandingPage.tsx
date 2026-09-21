'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Newspaper,
  MessageSquare,
  Swords,
  Bot,
  Users,
  Bell,
  Trophy,
  ChevronRight,
  Megaphone,
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Share2,
  Crown,
  Compass,
  Phone,
  MapPin,
  Building,
  UserCheck
} from 'lucide-react';
import { User, AppTab, NewsItem, CommunityUpdate, PresenceUser } from '@/types';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { isSiteAdmin } from '@/lib/admin-auth';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: AppTab) => void;
  onOpenAuth: () => void;
}

export function LandingPage({ currentUser, onNavigateTab, onOpenAuth }: LandingPageProps) {
  const isAdmin = isSiteAdmin(currentUser?.email);

  // Modals for interactive cards
  const [activeModal, setActiveModal] = useState<'news' | 'people' | 'updates' | null>(null);

  // Dynamic news / announcements
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [updatesList, setUpdatesList] = useState<CommunityUpdate[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const onlineCount = onlineUsers.length;

  useEffect(() => {
    let isSubscribed = true;
    let presenceTimer: ReturnType<typeof setInterval> | null = null;

    async function loadData() {
      try {
        const res = await fetch('/api/content?type=all', { cache: 'no-store' });
        const data = await res.json();
        if (isSubscribed && data) {
          if (Array.isArray(data.news)) setNewsList(data.news);
          if (Array.isArray(data.updates)) setUpdatesList(data.updates);
        }
      } catch (e) {
        console.warn('Could not load content', e);
      }
    }

    async function loadPresence() {
      try {
        const res = await fetch('/api/presence', {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json().catch(() => null);
        if (isSubscribed && res.ok && Array.isArray(data?.users)) {
          setOnlineUsers(data.users);
        }
      } catch (e) {
        console.warn('Could not load online users', e);
      }
    }

    void loadData();
    void loadPresence();

    // app/page.tsx owns the authenticated heartbeat.
    // LandingPage only reads the public online list.
    presenceTimer = setInterval(() => void loadPresence(), 5000);

    return () => {
      isSubscribed = false;
      if (presenceTimer) clearInterval(presenceTimer);
    };
  }, []);

  // Only real active users are shown. No hard-coded resident names.
  const visiblePeople = onlineUsers.filter(
    (person) => person.userId !== 'dhoti_aale_ai_official'
  );

  return (
    <div className="w-full flex flex-col bg-stone-50 text-stone-800 antialiased selection:bg-amber-200">
      {/* BEGIN: TopBar Header */}
      <header
        className="w-full pt-3 px-4 sm:px-6 pb-2.5 flex items-center justify-between z-20 bg-stone-50/90 backdrop-blur-sm sticky top-0 border-b border-stone-200/70"
        data-purpose="header-bar"
      >
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-2.5 mx-auto text-center" data-purpose="brand-logo">
            {/* Stylized Rajasthani Pagri / Turban Motif */}
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[#C25E29] border border-amber-300 shadow-sm">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.5 2 5.5 3.5 4 6c0 0 2.5 1.5 5 1 2.5-.5 5-2 7-1s3 3 4 3c-1.5-4-4.5-7-8-7zm-7.8 7c-.1.5-.2 1-.2 1.6 0 3.5 3.5 6.4 8 6.4 2.2 0 4.2-.7 5.7-1.9-1.2-.8-2.6-1.3-4.2-1.3-2.9 0-5.5 1.4-7.3-1.8zM12 18.5c-3.1 0-5.8-1.5-7.1-3.7-.6.9-.9 2-.9 3.2 0 2.2 3.6 4 8 4s8-1.8 8-4c0-1.1-.3-2.2-.9-3.1-1.4 2.1-4 3.6-7.1 3.6z" />
              </svg>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-heritage tracking-widest text-base text-stone-900 font-bold uppercase">
                DHOTI
              </span>
              <span className="text-[11px] tracking-[0.25em] text-[#C25E29] font-bold uppercase">
                AALE
              </span>
            </div>
          </div>

          {/* Right Header Actions: Install Button + User Profile */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <PWAInstallButton variant="header" />
            {currentUser && (
              <div
                onClick={() => onNavigateTab(isAdmin ? 'admin' : 'profile')}
                className="flex items-center gap-1.5 cursor-pointer bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-amber-900 shadow-xs"
              >
                <span className="max-w-[80px] truncate text-[11px]">{currentUser.name}</span>
                {isAdmin && <Crown className="h-3.5 w-3.5 text-amber-600" />}
              </div>
            )}
          </div>
        </div>
      </header>
      {/* END: TopBar */}

      {/* BEGIN: HeroSection */}
      <section
        className="w-full desert-gradient pt-4 pb-8 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center text-center"
        data-purpose="hero-banner"
      >
        {/* Background Sand Dunes & Cultural Shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-35 z-0">
          {/* Desert Sun */}
          <div className="absolute -right-6 top-3 w-36 h-36 rounded-full bg-amber-200/60 blur-xl"></div>
          {/* Dunes Vector Silhouette */}
          <svg className="absolute bottom-0 w-full h-36" fill="none" preserveAspectRatio="none" viewBox="0 0 400 120">
            <path d="M0 80 Q 90 40 190 70 T 400 35 L 400 120 L 0 120 Z" fill="#D39F6E" fillOpacity="0.35"></path>
            <path d="M0 95 Q 120 70 240 90 T 400 65 L 400 120 L 0 120 Z" fill="#C58B55" fillOpacity="0.45"></path>
          </svg>
          {/* Distant Camel Caravan Silhouettes */}
          <div className="absolute bottom-10 right-8 flex items-end gap-2 text-stone-700/40 text-xs">
            <span className="text-stone-600/40 text-xs">🌴</span>
            <span className="text-stone-600/30 text-sm">⛰️</span>
          </div>
        </div>

        {/* Main Hindi & English Headline Block */}
        <div className="relative z-10 max-w-xl mt-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-hindi-head text-stone-900 leading-tight mb-2 tracking-tight">
            ढोटी की अपनी<br />
            <span className="text-[#8D2817]">डिजिटल पहचान</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-stone-700 font-hindi font-medium px-2 leading-relaxed">
            राजस्थान का पहला डिजिटल गाँव समुदाय |<br />
            <span className="text-[11px] sm:text-xs text-stone-600 font-body">Rajasthan&apos;s Digital Village Community.</span>
          </p>
        </div>

        {/* Primary & Secondary Call to Actions + PWA Install Button */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-xl flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-5" data-purpose="cta-buttons">
          {/* Primary Green Button: Explore DHOTI AALE */}
          <button
            onClick={() => {
              SoundEffects.playTap();
              const el = document.getElementById('features-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            id="explore-dhoti-aale-btn"
            className="w-full sm:w-auto flex-1 py-2.5 px-5 bg-[#2D7D46] hover:bg-[#1E5830] active:scale-[0.98] transition-all duration-150 text-white rounded-full font-semibold text-xs tracking-wide shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2"
            type="button"
          >
            <span>Explore DHOTI AALE</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* App Install / Update CTA Button */}
          <PWAInstallButton variant="hero" />

          {/* Login / Profile CTA Button */}
          <button
            onClick={() => {
              SoundEffects.playBell();
              if (currentUser) {
                onNavigateTab(isAdmin ? 'admin' : 'profile');
              } else {
                onOpenAuth();
              }
            }}
            id="hero-login-btn"
            className="w-full sm:w-auto flex-1 py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all duration-150 text-slate-950 font-black rounded-full text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            type="button"
          >
            <UserCheck className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="tracking-wide">
              {currentUser ? `Signed in as ${currentUser.name}` : 'लॉगिन / साइन-अप करें'}
            </span>
          </button>
        </div>
      </section>
      {/* END: HeroSection */}

      {/* BEGIN: VillageCommunityFeaturesGrid */}
      <main id="features-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 -mt-3 z-10" data-purpose="features-navigation">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
          {/* CARD 1: News / ताज़ा समाचार */}
          <article
            id="feature-card-news"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('news');
            }}
            className="card-glass border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-news"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#8D2817] mb-2.5">
                <Newspaper className="h-5 w-5 text-[#8D2817]" />
              </div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-stone-900 text-sm">News</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">ताज़ा</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight line-clamp-2">
                ढोटी पंचायत विकास कार्य एवं मुख्य समाचार...
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
              <span className="text-[10px] text-stone-400">आज के मुख्य बिंदु</span>
              <ChevronRight className="h-3 w-3 text-stone-400" />
            </div>
          </article>

          {/* CARD 2: World Chat / गाँव चौपाल */}
          <article
            id="feature-card-chat"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('worldchat');
            }}
            className="card-glass border border-stone-200/90 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-chat"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2D7D46] mb-2.5">
                <MessageSquare className="h-5 w-5 text-[#2D7D46]" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-stone-900 text-sm">World Chat</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> लाइव
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                गाँव चौपाल चर्चा व संदेश
              </p>
            </div>
            {/* User Profile Avatars Cluster */}
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="flex -space-x-2 overflow-hidden">
                {visiblePeople.slice(0, 3).map((person) => (
                  <div key={person.userId} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-stone-200 overflow-hidden text-[10px] flex items-center justify-center font-bold text-stone-700" title={person.userName}>
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      person.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* CARD 3: Battle / मुकाबला */}
          <article
            id="feature-card-battle"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('battle');
            }}
            className="card-glass border border-stone-200/90 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-battle"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-2.5">
                <Swords className="h-5 w-5 text-amber-700" />
              </div>
              <h2 className="font-bold text-stone-900 text-sm">Battle</h2>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                गाँव प्रश्नोत्तरी व ज्ञान मुकाबला
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">क्विज़ चैलेंज</span>
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </article>

          {/* CARD 4: AI Assistant / DHOTI AALE AI वॉइस मैन */}
          <article
            id="feature-card-ai"
            onClick={() => {
              SoundEffects.playTap();
              onNavigateTab('assistant');
            }}
            className="card-glass border border-amber-300/80 bg-gradient-to-b from-amber-50/60 to-orange-50/40 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-ai"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mb-2.5">
                <Bot className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-stone-900 text-sm">DHOTI AALE (AI)</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold">वॉइस</span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 leading-tight">
                &ldquo;राम राम भाईसाहब!&rdquo; अखाड़े में कौन आगे है, कौन जीतेगा व ताज़ा अपडेट्स
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
              <span className="text-[10px] text-amber-800 font-bold">🎙️ देसी AI वॉइस मैन</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
          </article>

          {/* CARD 5: People / गाँव डायरेक्टरी */}
          <article
            id="feature-card-people"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('people');
            }}
            className="card-glass border border-stone-200/90 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-people"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-2.5">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
              <h2 className="font-bold text-stone-900 text-sm">People</h2>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                गाँव के निवासी व प्रवासी संपर्क
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center -space-x-1.5">
                {visiblePeople.slice(0, 3).map((person) => (
                  <div
                    key={person.userId}
                    className="relative w-5 h-5 rounded-full bg-stone-200 border border-white overflow-hidden flex items-center justify-center text-[9px] font-bold text-stone-700"
                    title={person.userName}
                  >
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      person.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-stone-600 font-medium">{onlineCount} सदस्य ऑनलाइन</span>
            </div>
          </article>

          {/* CARD 6: Latest Updates / सूचनाएं */}
          <article
            id="feature-card-updates"
            onClick={() => {
              SoundEffects.playTap();
              setActiveModal('updates');
            }}
            className="card-glass border border-stone-200/90 rounded-2xl p-3.5 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-150 flex flex-col justify-between"
            data-purpose="feature-updates"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#8D2817] mb-2.5 relative">
                <Bell className="h-5 w-5 text-[#8D2817]" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full"></span>
              </div>
              <h2 className="font-bold text-stone-900 text-sm">Latest Updates</h2>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                सरकारी घोषणाएं व गाँव आयोजन
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] text-rose-700 font-medium font-hindi">नया नोटिस</span>
              <Megaphone className="h-3 w-3 text-stone-400" />
            </div>
          </article>
        </div>

        {/* Community Pride Banner */}
        <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/40 p-3.5 text-center">
          <div className="text-xs font-bold text-stone-900 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#C25E29]" />
            <span>आपणो ढोटी गाँव - एक कदम डिजिटल विकास री ओर</span>
          </div>
          <p className="text-[11px] text-stone-600 font-hindi mt-1">
            गाँव चौपाल, प्रतियोगिता और एआई मददगार के साथ अपनी आवाज को मंच दें।
          </p>
        </div>
      </main>
      {/* END: VillageCommunityFeaturesGrid */}

      {/* ================= MODAL: NEWS (ताज़ा समाचार) ================= */}
      {activeModal === 'news' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#8D2817] flex items-center justify-center">
                  <Newspaper className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">ढोटी समाचार (News)</h3>
                  <p className="text-[10px] text-stone-500">Panchayat & Village Headlines</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {newsList.length > 0 ? (
                newsList.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold text-[#8D2817]">{item.category}</span>
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('hi-IN') : 'ताज़ा'}</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.content || item.excerpt}</p>
                    <div className="mt-2 text-[10px] text-stone-400">स्रोत: {item.author || 'ग्राम पंचायत ढोटी'}</div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold text-[#8D2817]">पंचायत विकास</span>
                      <span>आज 10:30 AM</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">ढोटी मुख्य मार्ग पर नई सोलर स्ट्रीट लाइटों का कार्य पूर्ण</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      ग्राम पंचायत ढोटी के मुख्य बस स्टैंड से चौपाल तक 25 नई सोलर लाइटें स्थापित की गई हैं, जिससे रात्रि में आवागमन सुगम रहेगा।
                    </p>
                    <div className="mt-2 text-[10px] text-stone-400">स्रोत: ग्राम पंचायत ढोटी</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-semibold text-emerald-700">कृषि समाचार</span>
                      <span>कल</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">सरसों व गेहूं की नई समर्थन मूल्य दरें जारी</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      कृषि मंडी समिति द्वारा किसानों के लिए नई पंजीकरण प्रक्रिया शुरू हो चुकी है। सभी किसान भाई ई-मित्र पर जाकर स्लॉट बुक करें।
                    </p>
                    <div className="mt-2 text-[10px] text-stone-400">स्रोत: कृषि उपज मंडी</div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: PEOPLE (गाँव डायरेक्टरी) ================= */}
      {activeModal === 'people' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">गाँव निवासी व प्रतिनिधि (People)</h3>
                  <p className="text-[10px] text-stone-500">Community Members & Founders</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-stone-950 font-black flex items-center justify-center text-sm shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-stone-900 truncate">Dhoti Aale AI</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">AI Assistant</span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium">Digital Village AI Assistant</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Online</span>
                  </div>
                </div>
              </div>

              {visiblePeople.map((person) => (
                <div key={person.userId} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 border border-stone-200 shrink-0 flex items-center justify-center">
                    {person.userAvatar ? (
                      <img src={person.userAvatar} alt={person.userName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-stone-700">{person.userName.charAt(0).toUpperCase()}</span>
                    )}
                    <span className="absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-stone-900 truncate">{person.userName}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">Online</span>
                    </div>
                    <p className="text-xs text-stone-600 font-medium truncate">{person.userBadge || 'Dhoti Resident'}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>अभी ऑनलाइन</span>
                      {person.isAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                    </div>
                  </div>
                </div>
              ))}

              {visiblePeople.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                  <p className="text-sm font-semibold text-stone-700">अभी कोई दूसरा user online नहीं है</p>
                  <p className="mt-1 text-[11px] text-stone-500">Online होते ही उनका real account name यहाँ दिखेगा.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
            >
              वापस जाएं (Back)
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: LATEST UPDATES (सूचनाएं) ================= */}
      {activeModal === 'updates' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-white border border-stone-200 p-5 shadow-2xl text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#8D2817] flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">सूचनाएं व नोटिस (Latest Updates)</h3>
                  <p className="text-[10px] text-stone-500">Announcements & Circulars</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {updatesList.length > 0 ? (
                updatesList.map((up) => (
                  <div key={up.id} className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80">
                    <div className="flex items-center justify-between text-[11px] text-rose-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> {up.tag}
                      </span>
                      <span className="text-stone-400">{up.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">{up.title}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{up.summary}</p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80">
                    <div className="flex items-center justify-between text-[11px] text-rose-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> ग्राम सभा सूचना
                      </span>
                      <span className="text-stone-400">आगामी रविवार</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">विशेष ग्राम सभा बैठक - ढोटी पंचायत भवन</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      आगामी रविवार प्रातः 10:00 बजे ढोटी पंचायत भवन में जल संरक्षण व पक्की नालियों के निर्माण प्रस्ताव हेतु बैठक रखी गई है। सभी ग्रामवासी सादर आमंत्रित हैं।
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> विद्युत आपूर्ति सूचना
                      </span>
                      <span className="text-stone-400">कल दोपहर</span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900">ट्रांसफार्मर मेंटेनेंस कार्य</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      कल दोपहर 1:00 PM से 3:30 PM तक ट्रांसफार्मर मरम्मत कार्य के चलते विद्युत आपूर्ति बाधित रहेगी।
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
            >
              ठीक है (Understood)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
