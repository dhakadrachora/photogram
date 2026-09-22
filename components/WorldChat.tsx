'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Bot,
} from 'lucide-react';

interface WorldChatProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onStartBattleInvite: (opponentName: string) => void;
}

const MESSAGE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getMessageTimestamp(message: ChatMessage) {
  return Number(message.timestamp || 0);
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort(
    (a, b) => getMessageTimestamp(a) - getMessageTimestamp(b)
  );
}

function removeExpiredMessages(messages: ChatMessage[]) {
  const cutoff = Date.now() - MESSAGE_EXPIRATION_MS;

  return messages.filter(
    (message) => getMessageTimestamp(message) >= cutoff
  );
}

function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
) {
  const map = new Map<string, ChatMessage>();

  for (const message of current) {
    map.set(message.id, message);
  }

  for (const message of incoming) {
    map.set(message.id, message);
  }

  return sortMessages(removeExpiredMessages(Array.from(map.values())));
}

function mapRealtimeMessage(record: any): ChatMessage {
  return {
    id: String(record.id),
    userId: String(record.user_id || ''),
    userName: record.user_name || 'Dhoti Resident',
    userAvatar:
      record.user_avatar ||
      'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti',
    userBadge: record.user_badge || 'Dhoti Resident',
    text: record.text || '',
    timestamp: record.created_at
      ? new Date(record.created_at).getTime()
      : Date.now(),
    sticker: record.sticker || undefined,
    isAi: Boolean(record.is_ai),
    isVerified:
      Boolean(record.is_verified) ||
      record.user_id === 'dhoti_aale_ai_official' ||
      record.user_name === 'DHOTI AALE AI' ||
      String(record.user_badge || '').includes('Site Owner'),
  };
}

