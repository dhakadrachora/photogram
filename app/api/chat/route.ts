import { NextRequest, NextResponse } from 'next/server';
import { isSiteAdmin } from '@/lib/admin-auth';
import { contentStore } from '@/lib/content-store';
import {
  fetchSupabaseChatMessages,
  insertSupabaseChatMessage,
  deleteSupabaseChatMessage,
  cleanupExpiredSupabaseChatMessages,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';
import { ChatMessage } from '@/types';
import { processDhotiAiWorldChatMessage } from '@/lib/dhoti-ai-chat';

export const dynamic = 'force-dynamic';

const MESSAGE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

export async function GET() {
  const cutoffTime = Date.now() - MESSAGE_EXPIRATION_MS;

  // Clean memory store of expired messages
  contentStore.chatMessages = contentStore.chatMessages.filter(
    (m) => m.timestamp >= cutoffTime
  );

  let messages = contentStore.chatMessages;

  if (isSupabaseConfigured()) {
    // Asynchronously cleanup expired messages in Supabase database
    cleanupExpiredSupabaseChatMessages().catch(() => {});

    const sbMessages = await fetchSupabaseChatMessages();
    if (sbMessages && sbMessages.length > 0) {
      // Ensure verified flags are preserved and filter by 24h
      messages = sbMessages
        .filter((m) => m.timestamp >= cutoffTime)
        .map((m) => ({
          ...m,
          isVerified:
            m.isVerified ||
            m.userId === 'dhoti_aale_ai_official' ||
            m.userName === 'DHOTI AALE AI' ||
            contentStore.verifiedUsers.has(m.userId) ||
            (m.userBadge?.includes('Site Owner') ?? false),
        }));
      contentStore.chatMessages = messages;
    }
  }

  return NextResponse.json({
    channel: 'Dhoti aale World Chat',
    status: 'online',
    requiresAuth: true,
    messages,
    rules: [
      'Google authentication required to post',
      'Desi swag & respectful banter',
      'No abuse, spam or offensive content',
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { user, text, sticker, id: providedId } = body;

    const userEmail = (req.headers.get('x-user-email') || user?.email || '').toLowerCase().trim();
    const userId = (req.headers.get('x-user-id') || user?.id || '').toString().trim();

    // Strict Server-Side Authentication Enforcement
    if (!userEmail || !userEmail.includes('@') || !userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Only authenticated Google users can enter and send World Chat messages.',
          code: 'LOGIN_REQUIRED',
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    if (!text && !sticker) {
      return NextResponse.json(
        { error: 'Message text or sticker is required' },
        { status: 400 }
      );
    }

    // Role check & verification status
    const isOwner = isSiteAdmin(userEmail);
    const isVerified =
      isOwner ||
      contentStore.verifiedUsers.has(userId) ||
      contentStore.verifiedUsers.has(userEmail);

    // Strict Anti-Impersonation Protection: Users cannot disguise as DHOTI AALE AI
    let sanitizedName = (user?.name || (isOwner ? 'Site Admin 👑' : 'Dhoti Resident')).toString().trim();
    if (
      sanitizedName.toLowerCase() === 'dhoti aale ai' ||
      sanitizedName.toLowerCase() === 'dhoti ai' ||
      userId === 'dhoti_aale_ai_official'
    ) {
      sanitizedName = isOwner ? 'Site Admin 👑' : 'Dhoti Resident';
    }

    const newMsg: ChatMessage = {
      id: providedId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userId,
      userName: sanitizedName,
      userAvatar: user?.avatar || (isOwner ? 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-admin' : `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`),
      userBadge: isOwner ? 'Site Owner & Admin 👑' : (user?.badge || 'Dhoti Resident'),
      text: (text || '').toString().trim(),
      timestamp: Date.now(),
      sticker: sticker ? sticker.toString().trim() : undefined,
      isAi: false, // User messages are never AI
      isVerified,
    };

    // Store in memory
    contentStore.chatMessages.push(newMsg);
    if (contentStore.chatMessages.length > 100) {
      contentStore.chatMessages = contentStore.chatMessages.slice(-100);
    }

    // Persist to Supabase Database
    if (isSupabaseConfigured()) {
      await insertSupabaseChatMessage(newMsg);
    }

    // Process DHOTI AALE AI participation (Controlled AI participant)
    let aiResponse: ChatMessage | null = null;
    try {
      aiResponse = await processDhotiAiWorldChatMessage(newMsg);
    } catch (aiErr) {
      console.warn('AI World Chat processing notice:', aiErr);
    }

    return NextResponse.json({
      success: true,
      deliveredAt: newMsg.timestamp,
      message: newMsg,
      aiMessage: aiResponse,
      sender: {
        id: userId,
        email: userEmail,
        isVerified,
        role: isOwner ? 'admin' : 'resident',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: Users can delete their own messages, Admin can moderate any message
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id');

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  const userEmail = (req.headers.get('x-user-email') || '').toLowerCase().trim();
  const userId = (req.headers.get('x-user-id') || '').toString().trim();
  const isAdmin = isSiteAdmin(userEmail);

  if (!userId && !isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }

  // Find message author
  let messageOwnerId: string | null = null;
  const storeMsg = contentStore.chatMessages.find((m) => m.id === messageId);
  if (storeMsg) {
    messageOwnerId = storeMsg.userId;
  } else if (isSupabaseConfigured()) {
    try {
      const { data: dbMsg } = await supabase
        .from('chat_messages')
        .select('user_id')
        .eq('id', messageId)
        .maybeSingle();
      if (dbMsg) {
        messageOwnerId = dbMsg.user_id;
      }
    } catch {
      // ignore
    }
  }

  const isOwner = Boolean(userId && messageOwnerId && userId === messageOwnerId);

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: You can delete only your own messages.' },
      { status: 403 }
    );
  }

  // Remove from memory store
  const prevCount = contentStore.chatMessages.length;
  contentStore.chatMessages = contentStore.chatMessages.filter((m) => m.id !== messageId);
  const deleted = contentStore.chatMessages.length < prevCount;

  // Remove from Supabase
  if (isSupabaseConfigured()) {
    try {
      await deleteSupabaseChatMessage(messageId);
    } catch (e) {
      console.warn('Could not delete message from Supabase:', e);
    }
  }

  return NextResponse.json({
    success: true,
    deletedId: messageId,
    remainingCount: contentStore.chatMessages.length,
  });
}
