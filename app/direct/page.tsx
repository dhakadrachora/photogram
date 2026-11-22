'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Conversation, Message } from '@/lib/types';
import {
  Send,
  Image as ImageIcon,
  Heart,
  Smile,
  Phone,
  Video,
  Info,
  ChevronDown,
  SquarePen,
  Search,
  ArrowLeft,
  Mic,
  X,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';

const SUGGESTED_CREATORS = [
  {
    id: 'usr_kabir',
    username: 'kabir.explores',
    full_name: 'Kabir Mehta',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    is_verified: true,
  },
  {
    id: 'usr_ananya',
    username: 'ananya.lens',
    full_name: 'Ananya Roy',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    is_verified: true,
  },
  {
    id: 'usr_zoya',
    username: 'zoya.spaces',
    full_name: 'Zoya Khan',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    is_verified: true,
  },
  {
    id: 'usr_rohan',
    username: 'rohan.raw',
    full_name: 'Rohan Sen',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    is_verified: true,
  },
  {
    id: 'usr_vikram',
    username: 'vikram.aerials',
    full_name: 'Vikram Aditya',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    is_verified: true,
  },
];

export default function DirectPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messagesHistory, setMessagesHistory] = useState<Record<string, Message[]>>({});
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [userNote, setUserNote] = useState<string>('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real conversations and messages history for the current user
  useEffect(() => {
    if (!user) return;
    try {
      const userKey = user.id || user.username;
      const savedConvs = localStorage.getItem(`photogram_conversations_${userKey}`);
      const savedMsgs = localStorage.getItem(`photogram_messages_${userKey}`);

      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveConvId(parsed[0].id);
        } else {
          setConversations([]);
          setActiveConvId(null);
        }
      } else {
        setConversations([]);
        setActiveConvId(null);
      }

      if (savedMsgs) {
        setMessagesHistory(JSON.parse(savedMsgs));
      } else {
        setMessagesHistory({});
      }

      const savedNote = localStorage.getItem(`photogram_note_${userKey}`);
      if (savedNote) {
        setUserNote(savedNote);
      } else {
        setUserNote('');
      }
    } catch (e) {
      setConversations([]);
      setActiveConvId(null);
      setMessagesHistory({});
    }
  }, [user]);

  // Persist conversations
  const persistConversations = (newConvs: Conversation[]) => {
    setConversations(newConvs);
    if (!user) return;
    try {
      const userKey = user.id || user.username;
      localStorage.setItem(`photogram_conversations_${userKey}`, JSON.stringify(newConvs));
    } catch (e) {}
  };

  // Persist messages history
  const persistMessages = (newHistory: Record<string, Message[]>) => {
    setMessagesHistory(newHistory);
    if (!user) return;
    try {
      const userKey = user.id || user.username;
      localStorage.setItem(`photogram_messages_${userKey}`, JSON.stringify(newHistory));
    } catch (e) {}
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeMessages = useMemo(() => {
    return activeConvId ? messagesHistory[activeConvId] || [] : [];
  }, [activeConvId, messagesHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleStartConversation = (targetUser: typeof SUGGESTED_CREATORS[0]) => {
    const existing = conversations.find((c) => c.user.username === targetUser.username);
    if (existing) {
      setActiveConvId(existing.id);
      setIsNewMessageModalOpen(false);
      return;
    }

    const newConvId = `conv_${Date.now()}`;
    const initialMsg: Message = {
      id: `msg_init_${Date.now()}`,
      sender_id: user?.id || 'usr_me',
      receiver_id: targetUser.id,
      text: '👋',
      created_at: new Date().toISOString(),
      is_read: true,
    };

    const newConversation: Conversation = {
      id: newConvId,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        full_name: targetUser.full_name,
        avatar_url: targetUser.avatar_url,
        is_verified: targetUser.is_verified,
        bio: '',
        posts_count: 10,
        followers_count: 5000,
        following_count: 200,
      },
      last_message: initialMsg,
      unread_count: 0,
    };

    const updatedConvs = [newConversation, ...conversations];
    const updatedHistory = {
      ...messagesHistory,
      [newConvId]: [initialMsg],
    };

    persistConversations(updatedConvs);
    persistMessages(updatedHistory);
    setActiveConvId(newConvId);
    setIsNewMessageModalOpen(false);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || messageText;
    if (!text.trim() || !activeConvId) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      sender_id: user?.id || 'usr_me',
      receiver_id: activeConv?.user.id || '',
      text: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    };

    const nextHistory = {
      ...messagesHistory,
      [activeConvId]: [...(messagesHistory[activeConvId] || []), newMsg],
    };
    persistMessages(nextHistory);

    const nextConvs = conversations.map((c) =>
      c.id === activeConvId
        ? {
            ...c,
            last_message: newMsg,
            unread_count: 0,
          }
        : c
    );
    persistConversations(nextConvs);
    setMessageText('');

    // Realistic auto-reply after 1.5 seconds from the creator
    const creatorName = activeConv?.user.full_name || activeConv?.user.username || 'Friend';
    setTimeout(() => {
      const replyMsg: Message = {
        id: `reply_${Date.now()}`,
        sender_id: activeConv?.user.id || '',
        receiver_id: user?.id || 'usr_me',
        text: `Hey! Thanks for reaching out! Loved seeing your profile. ✨ Keep creating! 📸`,
        created_at: new Date().toISOString(),
        is_read: true,
      };

      setMessagesHistory((prev) => {
        const updated = {
          ...prev,
          [activeConvId]: [...(prev[activeConvId] || []), replyMsg],
        };
        if (user) {
          const userKey = user.id || user.username;
          try {
            localStorage.setItem(`photogram_messages_${userKey}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                last_message: replyMsg,
              }
            : c
        );
        if (user) {
          const userKey = user.id || user.username;
          try {
            localStorage.setItem(`photogram_conversations_${userKey}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    }, 1500);
  };

  const handleSendHeart = () => {
    handleSendMessage('❤️');
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = SUGGESTED_CREATORS.filter(
    (c) =>
      c.username.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.full_name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] my-0 md:my-4 border-0 md:border md:border-neutral-800 rounded-none md:rounded-xl overflow-hidden flex bg-black select-none">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-[350px] shrink-0 border-r border-neutral-800 flex flex-col ${
          activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="font-bold text-sm text-white">
              {user?.username || 'user'}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          <button
            onClick={() => setIsNewMessageModalOpen(true)}
            className="p-1.5 hover:bg-neutral-800 rounded-full text-white cursor-pointer"
            title="New message"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Note bubble with 24h Interactive Note */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div
            onClick={() => {
              setNoteInput(userNote);
              setIsNoteModalOpen(true);
            }}
            className="flex flex-col items-center shrink-0 cursor-pointer group"
          >
            <div className="relative">
              {/* Floating Note Thought Bubble */}
              {userNote ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 text-[10px] px-2 py-0.5 rounded-xl text-white shadow-lg whitespace-nowrap max-w-[85px] truncate z-10 animate-in fade-in">
                  {userNote}
                </div>
              ) : (
                <div className="absolute -top-1 -right-1 bg-neutral-800 border border-neutral-700 text-[10px] px-1.5 py-0.5 rounded-full text-neutral-300">
                  💭
                </div>
              )}

              <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700 bg-neutral-900 group-hover:scale-105 transition-transform">
                <Image
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Your note"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">
              {userNote ? 'Your note' : 'Share a thought'}
            </span>
          </div>

          {conversations.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-center shrink-0 cursor-pointer"
              onClick={() => setActiveConvId(c.id)}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700">
                <Image
                  src={c.user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                  alt={c.user.username}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 truncate max-w-[50px]">
                {c.user.username}
              </span>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Threads List or Clean Empty State */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-neutral-900 flex flex-col">
          <div className="px-4 py-1 text-xs font-semibold text-neutral-400 flex items-center justify-between">
            <span>Messages</span>
            <span
              onClick={() => setIsNewMessageModalOpen(true)}
              className="text-[#0095f6] text-[11px] cursor-pointer hover:underline"
            >
              New message
            </span>
          </div>

          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-800/60' : 'hover:bg-neutral-900'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                    <Image
                      src={conv.user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt={conv.user.username}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">
                        {conv.user.username}
                      </span>
                      <span suppressHydrationWarning className="text-[10px] text-neutral-500">
                        {new Date(conv.last_message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {conv.last_message.text}
                    </p>
                  </div>

                  {conv.unread_count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-[#0095f6] shrink-0" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
              <p className="text-xs font-semibold text-white">No messages yet</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-[200px]">
                Send messages or photos to connect with creators and friends.
              </p>
              <button
                onClick={() => setIsNewMessageModalOpen(true)}
                className="mt-3 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Send message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Chat Column */}
      <div
        className={`flex-1 flex flex-col bg-black ${
          !activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1 text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-700 shrink-0">
                  <Image
                    src={activeConv.user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                    alt={activeConv.user.username}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-white">
                      {activeConv.user.full_name || activeConv.user.username}
                    </span>
                    {activeConv.user.is_verified && (
                      <span className="text-[#0095f6] text-xs">●</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">Active now</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300">
                <button className="p-1.5 hover:bg-neutral-800 rounded-full cursor-pointer">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-1.5 hover:bg-neutral-800 rounded-full cursor-pointer">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-1.5 hover:bg-neutral-800 rounded-full cursor-pointer">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {/* Profile Card at Top of Thread */}
              <div className="flex flex-col items-center py-6 border-b border-neutral-900 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-800 mb-2">
                  <Image
                    src={activeConv.user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'}
                    alt={activeConv.user.username}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <span className="font-bold text-sm text-white">{activeConv.user.full_name}</span>
                <span className="text-xs text-neutral-400">@{activeConv.user.username} • Photogram</span>
              </div>

              {activeMessages.map((msg) => {
                const isMe = msg.sender_id === (user?.id || 'usr_me');
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#0095f6] text-white rounded-br-xs'
                          : 'bg-neutral-800 text-neutral-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span suppressHydrationWarning className="text-[9px] text-neutral-500 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <div className="p-3 border-t border-neutral-800">
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3.5 py-2 focus-within:border-neutral-600 transition-colors">
                <button className="text-neutral-400 hover:text-white cursor-pointer">
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-transparent text-xs text-white outline-none"
                />
                {messageText.trim() ? (
                  <button
                    onClick={() => handleSendMessage()}
                    className="text-xs font-semibold text-[#0095f6] hover:text-sky-400 px-1 cursor-pointer"
                  >
                    Send
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <button className="hover:text-white cursor-pointer">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button className="hover:text-white cursor-pointer">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleSendHeart} className="hover:text-red-500 cursor-pointer">
                      <Heart className="w-5 h-5 fill-none text-white hover:fill-red-500 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Official 1:1 Instagram Direct Empty Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
              <Send className="w-12 h-12 text-white -rotate-12 translate-x-1" />
            </div>
            <h2 className="text-xl font-semibold text-white">Your messages</h2>
            <p className="text-xs text-neutral-400 max-w-xs mt-1.5 leading-relaxed">
              Send private photos and messages to a friend or creator.
            </p>
            <button
              onClick={() => setIsNewMessageModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Send message
            </button>
          </div>
        )}
      </div>

      {/* New Message / Select Contact Modal */}
      {isNewMessageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsNewMessageModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#262626] border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h3 className="font-semibold text-sm">New message</h3>
              <button
                onClick={() => setIsNewMessageModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* To: Search input */}
            <div className="p-3 border-b border-neutral-700 flex items-center gap-2">
              <span className="text-xs font-semibold text-white">To:</span>
              <input
                type="text"
                placeholder="Search..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-500"
                autoFocus
              />
            </div>

            {/* Suggested Contacts List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800 p-2">
              <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Suggested
              </div>
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleStartConversation(contact)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-800">
                      <Image
                        src={contact.avatar_url}
                        alt={contact.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs text-white">
                          {contact.username}
                        </span>
                        {contact.is_verified && (
                          <span className="text-[#0095f6] text-[10px]">●</span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400">{contact.full_name}</p>
                    </div>
                  </div>

                  <button className="text-xs font-semibold text-[#0095f6] hover:text-sky-400">
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Note Editor Modal */}
      {isNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#262626] border border-neutral-700 rounded-2xl p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
              <h3 className="font-semibold text-sm">New Note</h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                  <Image
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt="User"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="Share a thought (up to 60 chars)..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    autoFocus
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#0095f6]"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 px-1">
                    <span>Visible for 24 hours to followers</span>
                    <span>{noteInput.length}/60</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-700">
              {userNote && (
                <button
                  type="button"
                  onClick={() => {
                    setUserNote('');
                    setIsNoteModalOpen(false);
                    if (user) {
                      localStorage.removeItem(`photogram_note_${user.id || user.username}`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 cursor-pointer"
                >
                  Delete note
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setUserNote(noteInput.trim());
                  setIsNoteModalOpen(false);
                  if (user) {
                    localStorage.setItem(`photogram_note_${user.id || user.username}`, noteInput.trim());
                  }
                }}
                disabled={!noteInput.trim()}
                className="flex-1 py-1.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
