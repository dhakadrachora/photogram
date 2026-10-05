'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Maximize2, Sparkles } from 'lucide-react';
import { User, ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';
import { SoundEffects } from '@/lib/audio/sound-effects';

interface FloatingChatWidgetProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  activeTab?: string;
  onNavigateWorldChat?: () => void;
}

export function FloatingChatWidget({
  currentUser,
  onOpenAuth,
  activeTab,
  onNavigateWorldChat,
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If already on the full World Chat screen, do not show duplicate floating chat widget
  if (activeTab === 'worldchat') {
    return null;
  }

  // Fetch recent messages
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages.slice(-15)); // Latest 15 messages
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!input.trim() || isLoading) return;

    const textToSend = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      SoundEffects.playTap();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: textToSend }),
      });
      await fetchMessages();
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Placed safely at bottom-24 on mobile (well above bottom nav dock at bottom-3) so profile tab is 100% clickable */
    <aside 
      aria-label="World Chat Floating Assistant"
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40"
    >
      {!isOpen ? (
        <button
          onClick={() => {
            SoundEffects.playTap();
            setIsOpen(true);
          }}
          id="floating-world-chat-btn"
          className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-3.5 py-2.5 rounded-full shadow-xl shadow-amber-500/25 active:scale-95 transition-all duration-150 cursor-pointer border border-amber-300/40"
          title="World Chat (गाँव चौपाल)"
          aria-label="Open World Chat"
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-4.5 w-4.5 text-slate-950" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
          </div>
          <span className="text-xs font-black tracking-wide pr-1">World Chat</span>
        </button>
      ) : (
        <div 
          className="w-[calc(100vw-32px)] sm:w-88 md:w-96 h-[440px] bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col border border-amber-500/30 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-label="World Chat Window"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 px-4 flex justify-between items-center text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  World Chat
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    लाइव चौपाल
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">गाँव चौपाल में संदेश भेजें</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onNavigateWorldChat && (
                <button
                  onClick={() => {
                    SoundEffects.playTap();
                    setIsOpen(false);
                    onNavigateWorldChat();
                  }}
                  title="पूरा वर्ल्ड चैट पेज खोलें (Full Page)"
                  aria-label="Open full World Chat page"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  type="button"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  SoundEffects.playTap();
                  setIsOpen(false);
                }}
                aria-label="Close World Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4 space-y-2">
                <MessageSquare className="h-8 w-8 text-amber-400/50" />
                <p className="font-medium text-slate-300">चौपाल में अभी बातचीत शुरू करें!</p>
                <p className="text-[11px] text-slate-500">पहला संदेश भेजकर गाँव के साथियों से जुड़ें।</p>
              </div>
            ) : (
              messages.map((m) => {
                const isOwn = m.userId === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 px-1 mb-0.5 font-medium">
                      {isOwn ? 'आप (You)' : m.userName}
                    </span>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl break-words leading-relaxed ${
                        isOwn
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-xs shadow-md shadow-amber-500/10'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Full Chat Link Banner */}
          {onNavigateWorldChat && (
            <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">अधिक फीचर्स व इमेज शेयरिंग के लिए:</span>
              <button
                onClick={() => {
                  SoundEffects.playTap();
                  setIsOpen(false);
                  onNavigateWorldChat();
                }}
                className="text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                type="button"
              >
                <span>पूरी चौपाल देखें</span>
                <Sparkles className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Input & Send Area */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-900/90 flex gap-2 items-center">
            <input
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400 text-white rounded-xl px-3 py-2 text-xs placeholder:text-slate-500 outline-none transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentUser ? "चौपाल में संदेश लिखें..." : "संदेश भेजने के लिए लॉगिन करें..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !!currentUser)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 rounded-xl p-2.5 transition-all font-bold cursor-pointer shrink-0 shadow-md"
              type="button"
              title="संदेश भेजें"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
