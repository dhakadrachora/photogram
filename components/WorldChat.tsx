'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { User, ChatMessage, PresenceUser } from '@/types';
import { SoundEffects } from '@/lib/audio/sound-effects';
import { VerifiedTick } from '@/components/VerifiedTick';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  Send,
  Users,
  Swords,
  Smile,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Bot,
} from 'lucide-react';

interface WorldChatProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onStartBattleInvite: (opponentName: string) => void;
}

function makeTempMsgId() {
  return `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function getNowTimestamp() {
  return Date.now();
}

export function WorldChat({ currentUser, onOpenAuth, onStartBattleInvite }: WorldChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Real-time live presence data (backed by server heartbeat & DB)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  const quickStickers = [
    'Systumm Hang! 🚜',
    'Dhoti Power! 👑',
    'Aaja Bhid le! ⚔️',
    'Arre Bhai Bhai! 🤝',
    'Balle Balle! 💃',
    'Swag 100% ✨',
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
    } else {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch messages from server API
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Could not fetch chat messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch Real Live User Count & Presence from /api/presence
  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/presence', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === 'number') {
          setOnlineCount(data.count);
          setOnlineUsers(data.users || []);
        }
      }
    } catch (err) {
      console.warn('Could not fetch presence count:', err);
    }
  }, []);

  // Send Heartbeat to register real active presence
  const sendPresenceHeartbeat = useCallback(async () => {
    if (!currentUser) {
      // Guest: just poll presence count
      void fetchPresence();
      return;
    }

    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          userBadge: currentUser.badge,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === 'number') {
          setOnlineCount(data.count);
          setOnlineUsers(data.users || []);
        }
      }
    } catch (err) {
      console.warn('Presence heartbeat error:', err);
    }
  }, [currentUser, fetchPresence]);

  // Initial setup & periodic polling for real-time synchronization
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [chatRes, presRes] = await Promise.all([
          fetch('/api/chat', { cache: 'no-store' }),
          fetch('/api/presence', { cache: 'no-store' }),
        ]);
        if (!isMounted) return;
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (Array.isArray(chatData.messages)) {
            setMessages(chatData.messages);
          }
        }
        if (presRes.ok) {
          const presData = await presRes.json();
          if (typeof presData.count === 'number') {
            setOnlineCount(presData.count);
            setOnlineUsers(presData.users || []);
          }
        }
      } catch (err) {
        console.warn('Initial load error:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    void loadInitialData();

    // Heartbeat every 15 seconds for active users
    const presenceInterval = setInterval(() => {
      void sendPresenceHeartbeat();
    }, 15000);

    // Chat polling every 3 seconds
    const chatInterval = setInterval(() => {
      void fetchMessages();
    }, 3000);

    // Supabase Realtime subscription if configured
    let channel: any = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel('public:chat_messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages' },
            (payload) => {
              const newRecord = payload.new;
              if (newRecord && newRecord.id) {
                const incomingMsg: ChatMessage = {
                  id: newRecord.id,
                  userId: newRecord.user_id,
                  userName: newRecord.user_name,
                  userAvatar: newRecord.user_avatar,
                  userBadge: newRecord.user_badge,
                  text: newRecord.text,
                  timestamp: newRecord.created_at ? new Date(newRecord.created_at).getTime() : getNowTimestamp(),
                  sticker: newRecord.sticker || undefined,
                  isAi: Boolean(newRecord.is_ai),
                  isVerified:
                    Boolean(newRecord.is_verified) ||
                    newRecord.user_id === 'dhoti_aale_ai_official' ||
                    newRecord.user_name === 'DHOTI AALE AI',
                };
                setMessages((prev) => {
                  if (prev.some((m) => m.id === incomingMsg.id)) return prev;
                  return [...prev, incomingMsg];
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime subscription notice:', err);
      }
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearInterval(presenceInterval);
      clearInterval(chatInterval);
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (currentUser) {
        void fetch('/api/presence', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [currentUser, fetchMessages, sendPresenceHeartbeat]);

  // Send Chat Message Handler
  const handleSendMessage = async (textToSend: string, stickerText?: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const trimmed = textToSend.trim();
    if (!trimmed && !stickerText) return;

    setAuthError(null);
    SoundEffects.playBell();

    const tempId = makeTempMsgId();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userBadge: currentUser.badge,
      text: trimmed,
      timestamp: getNowTimestamp(),
      sticker: stickerText,
      isAi: false,
      isVerified: currentUser.isVerified || currentUser.email === 'rohitdhakaddhoti143@gmail.com',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage('');
    setShowStickers(false);

    // Check if AI might be thinking
    const triggersAi =
      trimmed.toLowerCase().includes('dhoti aale ai') ||
      trimmed.toLowerCase().includes('dhoti ai') ||
      trimmed.toLowerCase().includes('@dhoti') ||
      /\bai\b/i.test(trimmed);

    if (triggersAi) {
      setIsSending(true);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          user: currentUser,
          text: trimmed,
          sticker: stickerText,
          id: tempId,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAuthError('Authentication required to post. Please sign in again.');
          onOpenAuth();
          setIsSending(false);
          return;
        }
      }

      const data = await res.json();

      // If server returned DHOTI AALE AI reply
      if (data.aiMessage) {
        setTimeout(() => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.aiMessage.id)) return prev;
            return [...prev, data.aiMessage];
          });
          setIsSending(false);
          SoundEffects.playWhistle();
        }, 700);
      } else {
        setIsSending(false);
      }
    } catch (err: any) {
      console.warn('Error delivering chat message:', err);
      setIsSending(false);
    }
  };

  // Format real online user count text
  // Strictly required examples: "1 user online", "10 users online", "25 users online"
  const onlineCountText = `${onlineCount} ${onlineCount === 1 ? 'user online' : 'users online'}`;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header with REAL LIVE USER COUNT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Dhoti aale World Chat
            </h1>

            {/* REAL ACTIVE USER COUNT DISPLAY */}
            <div
              id="world-chat-live-users-badge"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm"
              title="Real-time authenticated active users currently in World Chat"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/25" />
              <span className="text-xs font-bold tracking-wide">
                {onlineCountText}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Public community choupal • banter, battle challenges & live discussion</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/80 font-medium">Featuring official DHOTI AALE AI</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-white block leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  {(currentUser.isVerified || currentUser.email === 'rohitdhakaddhoti143@gmail.com') && (
                    <VerifiedTick size={12} />
                  )}
                </div>
                <span className="text-[9px] text-amber-400 font-semibold block leading-none">
                  {currentUser.badge}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 text-xs shadow-md transition-all active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login to Join</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="my-2 rounded-xl bg-red-500/20 border border-red-500/40 p-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{authError}</span>
          <button onClick={onOpenAuth} className="underline font-bold text-white">
            Sign In
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="mt-4 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[520px]">
        {/* Chat Feed Area */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl relative">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages && messages.length === 0 && (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                <span>Connecting to Dhoti aale World Chat...</span>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = Boolean(currentUser && msg.userId === currentUser.id);
              const isAiParticipant = Boolean(
                msg.isAi ||
                msg.userId === 'dhoti_aale_ai_official' ||
                msg.userName === 'DHOTI AALE AI'
              );

              // Blue Verified Tick logic:
              // 1. DHOTI AALE AI has the blue verified tick by default
              // 2. Individual users granted by Admin have the blue tick
              // 3. Admin has the verified badge
              const showVerifiedTick = Boolean(
                isAiParticipant ||
                msg.isVerified ||
                (isMe && currentUser?.isVerified) ||
                msg.userBadge?.includes('Site Owner')
              );

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Image
                      src={msg.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti'}
                      alt={msg.userName}
                      width={36}
                      height={36}
                      referrerPolicy="no-referrer"
                      className={`h-9 w-9 rounded-full bg-slate-800 ring-2 ${
                        isAiParticipant
                          ? 'ring-amber-500/70 shadow-md shadow-amber-500/20'
                          : showVerifiedTick
                          ? 'ring-sky-500/60'
                          : 'ring-slate-700'
                      }`}
                    />
                    {isAiParticipant && (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 shadow"
                        title="DHOTI AALE Official AI"
                      >
                        ⚡
                      </span>
                    )}
                  </div>

                  <div className={`flex flex-col max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>{msg.userName}</span>
                        {showVerifiedTick && (
                          <VerifiedTick size={14} className="ml-0.5" />
                        )}
                      </span>

                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                          isAiParticipant
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : showVerifiedTick
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {msg.userBadge}
                      </span>

                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-tr-none'
                          : isAiParticipant
                          ? 'bg-amber-500/10 border border-amber-500/35 text-amber-100 rounded-tl-none ring-1 ring-amber-500/15'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                      {msg.sticker && (
                        <div className="mt-1.5 inline-block rounded-xl bg-black/30 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                          {msg.sticker}
                        </div>
                      )}
                    </div>

                    {/* Challenge button if not me, not AI, and logged in */}
                    {!isMe && !isAiParticipant && currentUser && (
                      <button
                        onClick={() => onStartBattleInvite(msg.userName)}
                        className="mt-1 flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        <Swords className="h-3 w-3" />
                        <span>Challenge to Battle</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-amber-400 italic bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl w-fit">
                <Bot className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>DHOTI AALE AI is typing a friendly response...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Bar: Input if Authenticated, or Clear Login Gate if Not Authenticated */}
          {currentUser ? (
            <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
              {/* Quick Stickers Picker */}
              {showStickers && (
                <div className="mb-3 flex flex-wrap gap-1.5 p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700 animate-in slide-in-from-bottom-2">
                  {quickStickers.map((sticker, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage('', sticker)}
                      className="rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStickers(!showStickers)}
                  className={`rounded-2xl p-2.5 sm:p-3 border transition-colors ${
                    showStickers
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Desi Stickers"
                >
                  <Smile className="h-4 w-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="world-chat-input"
                    type="text"
                    placeholder="Type message in World Chat or talk to DHOTI AALE AI..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage(inputMessage);
                    }}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <button
                  id="world-chat-send-btn"
                  onClick={() => handleSendMessage(inputMessage)}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 p-3 text-slate-950 font-bold shadow-md transition-transform active:scale-95"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Clear Google Login Gate Required by User Spec */
            <div
              id="world-chat-login-required-gate"
              className="p-6 bg-slate-900/98 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center justify-center sm:justify-start gap-2">
                    Login to join World Chat
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Auth Required
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Only authenticated users can enter and send World Chat messages.
                  </p>
                </div>
              </div>

              <button
                id="world-chat-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 text-xs sm:text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <LogIn className="h-4 w-4 text-slate-950" />
                <span>Login to join World Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Real Live Active Users & DHOTI AALE AI */}
        <div className="hidden lg:flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Active in Room</h3>
            </div>
            {/* Real online count */}
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {onlineCountText}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {/* OFFICIAL AI PARTICIPANT: DHOTI AALE AI (Always pinned with Blue Verified Tick) */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <Image
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-aale-official-ai"
                    alt="DHOTI AALE AI"
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full bg-slate-800 ring-2 ring-amber-500/40"
                  />
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1 truncate">
                    <span>DHOTI AALE AI</span>
                    <VerifiedTick size={13} />
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-semibold">Official AI ⚡</div>
                </div>
              </div>

              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 shrink-0">
                <VerifiedTick size={10} />
                AI
              </span>
            </div>

            {/* REAL ONLINE USERS LIST (No fake or randomly generated users) */}
            {onlineUsers.length > 0 ? (
              onlineUsers.map((u) => {
                const isMe = currentUser && u.userId === currentUser.id;
                return (
                  <div
                    key={u.userId}
                    className={`flex items-center justify-between p-2 rounded-2xl transition-colors ${
                      isMe ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Image
                          src={u.userAvatar}
                          alt={u.userName}
                          width={32}
                          height={32}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-full bg-slate-800"
                        />
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1">
                          <span>
                            {u.userName} {isMe ? '(You)' : ''}
                          </span>
                          {u.isVerified && <VerifiedTick size={12} />}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {u.userBadge || 'Resident'}
                        </div>
                      </div>
                    </div>

                    {!isMe && currentUser && (
                      <button
                        onClick={() => onStartBattleInvite(u.userName)}
                        className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-slate-800 rounded-xl transition-colors"
                        title={`Challenge ${u.userName}`}
                      >
                        <Swords className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs px-2">
                {currentUser ? (
                  <span>You are currently the only member in the room.</span>
                ) : (
                  <span>No active users right now. Sign in to be the first in the room!</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Talk to DHOTI AALE AI or say &quot;chup&quot; to pause</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
