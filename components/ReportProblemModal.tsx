'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle,
  X,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Paperclip,
  ChevronLeft,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { User, ProblemReport, ReportMessage, ReportStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SoundEffects } from '@/lib/audio/sound-effects';
import Image from 'next/image';

interface ReportProblemModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export function ReportProblemModal({
  currentUser,
  isOpen,
  onClose,
  onOpenAuth,
}: ReportProblemModalProps) {
  const [activeView, setActiveView] = useState<'create' | 'list' | 'thread'>('list');
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New report form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Thread reply state
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const getAuthToken = async (): Promise<string> => {
    if (!isSupabaseConfigured()) return '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch {
      return '';
    }
  };

  // Load user's reports
  const loadReports = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/reports', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const loadedReports: ProblemReport[] = data.reports || [];
        setReports(loadedReports);
        if (loadedReports.length === 0) {
          setActiveView('create');
        }
      }
    } catch (err) {
      console.warn('Failed to load user reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Load specific report thread
  const loadReportThread = async (reportId: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/reports?reportId=${encodeURIComponent(reportId)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setSelectedReport(data.report);
          // Also update in reports list
          setReports((prev) =>
            prev.map((r) => (r.id === data.report.id ? data.report : r))
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load report thread:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    let isCancelled = false;

    const runFetch = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch('/api/reports', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          const loadedReports: ProblemReport[] = data.reports || [];
          setReports(loadedReports);
          if (loadedReports.length === 0) {
            setActiveView('create');
          }
        }
      } catch (err) {
        console.warn('Failed to load user reports:', err);
      }
    };

    runFetch();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentUser]);

  // Scroll to bottom when thread updates
  useEffect(() => {
    if (activeView === 'thread' && selectedReport?.messages) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeView, selectedReport?.messages]);

  if (!isOpen) return null;

  // If user is not logged in, prompt to log in
  if (!currentUser) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4 shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-white">लॉगिन आवश्यक है / Login Required</h3>
          <p className="text-xs text-slate-300">
            समस्या रिपोर्ट करने या अपनी पिछली शिकायतों की स्थिति देखने के लिए कृपया पहले अपने खाते में लॉगिन करें।
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
            >
              लॉगिन करें / Login
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              रद्द करें / Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle new report submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showNotice('कृपया विषय और समस्या का विवरण भरें।', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      let finalAttachmentUrl = attachmentUrl.trim();

      // Convert image file to base64 data url if selected
      if (attachmentFile) {
        const reader = new FileReader();
        const filePromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(attachmentFile);
        });
        finalAttachmentUrl = await filePromise;
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          attachmentUrl: finalAttachmentUrl || undefined,
          userName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.report) {
        SoundEffects.playSuccess();
        showNotice('आपकी समस्या सफलतापूर्वक दर्ज कर ली गई है! एडमिन जल्द ही उत्तर देंगे।', 'success');
        setSubject('');
        setDescription('');
        setAttachmentUrl('');
        setAttachmentFile(null);
        setReports((prev) => [data.report, ...prev]);
        setSelectedReport(data.report);
        setActiveView('thread');
      } else {
        showNotice(data.error || 'रिपोर्ट दर्ज करने में त्रुटि हुई।', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'रिपोर्ट सबमिट करने में विफल।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sending reply inside report thread
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/reports/${encodeURIComponent(selectedReport.id)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        SoundEffects.playPop();
        setReplyText('');
        // Reload fresh thread
        await loadReportThread(selectedReport.id);
      } else {
        showNotice(data.error || 'उत्तर भेजने में विफल।', 'error');
      }
    } catch (err: any) {
      showNotice(err.message || 'संदेश भेजने में त्रुटि हुई।', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            हल किया गया (Resolved)
          </span>
        );
      case 'Replied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
            <MessageSquare className="h-3 w-3" />
            उत्तर दिया गया (Replied)
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            <Clock className="h-3 w-3" />
            सक्रिय (Open)
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            {activeView === 'thread' && (
              <button
                onClick={() => {
                  setActiveView('list');
                  setSelectedReport(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Back to Reports"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>समस्या रिपोर्ट करें / Report a Problem</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                सीधे एडमिन से सहायता प्राप्त करें और अपनी शिकायतों की स्थिति ट्रैक करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice alert */}
        {notice && (
          <div
            className={`p-3 text-xs flex items-center gap-2 border-b ${
              notice.type === 'error'
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {notice.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Tab Switcher (when not in thread view) */}
        {activeView !== 'thread' && (
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveView('list')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>मेरी रिपोर्ट्स ({reports.length})</span>
            </button>
            <button
              onClick={() => setActiveView('create')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === 'create'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>नई समस्या दर्ज करें (New Report)</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* VIEW 1: MY REPORTS LIST */}
          {activeView === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  कुल रिपोर्ट्स: {reports.length}
                </span>
                <button
                  onClick={loadReports}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>रिफ्रेश</span>
                </button>
              </div>

              {isLoading && reports.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-400" />
                  <p className="text-xs">आपकी रिपोर्ट्स लोड हो रही हैं...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-500 mx-auto">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">कोई समस्या रिपोर्ट नहीं मिली</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      यदि आपको ऐप में कोई तकनीकी समस्या, बग या सहायता की आवश्यकता है, तो नई रिपोर्ट दर्ज करें।
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('create')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>नई रिपोर्ट दर्ज करें</span>
                  </button>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReport(report);
                      setActiveView('thread');
                      loadReportThread(report.id);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {report.subject}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {report.id}
                        </span>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      {report.latestMessage || report.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500/60" />
                        {new Date(report.updatedAt).toLocaleDateString('hi-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-0.5">
                        बातचीत देखें →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: CREATE NEW REPORT */}
          {activeView === 'create' && (
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  विषय / समस्या का शीर्षक (Subject) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="उदा. वॉइस असिस्टेंट कनेक्ट नहीं हो रहा / बैटल में वोट नहीं जा रहा"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  समस्या का पूरा विवरण (Problem Description) <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="कृपया विस्तार से बताएं कि समस्या कब और कैसे हुई, कौन सा बटन दबाने पर एरर आया..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-amber-400" />
                    <span>स्क्रीनशॉट / इमेज अटैचमेंट (वैकल्पिक / Optional)</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAttachmentFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">या इमेज यूआरएल:</span>
                    <input
                      type="url"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* User Identity Info */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>रिपोर्टर: <span className="font-bold text-white">{currentUser.name}</span> ({currentUser.email})</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'सबमिट हो रहा है...' : 'रिपोर्ट सबमिट करें (Submit Report)'}</span>
                </button>
                {reports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    रद्द करें
                  </button>
                )}
              </div>
            </form>
          )}

          {/* VIEW 3: THREAD CONVERSATION */}
          {activeView === 'thread' && selectedReport && (
            <div className="flex flex-col h-full space-y-4">
              {/* Thread Header details */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Report ID: {selectedReport.id}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white mt-1">
                      {selectedReport.subject}
                    </h4>
                  </div>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                  {selectedReport.description}
                </p>

                {selectedReport.attachmentUrl && (
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">संलग्न इमेज (Attachment):</span>
                    <a
                      href={selectedReport.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block relative rounded-xl overflow-hidden border border-slate-700 group"
                    >
                      <Image
                        src={selectedReport.attachmentUrl}
                        alt="Report attachment"
                        width={280}
                        height={140}
                        referrerPolicy="no-referrer"
                        className="max-h-36 object-contain rounded-xl bg-slate-950"
                      />
                    </a>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>दर्ज किया गया: {new Date(selectedReport.createdAt).toLocaleString('hi-IN')}</span>
                  <button
                    onClick={() => loadReportThread(selectedReport.id)}
                    className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>अपडेट जांचें</span>
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 pt-2">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-800/50">
                    बातचीत का इतिहास (Conversation Thread)
                  </span>
                </div>

                {(selectedReport.messages && selectedReport.messages.length > 0
                  ? selectedReport.messages
                  : [
                      {
                        id: 'initial',
                        reportId: selectedReport.id,
                        senderId: selectedReport.userId,
                        senderName: selectedReport.userName,
                        senderEmail: selectedReport.userEmail,
                        senderRole: 'user' as const,
                        message: selectedReport.description,
                        attachmentUrl: selectedReport.attachmentUrl,
                        createdAt: selectedReport.createdAt,
                      },
                    ]
                ).map((msg, index) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1.5 shadow-md ${
                          isAdmin
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-sm'
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          {isAdmin ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <span>Admin 👑</span>
                              <span className="text-[9px] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                                Official Support
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">{msg.senderName} (आप)</span>
                          )}
                          <span className="text-slate-500 font-normal">
                            {new Date(msg.createdAt).toLocaleTimeString('hi-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap">{msg.message}</p>

                        {msg.attachmentUrl && (
                          <div className="pt-1">
                            <Image
                              src={msg.attachmentUrl}
                              alt="attachment"
                              width={240}
                              height={120}
                              referrerPolicy="no-referrer"
                              className="max-h-32 rounded-lg border border-slate-700 bg-slate-950 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="अपना उत्तर या अतिरिक्त विवरण लिखें..."
                  disabled={isSendingReply}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingReply ? 'भेज रहे हैं...' : 'उत्तर भेजें'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
