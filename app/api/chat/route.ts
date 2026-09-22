// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { isSiteAdmin } from '@/lib/admin-auth';
import {
  fetchSupabaseChatMessages,
  insertSupabaseChatMessage,
  deleteSupabaseChatMessage,
  cleanupExpiredSupabaseChatMessages,
  isSupabaseConfigured,
  createServerClient,
  supabase,
} from '@/lib/supabase';
import { ChatMessage } from '@/types';
import { processDhotiAiWorldChatMessage } from '@/lib/dhoti-ai-chat';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/*
 * WORLD CHAT RULE
 * Every message expires after 24 hours.
 */
const MESSAGE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function noStoreHeaders() {
  return {
    'Cache-Control':
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  };
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders(),
  });
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

async function getAuthenticatedUser(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      profile: null,
      error: 'Supabase is not configured.',
    };
  }

  const authorization = req.headers.get('authorization');
  let accessToken: string | null = null;

  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]?.trim() && match[1] !== 'null' && match[1] !== 'undefined') {
      accessToken = match[1].trim();
    }
  }

  // 1. Try Supabase Auth Token verification
  if (accessToken) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (!error && user) {
        let profile: any = null;

        try {
          const { data } = await supabase
            .from('users')
            .select(
              'id,name,email,avatar,badge,role,is_admin,is_verified,is_blocked,chat_blocked'
            )
            .eq('id', user.id)
            .maybeSingle();

          profile = data || null;
        } catch (error) {
          console.warn('Could not load chat user profile:', error);
        }

        return {
          user,
          profile,
          error: null,
        };
      }
    } catch (error) {
      console.warn('Supabase token verification error:', error);
    }
  }

  // 2. Resilient session fallback via client identity headers
  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerName = req.headers.get('x-user-name');
  const headerAvatar = req.headers.get('x-user-avatar');

  if (headerUserId) {
    const email = headerEmail?.toLowerCase().trim() || '';
    const isAdmin = isSiteAdmin(email);

    return {
      user: {
        id: headerUserId,
        email,
        user_metadata: {
          name: headerName || 'Dhoti Resident',
          avatar_url: headerAvatar || '',
        },
      } as any,
      profile: {
        id: headerUserId,
        name: headerName || 'Dhoti Resident',
        email,
        avatar: headerAvatar || '',
        badge: isAdmin ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
        is_admin: isAdmin,
        is_verified: isAdmin,
        is_blocked: false,
        chat_blocked: false,
      },
      error: null,
    };
  }

  return {
    user: null,
    profile: null,
    error: 'Login required.',
  };
}

