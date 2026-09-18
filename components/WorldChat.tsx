'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, ChatMessage } from '@/types';
import { SoundEffects } from '@/lib/audio/sound-effects';
import {
  Send,
  Users,
  Swords,
  Smile,
  Lock,
  LogIn,
  Flame,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface WorldChatProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onStartBattleInvite: (opponentName: string) => void;
}

const STATIC_TIME = 1726000000000;

const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    userId: 'usr_bot1',
    userName: 'Vikram Choudhary',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vikram-dhoti',
    userBadge: 'Dhoti King 👑',
    text: 'Ram Ram bhaiyo! Dhoti aale world chat me swagat hai sabka! Aaj rap battle me kaun aayega?',
    timestamp: STATIC_TIME - 1000 * 60 * 12,
  },
  {
    id: 'msg-2',
    userId: 'usr_bot2',
    userName: 'Aman Dhakad',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aman-dhoti',
    userBadge: 'Rap Boss 🎤',
    text: 'Main tayyar hu! Dhoti AI se voice pe baat ki thi abhi, kya witty reply diya usne maja aa gaya!',
    timestamp: STATIC_TIME - 1000 * 60 * 7,
    sticker: 'Systumm Hang! 🚜',
  },
  {
    id: 'msg-3',
    userId: 'usr_ai',
    userName: 'Dhoti aale AI',
    userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-ai-assistant',
    userBadge: 'Official AI ⚡',
    text: 'Arey Aman mere bhai! Tareef ke liye shukriya! Aur batao, aaj kiska mood khrab hai jisko witty roasting chahiye? 😉',
    timestamp: STATIC_TIME - 1000 * 60 * 3,
    isAi: true,
  },
];

const mockOnlineUsers = [
  { name: 'Rohit Kumar Nagar', badge: 'Site Owner & Admin 👑', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-admin' },
  { name: 'Rohit Dhakad', badge: 'Co-Founder 👑', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-dhoti' },
  { name: 'Dhoti aale AI', badge: 'Official AI ⚡', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-ai-assistant' },
  { name: 'Aman Dhakad', badge: 'Rap Boss 🎤', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aman-dhoti' },
  { name: 'Vikram Choudhary', badge: 'Elite Fighter ⚔️', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vikram-dhoti' },
  { name: 'Simran Dhoti', badge: 'Wit Champion 🌟', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=simran-dhoti' },
];

let globalMsgCount = 100;
function createMsgId(prefix: string) {
  globalMsgCount += 1;
  return `${prefix}_${globalMsgCount}`;
}

export function WorldChat({ currentUser, onOpenAuth, onStartBattleInvite }: WorldChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const quickStickers = [
    'Systumm Hang! 🚜',
    'Dhoti Power! 👑',
    'Aaja Bhid le! ⚔️',
    'Arre Bhai Bhai! 🤝',
    'Balle Balle! 💃',
    'Swag 100% ✨',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string, stickerText?: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!textToSend.trim() && !stickerText) return;

    setAuthError(null);

    // Server-Side Authentication Enforcement
    try {
      const authRes = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          user: currentUser,
          text: textToSend.trim(),
          sticker: stickerText,
        }),
      });

      if (!authRes.ok) {
        if (authRes.status === 401) {
          setAuthError('Google authentication required to post. Please sign in again.');
          onOpenAuth();
          return;
        }
      }
    } catch {
      // Local graceful fallback if network glitch occurs
    }

    SoundEffects.playBell();

    const timestamp = Number(new Date());
    const id = createMsgId('msg_user');

    const newMsg: ChatMessage = {
      id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userBadge: currentUser.badge,
      text: textToSend.trim(),
      timestamp,
      sticker: stickerText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setShowStickers(false);

    // If message mentions @DhotiAI or asks AI, generate witty AI reply in chat
    if (textToSend.toLowerCase().includes('@dhoti') || textToSend.toLowerCase().includes('ai')) {
      setIsSending(true);
      try {
        const res = await fetch('/api/gemini/voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-request-mode': 'text',
          },
          body: JSON.stringify({
            prompt: `User "${currentUser.name}" mentioned you in Dhoti aale World Chat: "${textToSend}". Give a very witty, playful, flirty/teasing Hinglish response for the chat room.`,
            mode: 'text',
            isVoice: false,
          }),
        });
        const data = await res.json();
        const aiTimestamp = Number(new Date());
        const aiMsgId = createMsgId('msg_ai');
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              userId: 'usr_ai',
              userName: 'Dhoti aale AI',
              userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-ai-assistant',
              userBadge: 'Official AI ⚡',
              text: data.text || 'Arey kya baat hai! Dhoti aale ka swag hamesha number one rahega!',
              timestamp: aiTimestamp,
              isAi: true,
            },
          ]);
          setIsSending(false);
          SoundEffects.playWhistle();
        }, 800);
      } catch {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">Dhoti aale World Chat</h1>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-bold hidden xs:inline">Live Room</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Public community hangout, banter, rap battle challenges & live discussion
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div className="text-left">
                <span className="text-[11px] font-bold text-white block leading-tight">
                  {currentUser.name}
                </span>
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
      <div className="mt-4 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
        {/* Chat Feed Area */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl relative">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isMe = currentUser && msg.userId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Image
                      src={msg.userAvatar}
                      alt={msg.userName}
                      width={36}
                      height={36}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-full bg-slate-800 ring-2 ring-slate-700"
                    />
                    {msg.isAi && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950">
                        ⚡
                      </span>
                    )}
                  </div>

                  <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-200">{msg.userName}</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                          msg.isAi
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
                          : msg.isAi
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-none'
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

                    {/* Challenge button if not me and logged in */}
                    {!isMe && !msg.isAi && currentUser && (
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
              <div className="flex items-center gap-2 text-xs text-amber-400 italic">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                Dhoti aale AI is typing a witty response...
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
                    placeholder="Type message in World Chat or tag @DhotiAI..."
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
                    Login with Google to join World Chat
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Auth Required
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Only authenticated Google users can enter and send World Chat messages.
                  </p>
                </div>
              </div>

              <button
                id="world-chat-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 px-6 py-3 text-xs sm:text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <LogIn className="h-4 w-4 text-blue-600" />
                <span>Login with Google to join World Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Dhoti Gang Online */}
        <div className="hidden lg:flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Dhoti Gang Online</h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {mockOnlineUsers.length + (currentUser ? 1 : 0)} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {/* Current user at top if logged in */}
            {currentUser && (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <Image
                      src={currentUser.avatar}
                      alt="You"
                      width={32}
                      height={32}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-bold text-amber-300 truncate">
                      {currentUser.name} (You)
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{currentUser.badge}</div>
                  </div>
                </div>
              </div>
            )}

            {mockOnlineUsers.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-900/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <Image
                      src={u.avatar}
                      alt={u.name}
                      width={32}
                      height={32}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full bg-slate-800"
                    />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-medium text-slate-200 truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{u.badge}</div>
                  </div>
                </div>

                {currentUser && u.name !== 'Dhoti aale AI' && (
                  <button
                    onClick={() => onStartBattleInvite(u.name)}
                    className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-slate-800 rounded-xl transition-colors"
                    title={`Challenge ${u.name}`}
                  >
                    <Swords className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Tag @DhotiAI anytime for witty banter!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
