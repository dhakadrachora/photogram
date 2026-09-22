'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Paperclip,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  Search,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  User as UserIcon,
} from 'lucide-react';
import { User, ProblemReport, ReportMessage, ReportStatus, AppTab } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SoundEffects } from '@/lib/audio/sound-effects';

interface SupportViewProps {
  currentUser: User | null;
  onNavigateTab?: (tab: AppTab) => void;
  onOpenAuth?: () => void;
  isStandalonePage?: boolean;
}

const ISSUE_CATEGORIES = [
  { id: 'Coins & Rewards', label: 'सिक्के व इनाम (Coins / Rewards)', icon: '💰' },
  { id: 'Battle Dispute', label: 'मुकाबला विवाद (Battle Dispute)', icon: '⚔️' },
  { id: 'Technical Glitch', label: 'तकनीकी समस्या (Bug / Glitch)', icon: '🛠️' },
  { id: 'Account & VIP', label: 'खाता व सत्यापन (Account / VIP)', icon: '👑' },
  { id: 'Suggestion', label: 'सुझाव व फीडबैक (Suggestion)', icon: '💡' },
  { id: 'Other', label: 'अन्य सहायता (Other Help)', icon: '❓' },
];

export function SupportView({
  currentUser,
  onNavigateTab,
  onOpenAuth,
  isStandalonePage = false,
}: SupportViewProps) {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'thread'>('list');
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Replied' | 'Resolved'>('All');

  // New report form state
  const [selectedCategory, setSelectedCategory] = useState('Coins & Rewards');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Thread reply state
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4500);
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (currentUser?.id) {
      headers['x-user-id'] = currentUser.id;
    }
    if (currentUser?.email) {
      headers['x-user-email'] = currentUser.email;
    }
    if (currentUser?.name) {
      headers['x-user-name'] = currentUser.name;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}
    }

    return headers;
  };

  // Fetch all user reports
  const fetchReports = useCallback(async (quiet = false) => {
    if (!currentUser) {
      setReports([]);
      return;
    }

    if (!quiet) setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/reports', { headers });

      if (res.ok) {
        const data = await res.json();
        const loaded: ProblemReport[] = data.reports || [];
        setReports(loaded);
      }
    } catch (err) {
      console.warn('Failed to fetch reports:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [currentUser]);

  // Load specific report thread
  const loadReportThread = useCallback(async (reportId: string, quiet = false) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/reports?reportId=${encodeURIComponent(reportId)}`, { headers });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setSelectedReport(data.report);
          setReports((prev) =>
            prev.map((r) => (r.id === data.report.id ? data.report : r))
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load thread:', err);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Live polling for open thread every 4 seconds
  useEffect(() => {
    if (activeView !== 'thread' || !selectedReport?.id) return;

    const interval = setInterval(() => {
      loadReportThread(selectedReport.id, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeView, selectedReport?.id, loadReportThread]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    if (activeView === 'thread' && selectedReport?.messages) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeView, selectedReport?.messages]);

  // Handle file preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isForReply = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotice('फ़ाइल का आकार 5MB से कम होना चाहिए।', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (isForReply) {
        setReplyFile(file);
        setReplyPreview(url);
      } else {
        setAttachmentFile(file);
        setImagePreview(url);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit new ticket
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    if (!subject.trim() || !description.trim()) {
      showNotice('कृपया विषय और समस्या का विवरण अवश्य भरें।', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      let finalAttachment = attachmentUrl.trim();

      if (imagePreview) {
        finalAttachment = imagePreview;
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: selectedCategory,
          subject: subject.trim(),
          description: description.trim(),
          attachmentUrl: finalAttachment || undefined,
          userName: currentUser.name,
          userId: currentUser.id,
          userEmail: currentUser.email,
        }),
      });

      const data = await res.json();
      if (res.ok && data.report) {
        try {
          SoundEffects.playSuccess();
        } catch {}
        showNotice('आपकी शिकायत दर्ज कर ली गई है! एडमिन जल्द ही उत्तर देंगे।', 'success');
        setSubject('');
        setDescription('');
        setAttachmentUrl('');
        setAttachmentFile(null);
        setImagePreview(null);
        setReports((prev) => [data.report, ...prev]);
        setSelectedReport(data.report);
        setActiveView('thread');
      } else {
        showNotice(data.error || 'शिकायत दर्ज करने में विफल। कृपया पुनः प्रयास करें।', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'नेटवर्क त्रुटि हुई।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || (!replyText.trim() && !replyPreview)) return;

    setIsSendingReply(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/reports/${encodeURIComponent(selectedReport.id)}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: replyText.trim() || '📸 [फोटो संलग्न / Attached Image]',
          attachmentUrl: replyPreview || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        try {
          SoundEffects.playPop();
        } catch {}
        setReplyText('');
        setReplyFile(null);
        setReplyPreview(null);
        await loadReportThread(selectedReport.id);
      } else {
        showNotice(data.error || 'उत्तर भेजने में विफल।', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'त्रुटि हुई।', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Status badge formatter
  const renderStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            हल किया गया (Resolved)
          </span>
        );
      case 'Replied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-sm shadow-amber-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            एडमिन उत्तर (Admin Replied)
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-bold">
            <Clock className="h-3.5 w-3.5" />
            प्रतीक्षारत (Open)
          </span>
        );
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.subject.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Banner & Header */}
      <div className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onNavigateTab ? (
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="होम पर वापस जाएँ"
              >
                <ArrowLeft className="h-4 w-4 text-amber-400" />
              </button>
            ) : isStandalonePage ? (
              <a
                href="/"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">गाँव होम</span>
              </a>
            ) : null}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  DHOTI AALE सहायता केंद्र
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  24/7 Live Support
                </span>
              </div>
              <p className="text-[11px] text-slate-400">सीधा एडमिन से बात करें • समस्या समाधान व सुझाव</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
                <img
                  src={currentUser.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti'}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400/40"
                />
                <span className="font-semibold text-slate-200 max-w-[120px] truncate">{currentUser.name}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20"
              >
                लॉगिन करें
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Notice Banner */}
      {notice && (
        <div className="fixed top-16 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-4">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 ${
              notice.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {!currentUser ? (
          /* Unauthenticated State */
          <div className="my-auto py-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-xl">
              <HelpCircle className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              सपोर्ट व एडमिन चैट के लिए लॉगिन करें
            </h2>
            <p className="text-sm text-slate-400 max-w-md mb-8">
              अपनी पिछली समस्याओं की स्थिति देखने, नई टिकट दर्ज करने, और एडमिन के संदेशों का रीयल-टाइम उत्तर देने के लिए अपने खाते में साइन-इन करें।
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={onOpenAuth}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:scale-[1.02] active:scale-[0.98] text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <UserIcon className="h-4 w-4 text-slate-950" />
                लॉगिन / साइन-अप करें
              </button>
            </div>

            {/* Quick Emergency Contact options */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="mailto:rohitdhakaddhoti132@gmail.com"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors group flex items-start gap-3"
              >
                <Mail className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">ईमेल सपोर्ट</div>
                  <div className="text-[11px] text-slate-400">rohitdhakaddhoti132@gmail.com</div>
                </div>
              </a>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">औसत प्रतिक्रिया समय</div>
                  <div className="text-[11px] text-slate-400">15 से 30 मिनट के भीतर</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Support Experience */
          <div className="flex-1 flex flex-col">
            {/* View Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('list');
                    fetchReports();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeView === 'list'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  मेरी शिकायतें ({reports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('create')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeView === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  नई समस्या दर्ज करें
                </button>
                {selectedReport && (
                  <button
                    type="button"
                    onClick={() => setActiveView('thread')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeView === 'thread'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    सक्रिय बातचीत
                  </button>
                )}
              </div>

              {activeView === 'list' && (
                <button
                  type="button"
                  onClick={() => fetchReports()}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                  title="रिफ्रेश करें"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* VIEW 1: MY TICKETS LIST                              */}
            {/* ---------------------------------------------------- */}
            {activeView === 'list' && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Search and Status Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="शिकायत या विषय खोजें..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(['All', 'Open', 'Replied', 'Resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                          statusFilter === st
                            ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                        }`}
                      >
                        {st === 'All'
                          ? 'सभी (All)'
                          : st === 'Replied'
                          ? 'एडमिन उत्तर (Replied)'
                          : st === 'Open'
                          ? 'ओपन (Open)'
                          : 'हल हुआ (Resolved)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ticket Cards */}
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                    <RefreshCw className="h-8 w-8 animate-spin text-amber-400 mb-3" />
                    <p className="text-xs">टिकट लोड हो रहे हैं...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                      <HelpCircle className="h-7 w-7 text-amber-400/60" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">कोई शिकायत या टिकट नहीं मिला</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-5">
                      यदि आपको किसी प्रकार की समस्या, सिक्कों की दिक्कत या सहायता चाहिए तो नई टिकट दर्ज करें।
                    </p>
                    <button
                      onClick={() => setActiveView('create')}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                    >
                      <PlusCircle className="h-4 w-4" />
                      नई समस्या दर्ज करें
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => {
                          setSelectedReport(report);
                          setActiveView('thread');
                          loadReportThread(report.id);
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.005] ${
                          report.status === 'Replied'
                            ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-slate-500">#{report.id.slice(-6)}</span>
                            <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                              {report.subject}
                            </h4>
                          </div>
                          {renderStatusBadge(report.status)}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {report.latestMessage || report.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.updatedAt || report.createdAt).toLocaleString('hi-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                            बातचीत खोलें <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 2: CREATE NEW TICKET                            */}
            {/* ---------------------------------------------------- */}
            {activeView === 'create' && (
              <div className="max-w-2xl mx-auto w-full">
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">नई समस्या या प्रश्न दर्ज करें</h3>
                      <p className="text-xs text-slate-400">एडमिन टीम आपकी सहायता के लिए सदैव तत्पर है</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitReport} className="space-y-5">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">समस्या की श्रेणी (Category)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ISSUE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                              selectedCategory === cat.id
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-sm">{cat.icon}</span>
                            <span className="truncate">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        मुख्य विषय / शीर्षक (Subject) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. सिक्के वॉलेट में नहीं जुड़े / मुकाबला विवाद"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        विस्तार से बताएं (Problem Description) <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="अपनी समस्या, क्या हुआ, कब हुआ, और जो भी विवरण हो कृपया यहाँ लिखें..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 leading-relaxed"
                      />
                    </div>

                    {/* Attachment Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        स्क्रीनशॉट / फोटो संलग्न करें (Optional Attachment)
                      </label>
                      {imagePreview ? (
                        <div className="relative inline-block rounded-2xl overflow-hidden border border-slate-700 max-w-xs">
                          <img src={imagePreview} alt="Preview" className="max-h-48 w-auto object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setAttachmentFile(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-rose-400 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-amber-400 text-xs font-semibold text-slate-300 hover:text-white transition-colors inline-flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-amber-400" />
                            <span>फोटो या स्क्रीनशॉट चुनें</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, false)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[11px] text-slate-500">JPG, PNG (अधिकतम 5MB)</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:scale-[1.01] active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                            शिकायत दर्ज हो रही है...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            शिकायत सबमिट करें (Submit Ticket)
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('list')}
                        className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                      >
                        रद्द करें
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW 3: INTERACTIVE CHAT THREAD WITH ADMIN           */}
            {/* ---------------------------------------------------- */}
            {activeView === 'thread' && selectedReport && (
              <div className="flex-1 flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden min-h-[600px] max-h-[calc(100vh-140px)]">
                {/* Thread Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('list');
                        fetchReports();
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="शिकायत सूची पर वापस जाएँ"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-500">#{selectedReport.id.slice(-6)}</span>
                        <h3 className="text-sm sm:text-base font-black text-white">{selectedReport.subject}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        शुरू हुआ:{' '}
                        {new Date(selectedReport.createdAt).toLocaleDateString('hi-IN', {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStatusBadge(selectedReport.status)}
                    <button
                      type="button"
                      onClick={() => loadReportThread(selectedReport.id)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400"
                      title="रीफ्रेश करें"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40">
                  {/* Initial Problem Description Banner */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>शिकायत का विवरण (Initial Report)</span>
                      <span>{new Date(selectedReport.createdAt).toLocaleTimeString('hi-IN')}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                    {selectedReport.attachmentUrl && (
                      <div className="pt-2">
                        <img
                          src={selectedReport.attachmentUrl}
                          alt="Attachment"
                          onClick={() => setActiveImageModal(selectedReport.attachmentUrl!)}
                          className="max-h-44 max-w-full rounded-xl object-cover border border-slate-700 cursor-pointer hover:opacity-90"
                        />
                      </div>
                    )}
                  </div>

                  {/* Thread messages */}
                  {selectedReport.messages && selectedReport.messages.length > 0 ? (
                    selectedReport.messages.map((msg) => {
                      const isAdminMsg = msg.senderRole === 'admin';

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                            isAdminMsg ? 'mr-auto items-start' : 'ml-auto flex-row-reverse items-end'
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold ${
                              isAdminMsg
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-600 border-amber-400 text-slate-950 shadow-md'
                                : 'bg-slate-800 border-slate-700 text-slate-200'
                            }`}
                          >
                            {isAdminMsg ? '👑' : msg.senderName?.[0] || 'U'}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`p-3.5 rounded-2xl text-xs space-y-1.5 shadow-md ${
                              isAdminMsg
                                ? 'bg-gradient-to-b from-slate-900 to-slate-900/95 border border-amber-500/40 text-slate-100 rounded-tl-sm'
                                : 'bg-emerald-600 text-white rounded-tr-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                              <span className="font-bold flex items-center gap-1">
                                {isAdminMsg ? (
                                  <>
                                    <span className="text-amber-400 font-black">एडमिन रोहित धाकड़</span>
                                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                                      HQ
                                    </span>
                                  </>
                                ) : (
                                  msg.senderName || 'आप (You)'
                                )}
                              </span>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString('hi-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                            {msg.attachmentUrl && (
                              <div className="pt-1.5">
                                <img
                                  src={msg.attachmentUrl}
                                  alt="Attachment"
                                  onClick={() => setActiveImageModal(msg.attachmentUrl!)}
                                  className="max-h-40 rounded-xl object-cover border border-white/20 cursor-pointer hover:opacity-90"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : null}

                  <div ref={threadEndRef} />
                </div>

                {/* Reply Input Bar */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80">
                  {replyPreview && (
                    <div className="mb-2 relative inline-block rounded-xl overflow-hidden border border-slate-700">
                      <img src={replyPreview} alt="Reply preview" className="h-16 w-auto object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setReplyPreview(null);
                          setReplyFile(null);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors shrink-0">
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="एडमिन को उत्तर या सवाल लिखें..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
                    />

                    <button
                      type="submit"
                      disabled={isSendingReply || (!replyText.trim() && !replyPreview)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    >
                      {isSendingReply ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>भेजें</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Image Modal Lightbox */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={activeImageModal} alt="Enlarged" className="max-h-[85vh] w-auto rounded-2xl shadow-2xl border border-slate-700 object-contain" />
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 text-white border border-slate-700 hover:bg-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
