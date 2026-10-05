'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { User, ChatMessage } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface FloatingChatWidgetProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export function FloatingChatWidget({ currentUser, onOpenAuth }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simple fetch - in prod we'd use realtime subscription
  const fetchMessages = async () => {
    const res = await fetch('/api/chat', { cache: 'no-store' });
    const data = await res.json();
    if (data.messages) {
      setMessages(data.messages.slice(-10)); // Just last 10 messages for simplicity
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: input }),
      });
      setInput('');
      await fetchMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 rounded-full p-4 shadow-lg hover:bg-amber-400 transition"
        >
          <MessageSquare className="text-white" />
        </button>
      ) : (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-stone-200 overflow-hidden">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <Bot size={18} className="text-amber-400" />
              Dhoti AI Support
            </h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={`text-sm ${m.userId === currentUser?.id ? 'text-right' : ''}`}>
                <span className="font-bold">{m.userName}: </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              className="flex-1 border rounded-lg p-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-slate-900 text-white rounded-lg p-2">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
