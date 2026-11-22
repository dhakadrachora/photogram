'use client';

import React from 'react';
import Image from 'next/image';
import { X, Heart } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      user: 'ananya.lens',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      action: 'liked your photo.',
      time: '2m',
      media: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'n2',
      user: 'kabir.explores',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      action: 'commented: "Incredible shot! What lens did you use?"',
      time: '15m',
    },
    {
      id: 'n3',
      user: 'zoya.spaces',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      action: 'started following you.',
      time: '2h',
      isFollow: true,
    },
    {
      id: 'n4',
      user: 'rohan.raw',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      action: 'liked your photo.',
      time: '5h',
      media: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=120&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end sm:justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md h-full sm:h-[80vh] bg-[#121212] dark:bg-[#121212] light:bg-[#ffffff] border-l sm:border border-[#262626] dark:border-[#262626] light:border-[#dbdbdb] sm:rounded-2xl shadow-2xl flex flex-col text-white dark:text-white light:text-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-white/10 light:border-black/10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-semibold text-base">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 dark:divide-white/5 light:divide-black/5 p-2">
          <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            This Week
          </div>
          {notifications.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                  <Image src={item.avatar} alt={item.user} fill className="object-cover" />
                </div>
                <div className="text-xs leading-snug">
                  <span className="font-semibold hover:underline cursor-pointer">
                    {item.user}{' '}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-300 light:text-neutral-700">
                    {item.action}
                  </span>
                  <span className="text-neutral-500 ml-1.5 font-medium">{item.time}</span>
                </div>
              </div>

              {item.media && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                  <Image src={item.media} alt="thumbnail" fill className="object-cover" />
                </div>
              )}

              {item.isFollow && (
                <button className="px-3 py-1.5 rounded-lg bg-[#0095f6] hover:bg-sky-500 text-white font-semibold text-xs shadow transition-all cursor-pointer">
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