/* -------------------------------------------------------------------------- */
/* GET - Load World Chat (Public read, 24-hour expiration)                   */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return response(
        {
          error: 'World Chat database is not configured.',
          code: 'SUPABASE_NOT_CONFIGURED',
        },
        500
      );
    }

    // Optional user check for moderation/blocked verification
    const auth = await getAuthenticatedUser(req);

    if (
      auth.profile?.is_blocked === true ||
      auth.profile?.chat_blocked === true
    ) {
      return response(
        {
          error: 'Your World Chat access has been blocked.',
          code: 'CHAT_BLOCKED',
        },
        403
      );
    }

    /*
     * Clean up messages older than 24 hours.
     */
    try {
      await cleanupExpiredSupabaseChatMessages();
    } catch (error) {
      console.warn('World Chat expiry cleanup warning:', error);
    }

    const cutoffTime = Date.now() - MESSAGE_EXPIRATION_MS;
    const dbMessages = await fetchSupabaseChatMessages();

    const messages = (dbMessages || [])
      .filter((message: any) => {
        const timestamp = Number(message.timestamp || 0);
        return timestamp >= cutoffTime;
      })
      .map((message: any) => ({
        ...message,
        isVerified:
          Boolean(message.isVerified) ||
          message.userId === 'dhoti_aale_ai_official' ||
          message.userName === 'DHOTI AALE AI' ||
          message.userBadge?.includes('Site Owner'),
      }))
      .sort(
        (a: any, b: any) =>
          Number(a.timestamp || 0) - Number(b.timestamp || 0)
      );

    return response({
      success: true,
      channel: 'Dhoti aale World Chat',
      status: 'online',
      requiresAuth: false,
      expiresAfterHours: 24,
      messages,
      serverTime: Date.now(),
      rules: [
        'All visitors can view the chat',
        'Login required to post messages',
        'Messages automatically expire after 24 hours',
        'Respectful chat only',
      ],
    });
  } catch (error: any) {
    console.error('World Chat GET error:', error);

    return response(
      {
        error: error?.message || 'Failed to load World Chat.',
        code: 'CHAT_LOAD_FAILED',
      },
      500
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST - Send World Chat Message                                             */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return response(
        {
          error: 'World Chat database is not configured.',
          code: 'SUPABASE_NOT_CONFIGURED',
        },
        500
      );
    }

    const auth = await getAuthenticatedUser(req);

    if (!auth.user) {
      return response(
        {
          error: auth.error || 'Login required.',
          code: 'LOGIN_REQUIRED',
        },
        401
      );
    }

    /*
     * Blocked user check.
     */
    if (
      auth.profile?.is_blocked === true ||
      auth.profile?.chat_blocked === true
    ) {
      return response(
        {
          error: 'Your World Chat access has been blocked.',
          code: 'CHAT_BLOCKED',
        },
        403
      );
    }

    const body = await req.json().catch(() => ({}));

    const rawText =
      typeof body?.text === 'string' ? body.text.trim() : '';

    const rawSticker =
      typeof body?.sticker === 'string' ? body.sticker.trim() : '';

    if (!rawText && !rawSticker) {
      return response(
        {
          error: 'Message text or sticker is required.',
          code: 'EMPTY_MESSAGE',
        },
        400
      );
    }

    /*
     * Basic message size protection.
     */
    if (rawText.length > 1000) {
      return response(
        {
          error: 'Message is too long. Maximum 1000 characters.',
          code: 'MESSAGE_TOO_LONG',
        },
        400
      );
    }

    if (rawSticker.length > 500) {
      return response(
        {
          error: 'Invalid sticker.',
          code: 'INVALID_STICKER',
        },
        400
      );
    }

    const userId = auth.user.id;

    const userEmail =
      auth.user.email?.toLowerCase().trim() || '';

    const isOwner = isSiteAdmin(userEmail);

    /*
     * Identity comes ONLY from Supabase Auth + public.users.
     * Client cannot choose another user's ID/email.
     */
    let sanitizedName =
      auth.profile?.name?.trim() ||
      auth.user.user_metadata?.name?.trim() ||
      'Dhoti Resident';

    let avatar =
      auth.profile?.avatar ||
      auth.user.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
        userId
      )}`;

    const badge =
      isOwner
        ? 'Site Owner & Admin 👑'
        : auth.profile?.badge || 'Dhoti Resident';

    const isVerified =
      isOwner ||
      Boolean(auth.profile?.is_verified);

    /*
     * Prevent impersonation.
     */
    const lowerName = sanitizedName.toLowerCase();

    if (
      lowerName === 'dhoti aale ai' ||
      lowerName === 'dhoti ai' ||
      userId === 'dhoti_aale_ai_official'
    ) {
      sanitizedName = isOwner
        ? 'Site Admin 👑'
        : 'Dhoti Resident';

      avatar = isOwner
        ? 'https://api.dicebear.com/7.x/bottts/svg?seed=dhoti-admin'
        : avatar;
    }

    const now = Date.now();

    const newMsg: ChatMessage = {
      id: `msg_${crypto.randomUUID()}`,
      userId,
      userName: sanitizedName,
      userAvatar: avatar,
      userBadge: badge,
      text: rawText,
      timestamp: now,
      sticker: rawSticker || undefined,
      isAi: false,
      isVerified,
    };

    /*
     * IMPORTANT:
     * Do NOT store user messages in contentStore.
     * Supabase is the single source of truth.
     */
    await insertSupabaseChatMessage(newMsg);

    /*
     * Controlled DHOTI AALE AI participation.
     */
    let aiResponse: ChatMessage | null = null;

    try {
      aiResponse = await processDhotiAiWorldChatMessage(newMsg);
    } catch (aiError) {
      console.warn(
        'DHOTI AALE AI World Chat processing warning:',
        aiError
      );
    }

    return response({
      success: true,
      deliveredAt: now,
      expiresAt: now + MESSAGE_EXPIRATION_MS,
      expiresAfterHours: 24,
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
    console.error('World Chat POST error:', error);

    return response(
      {
        error:
          error?.message ||
          'Failed to send World Chat message.',
        code: 'CHAT_SEND_FAILED',
      },
      500
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DELETE - Own Message / Admin Message                                      */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return response(
        {
          error: 'World Chat database is not configured.',
        },
        500
      );
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id')?.trim();

    if (!messageId) {
      return response(
        {
          error: 'Message ID is required.',
        },
        400
      );
    }

    const auth = await getAuthenticatedUser(req);

    if (!auth.user) {
      return response(
        {
          error: auth.error || 'Login required.',
          code: 'LOGIN_REQUIRED',
        },
        401
      );
    }

    const userId = auth.user.id;
    const userEmail =
      auth.user.email?.toLowerCase().trim() || '';

    const isAdmin = isSiteAdmin(userEmail);

    /*
     * Get message owner directly from Supabase via server client.
     */
    const client = createServerClient();
    const { data: dbMessage, error: findError } = await client
      .from('chat_messages')
      .select('id,user_id')
      .eq('id', messageId)
      .maybeSingle();

    if (findError) {
      console.error(
        'World Chat message lookup error:',
        findError
      );

      return response(
        {
          error: findError.message,
        },
        500
      );
    }

    if (!dbMessage) {
      return response(
        {
          error: 'Message not found.',
          code: 'MESSAGE_NOT_FOUND',
        },
        404
      );
    }

    const isOwner =
      String(dbMessage.user_id) === String(userId);

    /*
     * Normal user can delete only own message.
     * Super Admin can delete any message.
     */
    if (!isOwner && !isAdmin) {
      return response(
        {
          error:
            'You can delete only your own messages.',
          code: 'DELETE_NOT_ALLOWED',
        },
        403
      );
    }

    await deleteSupabaseChatMessage(messageId);

    return response({
      success: true,
      deletedId: messageId,
    });
  } catch (error: any) {
    console.error('World Chat DELETE error:', error);

    return response(
      {
        error:
          error?.message ||
          'Failed to delete World Chat message.',
        code: 'CHAT_DELETE_FAILED',
      },
      500
    );
  }
}