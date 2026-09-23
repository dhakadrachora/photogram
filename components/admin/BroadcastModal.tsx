'use client';

import React, { useState } from 'react';
import { Mail, Bell, Zap, Send, X, AlertCircle, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: 'all' | 'selected';
  selectedUserIds?: string[];
  selectedCount?: number;
  initialType?: 'email' | 'notification' | 'both';
  onSuccess?: () => void;
}

export function BroadcastModal({
  isOpen,
  onClose,
  target,
  selectedUserIds = [],
  selectedCount = 0,
  initialType = 'both',
  onSuccess,
}: BroadcastModalProps) {
  const { success, error: toastError } = useToast();
  const [type, setType] = useState<'email' | 'notification' | 'both'>(initialType);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const countDisplay = target === 'all' ? 'All Registered Residents' : `${selectedCount || selectedUserIds.length} Selected Residents`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError('Please enter a subject or title');
      return;
    }
    if (!message.trim()) {
      toastError('Please enter your broadcast message');
      return;
    }

    if (target === 'selected' && (!selectedUserIds || selectedUserIds.length === 0)) {
      toastError('No users selected to receive broadcast');
      return;
    }

    setIsSending(true);

    try {
      const res = await adminFetch('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          type,
          target,
          userIds: selectedUserIds,
          title: title.trim(),
          message: message.trim(),
          actionUrl: actionUrl.trim() || undefined,
          priority,
        }),
      });

      setIsSending(false);

      if (res.success && res.data) {
        const emailMsg = res.data.sentCount ? `${res.data.sentCount} emails sent` : '';
        const notifMsg = res.data.notificationCount ? `${res.data.notificationCount} notifications delivered` : '';
        const summary = [emailMsg, notifMsg].filter(Boolean).join(' & ') || 'Broadcast broadcasted successfully';

        success(`Success! ${summary}`);
        setTitle('');
        setMessage('');
        setActionUrl('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toastError(res.error || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      setIsSending(false);
      toastError(err.message || 'Error sending broadcast');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">
                Admin Broadcast Dispatcher
              </h3>
              <p className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 mt-0.5">
                <Users className="h-3.5 w-3.5" />
                <span>Audience: <strong>{countDisplay}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Channel Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Broadcast Delivery Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('both')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === 'both'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Email & App</span>
              </button>

              <button
                type="button"
                onClick={() => setType('email')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === 'email'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Email Only</span>
              </button>

              <button
                type="button"
                onClick={() => setType('notification')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  type === 'notification'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
                <span>In-App Only</span>
              </button>
            </div>
          </div>

          {/* Title / Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'email' ? 'Email Subject' : 'Notification Title / Subject'} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DHOTI AALE: विशेष समुदाय सूचना एवं अपडेट"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Message Content (Hindi / English supported) *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="सभी ग्रामवासियों एवं सम्मानित निवासियों को सूचित किया जाता है कि..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 resize-none"
            />
          </div>

          {/* Action Link & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Action Link URL (Optional)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://dhotiaale.online/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Broadcast Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500/60"
              >
                <option value="normal">Normal (सामान्य)</option>
                <option value="high">High (महत्वपूर्ण)</option>
                <option value="urgent">Urgent (अति आवश्यक)</option>
              </select>
            </div>
          </div>

          {/* Info note */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/80 leading-relaxed flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              यह संदेश चयनित सभी यूज़र्स को तुरंत उनके ईमेल और ऐप नोटिफिकेशन में भेजा जाएगा।
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Broadcast Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
