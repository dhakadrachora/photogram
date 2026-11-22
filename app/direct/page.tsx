'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';
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
  CheckCheck,
} from 'lucide-react';
import Image from 'next/image';

export default function DirectPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(MOCK_CONVERSATIONS[0].id);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messagesHistory, setMessagesHistory] = useState<Record<string, Message[]>>({
    conv_1: [
      {
        id: 'm1_1',
        sender_id: 'usr_kabir',
        receiver_id: 'usr_aryan',
        text: 'Aryan! Are you planning an expedition to the Zanskar valley this October?',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        is_read: true,
      },
      {
        id: 'm1_2',
        sender_id: 'usr_aryan',
        receiver_id: 'usr_kabir',
        text: 'Yes Kabir! Packing the 70-200 GM II and the drone. The autumn colors there are unmatched.',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        is_read: true,
      },
      {
        id: 'm1_3',
        sender_id: 'usr_kabir',
        receiver_id: 'usr_aryan',
        text: 'Bro, which ND filter did you take to the Alps? The sky contrast in your latest Dolomites shot is unreal 🔥',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        is_read: false,
      },
    ],
    conv_2: [
      {
        id: 'm2_1',
        sender_id: 'usr_ananya',
        receiver_id: 'usr_aryan',
        text: 'Hey Aryan! The editorial gallery reached 50k views on Behance!',
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        is_read: true,
      },
      {
        id: 'm2_2',
        sender_id: 'usr_aryan',
        receiver_id: 'usr_ananya',
        text: 'Sent the high-res RAW exports to your Drive! Let me know if you need any adjustments.',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: true,
      },
    ],
    conv_3: [
      {
        id: 'm3_1',
        sender_id: 'usr_zoya',
        receiver_id: 'usr_aryan',
        text: 'The architectural lines in your Kyoto pavilion series are inspiring. Let’s collaborate on the winter gallery!',
        created_at: new Date(Date.now() - 14400000).toISOString(),
        is_read: true,
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeMessages = useMemo(() => {
    return activeConvId ? messagesHistory[activeConvId] || [] : [];
  }, [activeConvId, messagesHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

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

    setMessagesHistory((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              last_message: newMsg,
              unread_count: 0,
            }
          : c
      )
    );

    setMessageText('');

    // Simulate quick auto-reply after 1.5 seconds
    setTimeout(() => {
      const replyMsg: Message = {
        id: `reply_${Date.now()}`,
        sender_id: activeConv?.user.id || '',
        receiver_id: user?.id || 'usr_me',
        text: 'Sounds awesome! Keep up the great work! ✨🔥',
        created_at: new Date().toISOString(),
        is_read: true,
      };

      setMessagesHistory((prev) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), replyMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                last_message: replyMsg,
              }
            : c
        )
      );
    }, 1500);
  };

  const handleSendHeart = () => {
    handleSendMessage('❤️');
  };

  const filteredConversations = conversations.filter((c) =>
    c.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto h-[calc(100vh-64px)] md:h-[calc(100vh-32px)] my-0 md:my-4 border-0 md:border md:border-neutral-800 rounded-none md:rounded-xl overflow-hidden flex bg-black">
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
              {user?.username || 'aryan.visuals'}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          <button className="p-1.5 hover:bg-neutral-800 rounded-full text-white">
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Note bubbles row */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700">
                <Image
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Your note"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 bg-neutral-800 border border-neutral-700 text-[10px] px-1.5 py-0.5 rounded-full text-neutral-300">
                💭
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 mt-1">Your note</span>
          </div>

          {conversations.map((c) => (
            <div key={c.id} className="flex flex-col items-center shrink-0 cursor-pointer" onClick={() => setActiveConvId(c.id)}>
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

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-neutral-900">
          <div className="px-4 py-1 text-xs font-semibold text-neutral-400 flex items-center justify-between">
            <span>Messages</span>
            <span className="text-[#0095f6] text-[11px] cursor-pointer">Requests</span>
          </div>

          {filteredConversations.map((conv) => {
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
          })}
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
                <button className="p-1.5 hover:bg-neutral-800 rounded-full">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-1.5 hover:bg-neutral-800 rounded-full">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-1.5 hover:bg-neutral-800 rounded-full">
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
                <span className="text-xs text-neutral-400">@{activeConv.user.username} • Instagram</span>
                <button className="mt-3 text-xs font-semibold px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg">
                  View profile
                </button>
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
                <button className="text-neutral-400 hover:text-white">
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
                    className="text-xs font-semibold text-[#0095f6] hover:text-sky-400 px-1"
                  >
                    Send
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <button className="hover:text-white">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button className="hover:text-white">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleSendHeart} className="hover:text-red-500">
                      <Heart className="w-5 h-5 fill-none text-white hover:fill-red-500 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
              <Send className="w-12 h-12 text-white -rotate-12 translate-x-1" />
            </div>
            <h2 className="text-lg font-semibold text-white">Your Messages</h2>
            <p className="text-xs text-neutral-400 max-w-xs mt-1">
              Send private photos and messages to a friend or group.
            </p>
            <button className="mt-4 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold rounded-lg">
              Send message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
