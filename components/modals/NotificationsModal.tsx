'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface NotificationItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  media?: string;
  isFollow?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load live Supabase notifications
    const fetchLiveNotifications = async () => {
      if (!isSupabaseConfigured() || !user.id || user.id === 'usr_me') return;
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            type,
            created_at,
            actor:profiles!notifications_actor_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const liveItems: NotificationItem[] = data.map((n: any) => {
            const actorName = n.actor?.username || 'Someone';
            const actionText =
              n.type === 'like'
                ? 'liked your photo.'
                : n.type === 'comment'
                ? 'commented on your post.'
                : 'started following you.';

            return {
              id: n.id,
              user: actorName,
              avatar: n.actor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              action: actionText,
              time: 'Just now',
              isFollow: n.type === 'follow',
            };
          });
          setNotifications(liveItems);
          return;
        }
      } catch (e) {
        console.warn('Could not fetch live notifications:', e);
      }
    };

    fetchLiveNotifications();

    // Cache fallback
    try {
      const userKey = user.id || user.username;
      const stored = localStorage.getItem(`photogram_notifications_${userKey}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {}

    // Realtime notifications listener
    if (isSupabaseConfigured() && user.id && user.id !== 'usr_me') {
      const channel = supabase
        .channel(`user_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchLiveNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end sm:justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md h-full sm:h-[80vh] bg-[#121212] border-l sm:border border-[#262626] sm:rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
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

        {notifications.length > 0 ? (
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
            <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Recent
            </div>
            {notifications.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                    <Image src={item.avatar} alt={item.user} fill className="object-cover" />
                  </div>
                  <div className="text-xs leading-snug">
                    <span className="font-semibold hover:underline cursor-pointer">
                      {item.user}{' '}
                    </span>
                    <span className="text-neutral-300">
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
              </div>
            ))}
          </div>
        ) : (
          /* Official 1:1 Instagram Empty Notifications Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
            <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
              <Heart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-white">Activity On Your Posts</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
              When someone likes or comments on one of your photos, you&apos;ll see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsModal;
