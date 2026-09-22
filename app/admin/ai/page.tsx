'use client';

import React, { useState } from 'react';
import { Bot, Send, Loader2, Sparkles, Newspaper, Swords, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdminAiPage() {
  const { error: toastError } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Namaste Admin! Main DHOTI AALE Admin AI Assistant hoon. Main website data search karne, news draft karne, battle engagement analyze karne aur system errors explain karne me aapki help kar sakta hoon.\n\n*(Safety Notice: Security policy ke mutabik main koi bhi destructive action (delete/ban) automatically execute nahi karunga, sirf review ke liye draft taiyar karunga).*',
    },
  ]);

  const handleSendPrompt = async (customPrompt?: string, action = 'general') => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || isProcessing) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setPrompt('');
    setIsProcessing(true);

    const res = await adminFetch('/api/admin/ai', {
      method: 'POST',
      body: JSON.stringify({ prompt: textToSend, action }),
    });

    setIsProcessing(false);

    if (res.success && res.response) {
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } else {
      toastError(res.error || 'AI Assistant response failed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Kshama karein, request process karte samay samasya aayi. Kripya doobara prayas karein.',
        },
      ]);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <Bot className="h-5 w-5 text-amber-500" />
          <span>DHOTI AALE Admin AI Assistant</span>
        </h2>
        <p className="text-xs text-slate-400">
          Dedicated AI co-pilot for portal content management, analytics reviews, and automated drafting.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-300">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
        <span>
          <strong>Destructive Action Guard:</strong> The AI Assistant will never delete, ban, or modify live records autonomously. All administrative actions require your explicit confirmation.
        </span>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            handleSendPrompt(
              'ढोटी गाँव में आयोजित होने वाले आगामी जल संरक्षण कार्यक्रम पर एक न्यूज़ आर्टिकल ड्राफ्ट करो।',
              'draft_news'
            )
          }
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs text-slate-300 hover:text-amber-400 transition-colors"
        >
          <Newspaper className="h-3.5 w-3.5" />
          <span>Draft News Article</span>
        </button>

        <button
          onClick={() =>
            handleSendPrompt('Recent Community Battles ka engagement analyze karo aur suggestions do.', 'analyze_battles')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs text-slate-300 hover:text-amber-400 transition-colors"
        >
          <Swords className="h-3.5 w-3.5" />
          <span>Analyze Battle Votes</span>
        </button>

        <button
          onClick={() =>
            handleSendPrompt('DHOTI AALE portal me village businesses ki listing badhane ke liye kya steps lene chahiye?')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs text-slate-300 hover:text-amber-400 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Community Engagement Ideas</span>
        </button>
      </div>

      {/* Messages Thread Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between min-h-[450px]">
        <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-xl whitespace-pre-wrap ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          {isProcessing && (
            <div className="flex gap-3 text-xs items-center text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span>AI analyzing database records and preparing suggestion...</span>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2 pt-4 border-t border-slate-800 mt-4"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI Assistant anything about DHOTI AALE content, stats, or drafting..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md disabled:opacity-50 transition-all active:scale-95 shrink-0"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
