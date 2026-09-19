'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  User,
  AppTab,
  NewsItem,
  PersonProfile,
  BusinessItem,
  GalleryItem,
  VideoItem,
  CommunityUpdate,
  BattleEvent,
  SiteSettings,
  ChatMessage,
} from '@/types';
import { isSiteAdmin, SITE_OWNER_EMAIL } from '@/lib/admin-auth';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Swords,
  Bell,
  Newspaper,
  Users,
  Store,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  ExternalLink,
  Flame,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onNavigateTab: (tab: AppTab) => void;
}

type AdminSection =
  | 'overview'
  | 'battles'
  | 'updates'
  | 'news'
  | 'people'
  | 'business'
  | 'gallery'
  | 'videos'
  | 'chat'
  | 'users'
  | 'settings';

export function AdminDashboard({ currentUser, onOpenAuth, onNavigateTab }: AdminDashboardProps) {
  const isAdmin = isSiteAdmin(currentUser?.email);

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [battles, setBattles] = useState<BattleEvent[]>([]);
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [people, setPeople] = useState<PersonProfile[]>([]);
  const [business, setBusiness] = useState<BusinessItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Modal / Form States
  const [editingItem, setEditingItem] = useState<{ type: string; data?: any } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Show notice with auto-dismiss
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4000);
  };

  const getAdminHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-user-email': currentUser?.email || '',
    };
  }, [currentUser?.email]);

  // Load section data
  const loadData = useCallback(async (setLoading?: boolean | React.SyntheticEvent) => {
    if (!isAdmin) return;
    if (setLoading === true) {
      setIsLoading(true);
    }
    try {
      const headers = getAdminHeaders();

      // Load Overview & Settings
      const [overviewRes, battlesRes, updatesRes, newsRes, peopleRes, bizRes, galRes, vidRes, chatRes, usersRes] = await Promise.all([
        fetch('/api/admin/content?type=overview', { headers, cache: 'no-store' }),
        fetch('/api/battle', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=updates', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=news', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=people', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=business', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=gallery', { headers, cache: 'no-store' }),
        fetch('/api/admin/content?type=videos', { headers, cache: 'no-store' }),
        fetch('/api/chat', { cache: 'no-store' }),
        fetch('/api/admin/content?type=users', { headers, cache: 'no-store' }),
      ]);

      const overviewData = await overviewRes.json();
      if (overviewData.stats) setStats(overviewData.stats);
      if (overviewData.settings) setSiteSettings(overviewData.settings);

      const battlesData = await battlesRes.json();
      if (battlesData.battles) setBattles(battlesData.battles);

      const updatesData = await updatesRes.json();
      if (updatesData.items) setUpdates(updatesData.items);

      const newsData = await newsRes.json();
      if (newsData.items) setNews(newsData.items);

      const peopleData = await peopleRes.json();
      if (peopleData.items) setPeople(peopleData.items);

      const bizData = await bizRes.json();
      if (bizData.items) setBusiness(bizData.items);

      const galData = await galRes.json();
      if (galData.items) setGallery(galData.items);

      const vidData = await vidRes.json();
      if (vidData.items) setVideos(vidData.items);

      const chatData = await chatRes.json();
      if (chatData.messages) setChatMessages(chatData.messages);

      const usersData = await usersRes.json();
      if (usersData.items) setRegisteredUsers(usersData.items);
    } catch (err: any) {
      console.warn('Error loading admin content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, getAdminHeaders]);

  // Initial data loading on mount
  useEffect(() => {
    let ignore = false;
    async function initData() {
      if (!isAdmin) return;
      try {
        const headers = {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
        };

        const [overviewRes, battlesRes, updatesRes, newsRes, peopleRes, bizRes, galRes, vidRes, chatRes, usersRes] = await Promise.all([
          fetch('/api/admin/content?type=overview', { headers, cache: 'no-store' }),
          fetch('/api/battle', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=updates', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=news', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=people', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=business', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=gallery', { headers, cache: 'no-store' }),
          fetch('/api/admin/content?type=videos', { headers, cache: 'no-store' }),
          fetch('/api/chat', { cache: 'no-store' }),
          fetch('/api/admin/content?type=users', { headers, cache: 'no-store' }),
        ]);

        if (ignore) return;
        const overviewData = await overviewRes.json();
        if (overviewData.stats) setStats(overviewData.stats);
        if (overviewData.settings) setSiteSettings(overviewData.settings);

        const battlesData = await battlesRes.json();
        if (battlesData.battles) setBattles(battlesData.battles);

        const updatesData = await updatesRes.json();
        if (updatesData.items) setUpdates(updatesData.items);

        const newsData = await newsRes.json();
        if (newsData.items) setNews(newsData.items);

        const peopleData = await peopleRes.json();
        if (peopleData.items) setPeople(peopleData.items);

        const bizData = await bizRes.json();
        if (bizData.items) setBusiness(bizData.items);

        const galData = await galRes.json();
        if (galData.items) setGallery(galData.items);

        const vidData = await vidRes.json();
        if (vidData.items) setVideos(vidData.items);

        const chatData = await chatRes.json();
        if (chatData.messages) setChatMessages(chatData.messages);

        const usersData = await usersRes.json();
        if (usersData.items) setRegisteredUsers(usersData.items);
      } catch (err: any) {
        console.warn('Error loading admin content:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    initData();
    return () => {
      ignore = true;
    };
  }, [isAdmin, currentUser?.email]);

  // Upload image to R2 / Admin Upload endpoint
  const handleUploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-user-email': currentUser?.email || '',
        },
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        showNotice(`Image uploaded via ${data.storage || 'system'}!`);
        return data.url;
      }
      showNotice(data.error || 'Upload failed', 'error');
      return null;
    } catch (e: any) {
      showNotice('Upload failed: ' + e.message, 'error');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle publish state
  const handleTogglePublish = async (type: string, id: string, currentPublished: boolean) => {
    try {
      const headers = getAdminHeaders();
      if (type === 'battle') {
        const res = await fetch('/api/battle', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id, action: 'toggle_publish' }),
        });
        const data = await res.json();
        if (data.success) {
          setBattles((prev) =>
            prev.map((b) => (b.id === id ? { ...b, published: !currentPublished } : b))
          );
          showNotice(`Battle ${!currentPublished ? 'published' : 'unpublished'}!`);
        }
      } else {
        const res = await fetch('/api/admin/content', {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            type,
            id,
            updates: { published: !currentPublished },
          }),
        });
        const data = await res.json();
        if (data.success) {
          showNotice(`Item ${!currentPublished ? 'published' : 'unpublished'}!`);
          loadData();
        }
      }
    } catch {
      showNotice('Action failed', 'error');
    }
  };

  // Delete item
  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const headers = getAdminHeaders();
      let res;
      if (type === 'battle') {
        res = await fetch(`/api/battle?id=${id}`, { method: 'DELETE', headers });
      } else if (type === 'chat') {
        res = await fetch(`/api/chat?id=${id}`, { method: 'DELETE', headers });
      } else {
        res = await fetch(`/api/admin/content?type=${type}&id=${id}`, {
          method: 'DELETE',
          headers,
        });
      }
      const data = await res.json();
      if (data.success) {
        showNotice('Item deleted successfully');
        loadData();
      } else {
        showNotice(data.error || 'Delete failed', 'error');
      }
    } catch {
      showNotice('Delete request failed', 'error');
    }
  };

  // Quick Battle Action: Start or Close
  const handleBattleAction = async (id: string, action: 'start' | 'close') => {
    try {
      const headers = getAdminHeaders();
      const res = await fetch('/api/battle', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Battle ${action === 'start' ? 'started' : 'manually closed'}!`);
        loadData();
      }
    } catch {
      showNotice('Battle action failed', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    try {
      const headers = getAdminHeaders();
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          type: 'settings',
          settings: siteSettings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice('Site settings updated successfully!');
      }
    } catch {
      showNotice('Failed to update settings', 'error');
    }
  };

  // UNAUTHORIZED ACCESS GUARD
  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#07080c]">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-slate-950/90 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 shadow-lg">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">Admin Access Restricted</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            The DHOTI AALE Admin Control system is strictly reserved for the site owner & super administrator:{' '}
            <strong className="text-amber-400 font-mono block mt-1">{SITE_OWNER_EMAIL}</strong>
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs sm:text-sm shadow-lg transition-all"
            >
              <Crown className="h-4 w-4" />
              <span>Sign in as Admin ({SITE_OWNER_EMAIL})</span>
            </button>
            <button
              onClick={() => onNavigateTab('home')}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 text-xs transition-colors border border-slate-800"
            >
              Return to Community Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto p-3 sm:p-6 flex flex-col gap-6 text-slate-100">
      {/* Top Banner: Admin Identity & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-500/30 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">DHOTI AALE Admin Control</h1>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Full Control 👑
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Authorized Owner: <span className="text-amber-300 font-bold">{SITE_OWNER_EMAIL}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync Live</span>
          </button>
          <button
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs transition-all shadow-md active:scale-95"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Public Site</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all shadow-lg animate-in fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="p-1 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Section Navigation Tabs (Horizontal Scrollable on Mobile, Wrap on Desktop) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: ShieldCheck },
          { id: 'battles', label: 'Battles', icon: Swords, badge: battles.length },
          { id: 'updates', label: 'Latest Updates', icon: Bell, badge: updates.length },
          { id: 'news', label: 'News', icon: Newspaper, badge: news.length },
          { id: 'people', label: 'People', icon: Users, badge: people.length },
          { id: 'business', label: 'Business', icon: Store, badge: business.length },
          { id: 'gallery', label: 'Gallery', icon: ImageIcon, badge: gallery.length },
          { id: 'videos', label: 'Videos', icon: Video, badge: videos.length },
          { id: 'chat', label: 'World Chat', icon: MessageSquare, badge: chatMessages.length },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as AdminSection)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION CONTENT AREA */}
      <div className="flex-1">
        {/* 1. OVERVIEW SECTION */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setActiveSection('battles')}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Community Battles</span>
                  <Swords className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{battles.length}</div>
                <div className="text-[10px] text-emerald-400 mt-1">Admin Controlled • Live Voting</div>
              </div>

              <div
                onClick={() => setActiveSection('updates')}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">Latest Updates</span>
                  <Bell className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{updates.length}</div>
                <div className="text-[10px] text-sky-400 mt-1">Direct Public Ticker Sync</div>
              </div>

              <div
                onClick={() => setActiveSection('news')}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">News Articles</span>
                  <Newspaper className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{news.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Published Stories</div>
              </div>

              <div
                onClick={() => setActiveSection('chat')}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold">World Chat Messages</span>
                  <MessageSquare className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{chatMessages.length}</div>
                <div className="text-[10px] text-purple-400 mt-1">One-Click Moderation</div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Quick Admin Creation Shortcuts</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setActiveSection('battles');
                    setEditingItem({ type: 'battle' });
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs gap-2 transition-all"
                >
                  <Swords className="h-5 w-5" />
                  <span>Create Battle</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection('updates');
                    setEditingItem({ type: 'updates' });
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 font-bold text-xs gap-2 transition-all"
                >
                  <Bell className="h-5 w-5" />
                  <span>Post Update</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection('news');
                    setEditingItem({ type: 'news' });
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs gap-2 transition-all"
                >
                  <Newspaper className="h-5 w-5" />
                  <span>Publish News</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection('gallery');
                    setEditingItem({ type: 'gallery' });
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs gap-2 transition-all"
                >
                  <ImageIcon className="h-5 w-5" />
                  <span>Add Gallery Photo</span>
                </button>
              </div>
            </div>

            {/* Active Battles Live Monitor */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Swords className="h-4 w-4 text-amber-400" />
                  <span>Live Community Battles Monitor</span>
                </h3>
                <button
                  onClick={() => setActiveSection('battles')}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Manage All Battles →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {battles.slice(0, 4).map((b) => {
                  const total = b.optionA.votes + b.optionB.votes;
                  const pctA = total > 0 ? Math.round((b.optionA.votes / total) * 100) : 50;
                  const pctB = total > 0 ? 100 - pctA : 50;
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {b.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.isEnded
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {b.isEnded ? 'Closed' : 'Active'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-amber-300">
                            {b.optionA.emoji} {b.optionA.label} ({b.optionA.votes})
                          </span>
                          <span className="text-sky-300">
                            {b.optionB.emoji} {b.optionB.label} ({b.optionB.votes})
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            className="bg-amber-500 h-full transition-all duration-500"
                            style={{ width: `${pctA}%` }}
                          />
                          <div
                            className="bg-sky-500 h-full transition-all duration-500"
                            style={{ width: `${pctB}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. BATTLES SECTION */}
        {activeSection === 'battles' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Swords className="h-5 w-5 text-amber-400" />
                  <span>Battle Admin Control</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Only Admin can create battles, manage participants, set dates, start/end and inspect votes.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'battle' })}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Battle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {battles.map((battle) => {
                const total = battle.optionA.votes + battle.optionB.votes;
                const pctA = total > 0 ? Math.round((battle.optionA.votes / total) * 100) : 50;
                const pctB = total > 0 ? 100 - pctA : 50;

                return (
                  <div
                    key={battle.id}
                    className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {battle.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              battle.published !== false
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {battle.published !== false ? 'Published' : 'Draft / Unpublished'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              battle.isEnded
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}
                          >
                            {battle.isEnded ? 'Closed' : 'Active'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5">{battle.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{battle.description}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingItem({ type: 'battle', data: battle })}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Battle"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('battle', battle.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                          title="Delete Battle"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Participants & Vote Counts */}
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                      {/* Option A */}
                      <div className="flex items-center gap-2.5">
                        {battle.optionA.imageUrl ? (
                          <Image
                            src={battle.optionA.imageUrl}
                            alt={battle.optionA.label}
                            width={36}
                            height={36}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 rounded-xl object-cover border border-amber-500/40"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-base border border-amber-500/30">
                            {battle.optionA.emoji || '🔥'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-amber-300 truncate">
                            {battle.optionA.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {battle.optionA.votes} votes ({pctA}%)
                          </div>
                        </div>
                      </div>

                      {/* Option B */}
                      <div className="flex items-center gap-2.5">
                        {battle.optionB.imageUrl ? (
                          <Image
                            src={battle.optionB.imageUrl}
                            alt={battle.optionB.label}
                            width={36}
                            height={36}
                            referrerPolicy="no-referrer"
                            className="h-9 w-9 rounded-xl object-cover border border-sky-500/40"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-base border border-sky-500/30">
                            {battle.optionB.emoji || '⚡'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-sky-300 truncate">
                            {battle.optionB.label}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {battle.optionB.votes} votes ({pctB}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${pctA}%` }} />
                        <div className="bg-sky-500 h-full transition-all" style={{ width: `${pctB}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Total Votes: {total}</span>
                        <span>Ends: {new Date(battle.endsAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick Status Toggles */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                      <button
                        onClick={() => handleTogglePublish('battle', battle.id, battle.published !== false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          battle.published !== false
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {battle.published !== false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span>{battle.published !== false ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      {battle.isEnded ? (
                        <button
                          onClick={() => handleBattleAction(battle.id, 'start')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
                        >
                          <Flame className="h-3.5 w-3.5" />
                          <span>Re-open Voting</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBattleAction(battle.id, 'close')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Close Battle</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. LATEST UPDATES SECTION */}
        {activeSection === 'updates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-sky-400" />
                  <span>Latest Updates Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Published updates appear automatically on the public landing page & announcement tickers.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'updates' })}
                className="flex items-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Update</span>
              </button>
            </div>

            <div className="space-y-3">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        {update.tag}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          update.published
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {update.published ? 'Live on Site' : 'Draft'}
                      </span>
                      <span className="text-[10px] text-slate-500">{update.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{update.title}</h3>
                    <p className="text-xs text-slate-400">{update.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleTogglePublish('updates', update.id, update.published)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        update.published
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {update.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => setEditingItem({ type: 'updates', data: update })}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem('updates', update.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. NEWS SECTION */}
        {activeSection === 'news' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-emerald-400" />
                  <span>Community News Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish village stories, festival announcements, and development reports.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'news' })}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Write News Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col shadow-xl"
                >
                  <div className="relative h-44 w-full bg-slate-800">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.excerpt}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500">By {item.author}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePublish('news', item.id, item.published)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            item.published ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {item.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setEditingItem({ type: 'news', data: item })}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem('news', item.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PEOPLE SECTION */}
        {activeSection === 'people' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-400" />
                  <span>People & Achievers Directory</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Promote village achievers, leaders, athletes, and creative talents.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'people' })}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Person</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={person.photoUrl}
                      alt={person.name}
                      width={48}
                      height={48}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-2xl object-cover bg-slate-800 ring-2 ring-amber-500/40"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{person.name}</h3>
                      <p className="text-[11px] text-amber-400 truncate">{person.designation}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {person.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3">{person.bio}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                    <button
                      onClick={() => handleTogglePublish('people', person.id, person.published)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        person.published ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {person.published ? 'Hide' : 'Show'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingItem({ type: 'people', data: person })}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('people', person.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. BUSINESS SECTION */}
        {activeSection === 'business' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-400" />
                  <span>Local Businesses & Shops</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage verified local enterprises, agro shops, dairies, and service providers.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'business' })}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Business</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {business.map((biz) => (
                <div
                  key={biz.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Image
                      src={biz.logoUrl}
                      alt={biz.name}
                      width={48}
                      height={48}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-2xl object-cover bg-slate-800 ring-2 ring-emerald-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{biz.name}</h3>
                        {biz.verified && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            Verified ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{biz.category} • {biz.phone}</p>
                      <p className="text-xs text-slate-500 truncate">{biz.address}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{biz.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleTogglePublish('business', biz.id, biz.published)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        biz.published ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {biz.published ? 'Hide' : 'Publish'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingItem({ type: 'business', data: biz })}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('business', biz.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. GALLERY SECTION */}
        {activeSection === 'gallery' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  <span>Community Gallery Photos</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload photos via R2 / storage, manage captions, and showcase village culture.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'gallery' })}
                className="flex items-center gap-2 rounded-2xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Upload New Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 w-full bg-slate-800">
                    <Image
                      src={img.imageUrl}
                      alt={img.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md">
                      <div className="text-xs font-bold text-white truncate">{img.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{img.caption}</div>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold">
                      {img.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePublish('gallery', img.id, img.published)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          img.published ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {img.published ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleDeleteItem('gallery', img.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. VIDEOS SECTION */}
        {activeSection === 'videos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-400" />
                  <span>Videos & Highlights</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage rap cyphers, wrestling clips, and cultural documentary videos.
                </p>
              </div>
              <button
                onClick={() => setEditingItem({ type: 'videos' })}
                className="flex items-center gap-2 rounded-2xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Video</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((vid) => (
                <div
                  key={vid.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 w-full bg-slate-800">
                    <Image
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-xl">
                        <Video className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-sm font-bold text-white">{vid.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{vid.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500">{vid.category}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePublish('videos', vid.id, vid.published)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            vid.published ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {vid.published ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem('videos', vid.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. WORLD CHAT MODERATION SECTION */}
        {activeSection === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <span>World Chat Real-time Moderation</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Server-side protected moderation: Delete inappropriate or spam messages instantly.
                </p>
              </div>
              <button
                onClick={() => loadData(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Messages</span>
              </button>
            </div>

            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No chat messages found.</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Image
                          src={msg.userAvatar}
                          alt={msg.userName}
                          width={36}
                          height={36}
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 rounded-full bg-slate-800 ring-2 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{msg.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                              {msg.userBadge}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed break-words">{msg.text}</p>
                          {msg.sticker && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              {msg.sticker}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem('chat', msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-bold transition-all shrink-0"
                        title="Delete message from World Chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete Message</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 10. USERS SECTION */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-400" />
                  <span>Registered Community Users ({registeredUsers.length > 0 ? registeredUsers.length : 4})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supabase पंजीकृत उपयोगकर्ता, ईमेल, फ़ोन नंबर, प्रोफ़ाइल फ़ोटो और पंजीकरण दिनांक।
                </p>
              </div>

              {/* Admin Security Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Zero-Knowledge Passwords (Admin Cannot View Passwords)</span>
              </div>
            </div>

            {/* Privacy Architecture Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-white">गोपनीयता और सुरक्षा सुरक्षा प्रोटोकॉल:</span> उपयोगकर्ता पासवर्ड Supabase Auth द्वारा सुरक्षित रूप से एन्क्रिप्ट किए जाते हैं। डेटाबेस में पासवर्ड कभी भी संग्रहीत या प्रदर्शित नहीं होते, और व्यवस्थापक (Admin) कभी भी उपयोगकर्ता पासवर्ड नहीं देख सकते।
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              {(registeredUsers.length > 0
                ? registeredUsers
                : [
                    {
                      id: 'admin_rohit',
                      name: 'Rohit Dhakad',
                      email: 'rohitdhakaddhoti143@gmail.com',
                      phone: '+91 98765 43210',
                      role: 'Site Owner & Admin 👑',
                      badge: 'Site Owner & Admin 👑',
                      coins: 5000,
                      wins: 99,
                      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-dhoti',
                      created_at: new Date().toISOString(),
                    },
                    {
                      id: 'admin_nagar',
                      name: 'Rohit Kumar Nagar',
                      email: 'rohitkumarnagar50@gmail.com',
                      phone: null,
                      role: 'Super Admin 👑',
                      badge: 'Super Admin 👑',
                      coins: 2000,
                      wins: 50,
                      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-admin',
                      created_at: new Date().toISOString(),
                    },
                    {
                      id: 'user_vikram',
                      name: 'Vikram Choudhary',
                      email: 'vikram.choudhary@gmail.com',
                      phone: '+91 98234 56789',
                      role: 'Resident',
                      badge: 'Dhoti King 👑',
                      coins: 450,
                      wins: 12,
                      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vikram-dhoti',
                      created_at: new Date().toISOString(),
                    },
                    {
                      id: 'user_aman',
                      name: 'Aman Dhakad',
                      email: 'aman.dhakad@gmail.com',
                      phone: null,
                      role: 'Resident',
                      badge: 'Rap Boss 🎤',
                      coins: 380,
                      wins: 8,
                      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aman-dhoti',
                      created_at: new Date().toISOString(),
                    },
                  ]
              ).map((u: any, i: number) => (
                <div
                  key={u.id || i}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <Image
                      src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.email || 'user')}`}
                      alt={u.name || 'User'}
                      width={44}
                      height={44}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-2xl object-cover bg-slate-800 border border-amber-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {u.name || 'Resident'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {u.is_admin || isSiteAdmin(u.email) ? 'Admin 👑' : (u.role || u.badge || 'Resident')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-300">{u.email}</span>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Phone className="h-3 w-3 text-amber-400/70" />
                          <span>{u.phone ? u.phone : <span className="text-slate-500 italic">No phone</span>}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3 w-3 text-amber-400/70" />
                          <span>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('hi-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'पंजीकृत'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div>
                      <div className="text-xs font-bold text-amber-400">{u.coins ?? 50} Coins</div>
                      <div className="text-[10px] text-emerald-400">{u.wins ?? 0} Battles Won</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. SETTINGS SECTION */}
        {activeSection === 'settings' && siteSettings && (
          <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-400" />
                <span>Site Settings & Content Visibility</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control community banners, title, and public feature toggles without editing code.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Site Title</label>
                <input
                  type="text"
                  value={siteSettings.siteTitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={siteSettings.siteTagline}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteTagline: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Public Announcement Banner Text
                </label>
                <textarea
                  rows={2}
                  value={siteSettings.announcementBanner}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, announcementBanner: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-300">
                    Enable Top Announcement Banner
                  </span>
                  <input
                    type="checkbox"
                    checked={siteSettings.isAnnouncementActive}
                    onChange={(e) =>
                      setSiteSettings({ ...siteSettings, isAnnouncementActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-300">
                    Allow Public World Chat
                  </span>
                  <input
                    type="checkbox"
                    checked={siteSettings.allowWorldChat}
                    onChange={(e) =>
                      setSiteSettings({ ...siteSettings, allowWorldChat: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-300">
                    Allow Guest AI Assistant Access
                  </span>
                  <input
                    type="checkbox"
                    checked={siteSettings.allowGuestAi}
                    onChange={(e) =>
                      setSiteSettings({ ...siteSettings, allowGuestAi: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all active:scale-95"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* CREATE / EDIT MODAL DRAWER */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span>
                  {editingItem.data ? 'Edit' : 'Create'}{' '}
                  {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}
                </span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BATTLE FORM */}
            {editingItem.type === 'battle' && (
              <BattleForm
                initialData={editingItem.data}
                onSave={async (payload) => {
                  try {
                    const headers = getAdminHeaders();
                    let res;
                    if (editingItem.data?.id) {
                      res = await fetch('/api/battle', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                          id: editingItem.data.id,
                          updates: payload,
                        }),
                      });
                    } else {
                      res = await fetch('/api/battle', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload),
                      });
                    }
                    const data = await res.json();
                    if (data.success) {
                      showNotice('Battle saved successfully!');
                      setEditingItem(null);
                      loadData();
                    } else {
                      showNotice(data.error || 'Failed to save battle', 'error');
                    }
                  } catch (e: any) {
                    showNotice(e.message, 'error');
                  }
                }}
                onUploadImage={handleUploadImage}
                isUploading={isUploading}
              />
            )}

            {/* UPDATES FORM */}
            {editingItem.type === 'updates' && (
              <UpdatesForm
                initialData={editingItem.data}
                onSave={async (payload) => {
                  try {
                    const headers = getAdminHeaders();
                    let res;
                    if (editingItem.data?.id) {
                      res = await fetch('/api/admin/content', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                          type: 'updates',
                          id: editingItem.data.id,
                          updates: payload,
                        }),
                      });
                    } else {
                      res = await fetch('/api/admin/content', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                          type: 'updates',
                          item: payload,
                        }),
                      });
                    }
                    const data = await res.json();
                    if (data.success) {
                      showNotice('Update saved and published to site!');
                      setEditingItem(null);
                      loadData();
                    }
                  } catch (e: any) {
                    showNotice(e.message, 'error');
                  }
                }}
              />
            )}

            {/* NEWS FORM */}
            {editingItem.type === 'news' && (
              <NewsForm
                initialData={editingItem.data}
                onSave={async (payload) => {
                  try {
                    const headers = getAdminHeaders();
                    let res;
                    if (editingItem.data?.id) {
                      res = await fetch('/api/admin/content', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                          type: 'news',
                          id: editingItem.data.id,
                          updates: payload,
                        }),
                      });
                    } else {
                      res = await fetch('/api/admin/content', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                          type: 'news',
                          item: payload,
                        }),
                      });
                    }
                    const data = await res.json();
                    if (data.success) {
                      showNotice('News article saved!');
                      setEditingItem(null);
                      loadData();
                    }
                  } catch (e: any) {
                    showNotice(e.message, 'error');
                  }
                }}
                onUploadImage={handleUploadImage}
                isUploading={isUploading}
              />
            )}

            {/* GENERIC / PEOPLE / BUSINESS / GALLERY / VIDEOS FORMS */}
            {['people', 'business', 'gallery', 'videos'].includes(editingItem.type) && (
              <GenericItemForm
                type={editingItem.type}
                initialData={editingItem.data}
                onSave={async (payload) => {
                  try {
                    const headers = getAdminHeaders();
                    let res;
                    if (editingItem.data?.id) {
                      res = await fetch('/api/admin/content', {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                          type: editingItem.type,
                          id: editingItem.data.id,
                          updates: payload,
                        }),
                      });
                    } else {
                      res = await fetch('/api/admin/content', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                          type: editingItem.type,
                          item: payload,
                        }),
                      });
                    }
                    const data = await res.json();
                    if (data.success) {
                      showNotice('Saved successfully!');
                      setEditingItem(null);
                      loadData();
                    }
                  } catch (e: any) {
                    showNotice(e.message, 'error');
                  }
                }}
                onUploadImage={handleUploadImage}
                isUploading={isUploading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// BATTLE FORM COMPONENT
function BattleForm({
  initialData,
  onSave,
  onUploadImage,
  isUploading,
}: {
  initialData?: any;
  onSave: (payload: any) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  isUploading: boolean;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Desi Clash 👑');
  const [description, setDescription] = useState(initialData?.description || '');
  const [optALabel, setOptALabel] = useState(initialData?.optionA?.label || '');
  const [optATagline, setOptATagline] = useState(initialData?.optionA?.tagline || '');
  const [optAEmoji, setOptAEmoji] = useState(initialData?.optionA?.emoji || '🔥');
  const [optAImage, setOptAImage] = useState(initialData?.optionA?.imageUrl || '');

  const [optBLabel, setOptBLabel] = useState(initialData?.optionB?.label || '');
  const [optBTagline, setOptBTagline] = useState(initialData?.optionB?.tagline || '');
  const [optBEmoji, setOptBEmoji] = useState(initialData?.optionB?.emoji || '⚡');
  const [optBImage, setOptBImage] = useState(initialData?.optionB?.imageUrl || '');

  const [daysDuration, setDaysDuration] = useState(3);
  const [published, setPublished] = useState(initialData?.published ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !optALabel.trim() || !optBLabel.trim()) return;

    const payload = {
      title,
      category,
      description,
      published,
      startsAt: Date.now(),
      endsAt: Date.now() + 1000 * 60 * 60 * 24 * daysDuration,
      optionA: {
        id: initialData?.optionA?.id || 'opt_a_' + Math.random().toString(36).substring(2, 6),
        label: optALabel,
        tagline: optATagline,
        emoji: optAEmoji,
        imageUrl: optAImage,
        votes: initialData?.optionA?.votes || 0,
      },
      optionB: {
        id: initialData?.optionB?.id || 'opt_b_' + Math.random().toString(36).substring(2, 6),
        label: optBLabel,
        tagline: optBTagline,
        emoji: optBEmoji,
        imageUrl: optBImage,
        votes: initialData?.optionB?.votes || 0,
      },
    };

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      <div>
        <label className="font-bold text-slate-300 block mb-1">Battle Title *</label>
        <input
          type="text"
          required
          placeholder="e.g. Village Swag vs City Hustle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="font-bold text-slate-300 block mb-1">Duration (Days)</label>
          <input
            type="number"
            min={1}
            max={30}
            value={daysDuration}
            onChange={(e) => setDaysDuration(Number(e.target.value))}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Description</label>
        <textarea
          rows={2}
          placeholder="Explain the battle context for community voters..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Participant Option A */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
        <span className="font-bold text-amber-400 block">Participant Option A *</span>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Label (e.g. Chole Bhature)"
            value={optALabel}
            onChange={(e) => setOptALabel(e.target.value)}
            className="col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={optAEmoji}
            onChange={(e) => setOptAEmoji(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-center"
          />
        </div>
        <input
          type="text"
          placeholder="Tagline (e.g. Desi Makkhan Swag)"
          value={optATagline}
          onChange={(e) => setOptATagline(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Image URL or upload below"
            value={optAImage}
            onChange={(e) => setOptAImage(e.target.value)}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-[11px]"
          />
          <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[10px] flex items-center gap-1">
            <Upload className="h-3 w-3" />
            <span>Upload R2</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await onUploadImage(file);
                  if (url) setOptAImage(url);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Participant Option B */}
      <div className="p-3 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-2">
        <span className="font-bold text-sky-400 block">Participant Option B *</span>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            required
            placeholder="Label (e.g. Cheesy Pizza)"
            value={optBLabel}
            onChange={(e) => setOptBLabel(e.target.value)}
            className="col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={optBEmoji}
            onChange={(e) => setOptBEmoji(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-center"
          />
        </div>
        <input
          type="text"
          placeholder="Tagline (e.g. Extra Crust & Toppings)"
          value={optBTagline}
          onChange={(e) => setOptBTagline(e.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2 text-white"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Image URL or upload below"
            value={optBImage}
            onChange={(e) => setOptBImage(e.target.value)}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 p-2 text-white text-[11px]"
          />
          <label className="cursor-pointer px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[10px] flex items-center gap-1">
            <Upload className="h-3 w-3" />
            <span>Upload R2</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await onUploadImage(file);
                  if (url) setOptBImage(url);
                }
              }}
            />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded accent-amber-500"
        />
        <span className="text-slate-300 font-medium">Publish directly to public Community Battle Arena</span>
      </label>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all"
      >
        {isUploading ? 'Uploading Image...' : 'Save Battle'}
      </button>
    </form>
  );
}

// UPDATES FORM COMPONENT
function UpdatesForm({
  initialData,
  onSave,
}: {
  initialData?: any;
  onSave: (payload: any) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [tag, setTag] = useState(initialData?.tag || 'Announcement');
  const [badgeColor, setBadgeColor] = useState(initialData?.badgeColor || 'amber');
  const [date, setDate] = useState(initialData?.date || 'Today');
  const [published, setPublished] = useState(initialData?.published ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ title, summary, tag, badgeColor, date, published });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      <div>
        <label className="font-bold text-slate-300 block mb-1">Update Headline *</label>
        <input
          type="text"
          required
          placeholder="e.g. Official Battle: Chole Bhature vs Pizza voting is live!"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-sky-500"
        />
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Summary *</label>
        <textarea
          rows={3}
          required
          placeholder="Short announcement displayed on public home page..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Tag</label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          />
        </div>
        <div>
          <label className="font-bold text-slate-300 block mb-1">Badge Color</label>
          <select
            value={badgeColor}
            onChange={(e) => setBadgeColor(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          >
            <option value="amber">Amber (Golden)</option>
            <option value="sky">Sky Blue</option>
            <option value="emerald">Emerald Green</option>
            <option value="purple">Purple</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded accent-sky-500"
        />
        <span className="text-slate-300 font-medium">Publish immediately on website</span>
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all"
      >
        Save & Publish Update
      </button>
    </form>
  );
}

// NEWS FORM COMPONENT
function NewsForm({
  initialData,
  onSave,
  onUploadImage,
  isUploading,
}: {
  initialData?: any;
  onSave: (payload: any) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  isUploading: boolean;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Culture & Festivals');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [author, setAuthor] = useState(initialData?.author || 'Rohit Kumar Nagar');
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ||
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800'
  );
  const [published, setPublished] = useState(initialData?.published ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ title, category, excerpt, content, author, imageUrl, published });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      <div>
        <label className="font-bold text-slate-300 block mb-1">Article Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          />
        </div>
        <div>
          <label className="font-bold text-slate-300 block mb-1">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          />
        </div>
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Excerpt *</label>
        <textarea
          rows={2}
          required
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
        />
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Full Content</label>
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
        />
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Cover Image</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white text-[11px]"
          />
          <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload R2</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await onUploadImage(file);
                  if (url) setImageUrl(url);
                }
              }}
            />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded accent-emerald-500"
        />
        <span className="text-slate-300 font-medium">Publish News Story</span>
      </label>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all"
      >
        {isUploading ? 'Uploading...' : 'Save News'}
      </button>
    </form>
  );
}

// GENERIC ITEM FORM (FOR PEOPLE, BUSINESS, GALLERY, VIDEOS)
function GenericItemForm({
  type,
  initialData,
  onSave,
  onUploadImage,
  isUploading,
}: {
  type: string;
  initialData?: any;
  onSave: (payload: any) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  isUploading: boolean;
}) {
  const [nameOrTitle, setNameOrTitle] = useState(
    initialData?.name || initialData?.title || ''
  );
  const [category, setCategory] = useState(initialData?.category || 'General');
  const [descOrBio, setDescOrBio] = useState(
    initialData?.description || initialData?.bio || initialData?.caption || ''
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ||
      initialData?.photoUrl ||
      initialData?.logoUrl ||
      initialData?.thumbnailUrl ||
      ''
  );
  const [secondaryField, setSecondaryField] = useState(
    initialData?.designation || initialData?.phone || initialData?.videoUrl || ''
  );
  const [published, setPublished] = useState(initialData?.published ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      category,
      published,
    };

    if (type === 'people') {
      payload.name = nameOrTitle;
      payload.designation = secondaryField || 'Community Leader';
      payload.bio = descOrBio;
      payload.photoUrl = imageUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${nameOrTitle}`;
      payload.achievements = initialData?.achievements || 'Village pioneer';
    } else if (type === 'business') {
      payload.name = nameOrTitle;
      payload.phone = secondaryField;
      payload.description = descOrBio;
      payload.logoUrl = imageUrl || 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500';
      payload.verified = true;
      payload.address = initialData?.address || 'Main Road';
    } else if (type === 'gallery') {
      payload.title = nameOrTitle;
      payload.caption = descOrBio;
      payload.imageUrl = imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800';
    } else if (type === 'videos') {
      payload.title = nameOrTitle;
      payload.description = descOrBio;
      payload.videoUrl = secondaryField || 'https://www.youtube.com';
      payload.thumbnailUrl = imageUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800';
    }

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      <div>
        <label className="font-bold text-slate-300 block mb-1">
          {type === 'people' || type === 'business' ? 'Name *' : 'Title *'}
        </label>
        <input
          type="text"
          required
          value={nameOrTitle}
          onChange={(e) => setNameOrTitle(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-300 block mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          />
        </div>
        <div>
          <label className="font-bold text-slate-300 block mb-1">
            {type === 'people'
              ? 'Designation'
              : type === 'business'
              ? 'Phone'
              : type === 'videos'
              ? 'Video URL'
              : 'Tag'}
          </label>
          <input
            type="text"
            value={secondaryField}
            onChange={(e) => setSecondaryField(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
          />
        </div>
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">
          {type === 'people' ? 'Bio' : type === 'gallery' ? 'Caption' : 'Description'}
        </label>
        <textarea
          rows={3}
          value={descOrBio}
          onChange={(e) => setDescOrBio(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white"
        />
      </div>

      <div>
        <label className="font-bold text-slate-300 block mb-1">Image / Asset URL</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-white text-[11px]"
          />
          <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload R2</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await onUploadImage(file);
                  if (url) setImageUrl(url);
                }
              }}
            />
          </label>
        </div>
      </div>

      <label className="flex items-center gap-2 pt-1 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="rounded accent-amber-500"
        />
        <span className="text-slate-300 font-medium">Published / Visible to Public</span>
      </label>

      <button
        type="submit"
        disabled={isUploading}
        className="w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 text-xs shadow-lg transition-all"
      >
        {isUploading ? 'Uploading Image...' : 'Save Item'}
      </button>
    </form>
  );
}