export function WorldChat({
  currentUser,
  onOpenAuth,
  onStartBattleInvite,
}: WorldChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const initialLoadRef = useRef(true);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<any>(null);

  const quickStickers = [
    'Systumm Hang! 🚜',
    'Dhoti Power! 👑',
    'Aaja Bhid le! ⚔️',
    'Arre Bhai Bhai! 🤝',
    'Balle Balle! 💃',
    'Swag 100% ✨',
  ];

  /*
   * ------------------------------------------------------------
   * AUTH TOKEN
   * ------------------------------------------------------------
   */

  const getAccessToken = useCallback(async () => {
    if (!isSupabaseConfigured()) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  }, []);

  /*
   * ------------------------------------------------------------
   * SCROLL
   * ------------------------------------------------------------
   */

  const isNearBottom = useCallback(() => {
    const container = chatScrollRef.current;

    if (!container) return true;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    return distanceFromBottom < 120;
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = chatScrollRef.current;

      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    },
    []
  );

  const handleChatScroll = useCallback(() => {
    shouldAutoScrollRef.current = isNearBottom();
  }, [isNearBottom]);

  /*
   * ------------------------------------------------------------
   * MESSAGE EXPIRY
   * ------------------------------------------------------------
   */

  const removeExpiredFromUI = useCallback(() => {
    setMessages((previous) => {
      const cleaned = removeExpiredMessages(previous);

      if (cleaned.length === previous.length) {
        return previous;
      }

      return cleaned;
    });
  }, []);

  /*
   * ------------------------------------------------------------
   * FETCH CHAT
   * ------------------------------------------------------------
   */

  const fetchMessages = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/chat', {
        method: 'GET',
        cache: 'no-store',
        headers,
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setAuthError(
          data?.error || 'Your World Chat access is blocked.'
        );
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || 'Could not load World Chat.'
        );
      }

      if (Array.isArray(data.messages)) {
        setMessages((previous) => {
          const merged = mergeMessages(
            previous,
            data.messages
          );

          return merged;
        });
      }

      setAuthError(null);
    } catch (error) {
      console.warn('World Chat fetch error:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [getAccessToken]);

  /*
   * ------------------------------------------------------------
   * PRESENCE
   * ------------------------------------------------------------
   *
   * Presence is kept separate from World Chat.
   * It will be secured properly in the presence API.
   */

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/presence', {
        cache: 'no-store',
      });

      if (!res.ok) return;

      const data = await res.json();

      if (typeof data.count === 'number') {
        setOnlineCount(Math.max(0, data.count));
        setOnlineUsers(
          Array.isArray(data.users) ? data.users : []
        );
      }
    } catch (error) {
      console.warn('Presence fetch error:', error);
    }
  }, []);

  const sendPresenceHeartbeat = useCallback(async () => {
    if (!currentUser) {
      await fetchPresence();
      return;
    }

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        await fetchPresence();
        return;
      }

      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        await fetchPresence();
        return;
      }

      const data = await res.json();

      if (typeof data.count === 'number') {
        setOnlineCount(Math.max(0, data.count));
        setOnlineUsers(
          Array.isArray(data.users) ? data.users : []
        );
      }
    } catch (error) {
      console.warn('Presence heartbeat error:', error);
      await fetchPresence();
    }
  }, [currentUser, fetchPresence, getAccessToken]);

  /*
   * ------------------------------------------------------------
   * INITIAL LOAD + REALTIME
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;

      await Promise.all([
        fetchMessages(),
        fetchPresence(),
      ]);
    };

    void load();

    /*
     * Presence heartbeat for logged-in users; periodic check for guests.
     */
    const presenceInterval = setInterval(() => {
      if (currentUser) {
        void sendPresenceHeartbeat();
      } else {
        void fetchPresence();
      }
    }, 15000);

    /*
     * Fast polling fallback: ensures all clients receive new messages even if
     * websocket/realtime reconnects or is temporarily delayed.
     */
    const pollInterval = setInterval(() => {
      if (mounted) {
        void fetchMessages();
      }
    }, 2500);

    /*
     * Window focus / tab visibility sync:
     * When user switches back to the tab, immediately fetch latest messages.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        void fetchMessages();
        void fetchPresence();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    /*
     * Remove messages from UI every 10 seconds after 24 hours.
     */
    expiryTimerRef.current = setInterval(() => {
      removeExpiredFromUI();
    }, 10000);

    /*
     * Supabase Realtime Channel:
     * Supports both instant WebSocket broadcast AND database postgres_changes.
     */
    let channel: any = null;

    if (isSupabaseConfigured()) {
      try {
        channel = supabase.channel('world-chat-live-room', {
          config: {
            broadcast: { self: false },
          },
        });
        channelRef.current = channel;

        channel
          .on(
            'broadcast',
            { event: 'new_message' },
            (payload: any) => {
              if (!mounted || !payload?.payload) return;
              const incoming = payload.payload;
              setMessages((previous) =>
                mergeMessages(previous, [incoming])
              );

              if (shouldAutoScrollRef.current) {
                requestAnimationFrame(() => {
                  scrollToBottom('smooth');
                });
              }
            }
          )
          .on(
            'broadcast',
            { event: 'delete_message' },
            (payload: any) => {
              if (!mounted || !payload?.payload?.id) return;
              const deletedId = String(payload.payload.id);
              setMessages((previous) =>
                previous.filter((m) => m.id !== deletedId)
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
            },
            (payload: any) => {
              if (!mounted || !payload.new) return;

              const incomingMessage = mapRealtimeMessage(
                payload.new
              );

              setMessages((previous) => {
                const merged = mergeMessages(
                  previous,
                  [incomingMessage]
                );

                return merged;
              });

              if (shouldAutoScrollRef.current) {
                requestAnimationFrame(() => {
                  scrollToBottom('smooth');
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'chat_messages',
            },
            (payload: any) => {
              if (!mounted || !payload.old) return;

              const deletedId = String(
                payload.old.id || ''
              );

              if (!deletedId) return;

              setMessages((previous) =>
                previous.filter(
                  (message) => message.id !== deletedId
                )
              );
            }
          )
          .subscribe((status: string) => {
            console.log(
              'World Chat realtime status:',
              status
            );
          });
      } catch (error) {
        console.warn(
          'World Chat realtime setup error:',
          error
        );
      }
    }

    return () => {
      mounted = false;

      clearInterval(presenceInterval);
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);

      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }

      if (channel) {
        channelRef.current = null;
        void supabase.removeChannel(channel);
      }

      if (currentUser) {
        void fetch('/api/presence', {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUser.id,
          },
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [
    currentUser,
    fetchMessages,
    fetchPresence,
    sendPresenceHeartbeat,
    removeExpiredFromUI,
    scrollToBottom,
  ]);

  /*
   * ------------------------------------------------------------
   * AUTO SCROLL AFTER MESSAGE LIST CHANGES
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (messages.length === 0) return;

    if (initialLoadRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });

      initialLoadRef.current = false;
      shouldAutoScrollRef.current = true;
      return;
    }

    if (shouldAutoScrollRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [messages, scrollToBottom]);

  /*
   * ------------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------------
   */

  const handleSendMessage = async (
    textToSend: string,
    stickerText?: string
  ) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const trimmed = textToSend.trim();

    if (!trimmed && !stickerText) {
      return;
    }

    setAuthError(null);
    setIsSending(true);
    SoundEffects.playBell();

    try {
      const accessToken = await getAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Resilient fallback headers in case session token is renewing
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
      }
      if (currentUser?.name) {
        headers['x-user-name'] = encodeURIComponent(currentUser.name);
      }
      if (currentUser?.email) {
        headers['x-user-email'] = encodeURIComponent(currentUser.email);
      }
      if (currentUser?.avatar) {
        headers['x-user-avatar'] = encodeURIComponent(currentUser.avatar);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: trimmed,
          sticker: stickerText || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthError(
          'Authentication required. Please login again.'
        );
        setIsSending(false);
        onOpenAuth();
        return;
      }

      if (res.status === 403) {
        setAuthError(
          data?.error ||
            'Your World Chat access has been blocked.'
        );
        setIsSending(false);
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || 'Failed to send message.'
        );
      }

      /*
       * Server is the source of truth.
       * Realtime will also deliver the message, but this prevents
       * waiting for the realtime event.
       */
      if (data.message) {
        setMessages((previous) =>
          mergeMessages(previous, [data.message])
        );

        // Instant Realtime Broadcast to everyone in the room
        try {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: data.message,
          });
        } catch (bcastErr) {
          console.warn('Realtime broadcast warning:', bcastErr);
        }
      }

      if (data.aiMessage) {
        setMessages((previous) =>
          mergeMessages(previous, [data.aiMessage])
        );

        try {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: data.aiMessage,
          });
        } catch {}

        SoundEffects.playWhistle();
      }

      setInputMessage('');
      setShowStickers(false);
      setAuthError(null);

      shouldAutoScrollRef.current = true;

      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } catch (error: any) {
      console.warn(
        'World Chat send error:',
        error
      );

      setAuthError(
        error?.message ||
          'Message send failed. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * ONLINE COUNT
   * ------------------------------------------------------------
   */

  const onlineCountText = `${onlineCount} ${
    onlineCount === 1 ? 'user online' : 'users online'
  }`;

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col p-3 sm:p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Dhoti aale World Chat
            </h1>

            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              title="Real active users"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/25" />

              <span className="text-xs font-bold tracking-wide">
                {onlineCountText}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>
              Public community choupal • banter, battle challenges
              & live discussion
            </span>

            <span className="text-slate-600">•</span>

            <span className="text-amber-400/80 font-medium">
              Featuring official DHOTI AALE AI
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 rounded-2xl px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />

              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-white block leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>

                  {(currentUser.isVerified ||
                    currentUser.email ===
                      'rohitdhakaddhoti143@gmail.com') && (
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

      {/* AUTH ERROR */}
      {authError && (
        <div className="my-2 rounded-xl bg-red-500/20 border border-red-500/40 p-2.5 text-xs text-red-300 flex items-center justify-between gap-3">
          <span>{authError}</span>

          <button
            onClick={onOpenAuth}
            className="underline font-bold text-white shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* MAIN */}
      <div className="mt-4 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 lg:min-h-[520px]">
        {/* CHAT */}
        <div className="lg:col-span-3 min-h-0 flex flex-col rounded-3xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl relative">
          {/* IMPORTANT: FIXED/FLEXIBLE SCROLL AREA */}
          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 overscroll-contain scroll-smooth"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {isLoadingMessages &&
              messages.length === 0 && (
                <div className="flex items-center justify-center py-12 text-xs text-slate-400 gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />

                  <span>
                    Connecting to Dhoti aale World Chat...
                  </span>
                </div>
              )}

            {!isLoadingMessages &&
              messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <Bot className="h-7 w-7 text-amber-400" />
                  </div>

                  <p className="text-sm font-bold text-slate-300">
                    चौपाल में अभी कोई संदेश नहीं है (World Chat is empty)
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    संदेश 24 घंटे तक लाइव रहते हैं। बातचीत शुरू करने के लिए संदेश भेजें!
                  </p>
                </div>
              )}

            {messages.map((msg) => {
              const isMe = Boolean(
                currentUser &&
                  msg.userId === currentUser.id
              );

              const isAiParticipant = Boolean(
                msg.isAi ||
                  msg.userId ===
                    'dhoti_aale_ai_official' ||
                  msg.userName === 'DHOTI AALE AI'
              );

              const showVerifiedTick = Boolean(
                isAiParticipant ||
                  msg.isVerified ||
                  (isMe && currentUser?.isVerified) ||
                  msg.userBadge?.includes('Site Owner')
              );

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        msg.userAvatar ||
                        'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti'
                      }
                      alt={msg.userName}
                      width={36}
                      height={36}
                      referrerPolicy="no-referrer"
                      className={`h-9 w-9 rounded-full bg-slate-800 object-cover ring-2 ${
                        isAiParticipant
                          ? 'ring-amber-500/70'
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

                  {/* MESSAGE */}
                  <div
                    className={`flex flex-col max-w-[82%] ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>{msg.userName}</span>

                        {showVerifiedTick && (
                          <VerifiedTick size={14} />
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
                        {new Date(
                          msg.timestamp
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-tr-none'
                          : isAiParticipant
                          ? 'bg-amber-500/10 border border-amber-500/35 text-amber-100 rounded-tl-none'
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

                    {!isMe &&
                      !isAiParticipant &&
                      currentUser && (
                        <button
                          onClick={() =>
                            onStartBattleInvite(
                              msg.userName
                            )
                          }
                          className="mt-1 flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300"
                        >
                          <Swords className="h-3 w-3" />

                          <span>
                            Challenge to Battle
                          </span>
                        </button>
                      )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-amber-400 italic bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl w-fit">
                <Bot className="h-3.5 w-3.5 animate-pulse" />

                <span>
                  DHOTI AALE AI is typing...
                </span>
              </div>
            )}
          </div>

          {/* INPUT */}
          {currentUser ? (
            <div className="shrink-0 p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
              {showStickers && (
                <div className="mb-3 flex flex-wrap gap-1.5 p-2.5 bg-slate-800/90 rounded-2xl border border-slate-700">
                  {quickStickers.map((sticker) => (
                    <button
                      key={sticker}
                      onClick={() =>
                        void handleSendMessage(
                          '',
                          sticker
                        )
                      }
                      disabled={isSending}
                      className="rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors disabled:opacity-50"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowStickers(!showStickers)
                  }
                  className={`rounded-2xl p-2.5 sm:p-3 border ${
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
                    maxLength={1000}
                    placeholder="Type message in World Chat..."
                    value={inputMessage}
                    disabled={isSending}
                    onChange={(e) =>
                      setInputMessage(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !isSending
                      ) {
                        e.preventDefault();

                        void handleSendMessage(
                          inputMessage
                        );
                      }
                    }}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 disabled:opacity-60"
                  />
                </div>

                <button
                  id="world-chat-send-btn"
                  onClick={() =>
                    void handleSendMessage(
                      inputMessage
                    )
                  }
                  disabled={
                    isSending ||
                    !inputMessage.trim()
                  }
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 p-3 text-slate-950 font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="shrink-0 p-4 sm:p-5 bg-slate-900/98 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Lock className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    चौपाल में संदेश भेजने के लिए लॉगिन करें
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    सभी संदेश 24 घंटे तक सभी को दिखाई देते हैं। बातचीत में हिस्सा लेने के लिए लॉगिन करें।
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 px-5 py-2.5 text-xs sm:text-sm font-black shadow-xl transition-transform active:scale-95 shrink-0"
              >
                <LogIn className="h-4 w-4" />

                <span>लॉगिन करें / Login to Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:flex min-h-0 flex-col rounded-3xl bg-slate-950/80 border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />

              <h3 className="text-sm font-bold text-white">
                Active in Room
              </h3>
            </div>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {onlineCountText}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2.5">
            {/* OFFICIAL AI */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-aale-official-ai"
                    alt="DHOTI AALE AI"
                    width={32}
                    height={32}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full bg-slate-800 ring-2 ring-amber-500/40 object-cover"
                  />

                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>

                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1 truncate">
                    <span>DHOTI AALE AI</span>

                    <VerifiedTick size={13} />
                  </div>

                  <div className="text-[10px] text-amber-400/80 font-semibold">
                    Official AI ⚡
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <VerifiedTick size={10} />
                AI
              </span>
            </div>

            {/* REAL USERS */}
            {onlineUsers.length > 0 ? (
              onlineUsers.map((u) => {
                const isMe =
                  Boolean(currentUser) &&
                  u.userId === currentUser?.id;

                return (
                  <div
                    key={u.userId}
                    className={`flex items-center justify-between p-2 rounded-2xl ${
                      isMe
                        ? 'bg-amber-500/15 border border-amber-500/30'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <img
                          src={
                            u.userAvatar ||
                            'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti'
                          }
                          alt={u.userName}
                          width={32}
                          height={32}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-full bg-slate-800 object-cover"
                        />

                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                      </div>

                      <div className="min-w-0 text-left">
                        <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1">
                          <span>
                            {u.userName}{' '}
                            {isMe ? '(You)' : ''}
                          </span>

                          {u.isVerified && (
                            <VerifiedTick size={12} />
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 truncate">
                          {u.userBadge || 'Resident'}
                        </div>
                      </div>
                    </div>

                    {!isMe && currentUser && (
                      <button
                        onClick={() =>
                          onStartBattleInvite(
                            u.userName
                          )
                        }
                        className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-slate-800 rounded-xl"
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
                {currentUser
                  ? 'You are currently the only member in the room.'
                  : 'No active users right now.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />

              <span>
                Talk to DHOTI AALE AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}