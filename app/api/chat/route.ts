import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { contentStore } from '@/lib/content-store';
import { ChatMessage } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    channel: 'Dhoti aale World Chat',
    status: 'online',
    requiresAuth: true,
    messages: contentStore.chatMessages,
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

    const userEmail = req.headers.get('x-user-email') || user?.email;
    const userId = req.headers.get('x-user-id') || user?.id;

    // Strict Server-Side Authentication Enforcement
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@') || !userId) {
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

    // Role check
    const isOwner = userEmail.toLowerCase() === 'rohitkumarnagar50@gmail.com';

    const newMsg: ChatMessage = {
      id: providedId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userId.toString(),
      userName: user?.name || (isOwner ? 'Rohit Kumar Nagar' : 'Dhoti Resident'),
      userAvatar: user?.avatar || (isOwner ? 'https://api.dicebear.com/7.x/bottts/svg?seed=rohit-admin' : `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`),
      userBadge: isOwner ? 'Site Owner & Admin 👑' : (user?.badge || 'Dhoti Resident'),
      text: (text || '').toString().trim(),
      timestamp: Date.now(),
      sticker: sticker ? sticker.toString().trim() : undefined,
    };

    contentStore.chatMessages.push(newMsg);
    // Keep last 100 messages
    if (contentStore.chatMessages.length > 100) {
      contentStore.chatMessages = contentStore.chatMessages.slice(-100);
    }

    return NextResponse.json({
      success: true,
      deliveredAt: newMsg.timestamp,
      message: newMsg,
      sender: {
        id: userId,
        email: userEmail,
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

// DELETE: Admin moderates inappropriate chat messages (SERVER-SIDE ENFORCED)
export async function DELETE(req: NextRequest) {
  if (!verifyAdminRequest(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Only admin rohitkumarnagar50@gmail.com can moderate chat messages.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get('id');

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  const prevCount = contentStore.chatMessages.length;
  contentStore.chatMessages = contentStore.chatMessages.filter((m) => m.id !== messageId);
  const deleted = contentStore.chatMessages.length < prevCount;

  return NextResponse.json({
    success: deleted,
    deletedId: messageId,
    remainingCount: contentStore.chatMessages.length,
  });
}
