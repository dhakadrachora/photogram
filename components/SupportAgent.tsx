'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, LifeBuoy } from 'lucide-react';
import { User, ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';

interface SupportAgentProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export function SupportAgent({ currentUser, onOpenAuth }: SupportAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll 24/7 Support messages
  const fetchMessages = async () => {
    // Using /api/chat but perhaps we need a support-specific flag/logic or API
    const res = await fetch('/api/chat', { cache: 'no-store' });
    const data = await res.json();
    if (data.messages) {
      setMessages(data.messages.slice(-20)); // Last 20 messages
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOpen) {
      fetchMessages();
      interval = setInterval(fetchMessages, 5000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = async () => {
    if (!currentUser) { onOpenAuth(); return; }
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Sending to /api/chat with support indicator if API allows, or simply sending to chat for now
      await fetch('/api/chat', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ text: `[Support]: ${input}` }) 
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
    <div className="fixed bottom-20 right-4 z-50">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 rounded-full p-4 shadow-lg text-white hover:bg-blue-700">
          <LifeBuoy />
        </button>
      ) : (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-stone-200 overflow-hidden">
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2"><Bot size={18} /> Support Agent</h3>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className="text-sm"><b>{m.userName}:</b> {m.text}</div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input className="flex-1 border rounded-lg p-2 text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="How can I help?" onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 text-white rounded-lg p-2"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
