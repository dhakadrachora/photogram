'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquareWarning, Search, CheckCircle, Clock, Send, Loader2, User } from 'lucide-react';
import { ProblemReport, ReportMessage } from '@/types';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

export default function AdminReportsPage() {
  const { success, error: toastError } = useToast();
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ProblemReport | null>(null);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'Open' | 'Resolved'>('all');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    const res = await adminFetch('/api/reports');
    setIsLoading(false);

    if (res.success && res.reports) {
      setReports(res.reports);
    } else {
      toastError(res.error || 'Failed to fetch problem reports');
    }
  }, [toastError]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSelectReport = async (rep: ProblemReport) => {
    setSelectedReport(rep);
    const res = await adminFetch(`/api/reports?reportId=${rep.id}`);
    if (res.success && res.report) {
      setSelectedReport(res.report);
      setMessages(res.report.messages || []);
    }
  };

  const handleUpdateStatus = async (status: 'Open' | 'Replied' | 'Resolved') => {
    if (!selectedReport) return;

    const res = await adminFetch(`/api/reports/${selectedReport.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      success(`Report marked as ${status}`);
      setSelectedReport((prev) => (prev ? { ...prev, status } : null));
      fetchReports();
    } else {
      toastError(res.error || 'Failed to update report status');
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !replyText.trim()) return;

    setIsReplying(true);
    const res = await adminFetch(`/api/reports/${selectedReport.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: replyText.trim() }),
    });
    setIsReplying(false);

    if (res.success && res.message) {
      success('Reply sent to resident');
      setMessages((prev) => [...prev, res.message]);
      setReplyText('');
      fetchReports();
    } else {
      toastError(res.error || 'Failed to post reply');
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.subject.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight">Resident Support & Issue Reports</h2>
        <p className="text-xs text-slate-400">
          Review problem submissions, resolve community issues, and reply directly to residents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: reports list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <Search className="h-4 w-4 text-slate-400 ml-1" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                className="bg-transparent text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
              {(['all', 'Open', 'Resolved'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    filter === s ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading reports...</div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                No reports matching criteria.
              </div>
            ) : (
              filteredReports.map((r) => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs truncate">{r.subject}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                          r.status === 'Resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">{r.description}</div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/60">
                      <span>{r.userName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('hi-IN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected thread */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[500px]">
          {selectedReport ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedReport.subject}</h3>
                    <p className="text-xs text-slate-400">
                      From: <span className="text-amber-400 font-semibold">{selectedReport.userName}</span> (
                      {selectedReport.userEmail})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedReport.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleUpdateStatus('Resolved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus('Open')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 my-3 text-xs text-slate-300 leading-relaxed">
                  {selectedReport.description}
                </div>

                {/* Conversation Thread */}
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 my-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Thread Responses ({messages.length})
                  </div>
                  {messages.map((m) => {
                    const isAdmin = m.senderRole === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isAdmin
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-100 ml-4'
                            : 'bg-slate-950/80 border-slate-800 text-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold">{isAdmin ? 'Admin 👑' : m.senderName}</span>
                          <span className="font-mono">{new Date(m.createdAt).toLocaleTimeString('hi-IN')}</span>
                        </div>
                        <div>{m.message}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendAdminReply} className="flex gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official admin reply to this resident..."
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isReplying || !replyText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Reply</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 text-xs">
              <MessageSquareWarning className="h-10 w-10 text-slate-700 mb-2" />
              <span>Select an issue or report from the left panel to inspect and respond.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
