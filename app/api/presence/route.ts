import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';
import { isSiteAdmin } from '@/lib/admin-auth';
import { PresenceUser } from '@/types';

export const dynamic = 'force-dynamic';

const INACTIVITY_TIMEOUT_MS = 35000; // 35 seconds timeout for real active user heartbeat

function getCleanActiveUsers(): PresenceUser[] {
  const now = Date.now();
  const activeList: PresenceUser[] = [];

  for (const [userId, u] of contentStore.activePresence.entries()) {
    // Explicitly exclude AI and guest IDs from human online count
    if (
      userId === 'dhoti_aale_ai_official' ||
      u.userId === 'dhoti_aale_ai_official' ||
      userId.startsWith('guest_')
    ) {
      contentStore.activePresence.delete(userId);
      continue;
    }

    if (now - u.lastActive > INACTIVITY_TIMEOUT_MS) {
      contentStore.activePresence.delete(userId);
    } else {
      activeList.push(u);
    }
  }

  // Sort: Admin first, then recently active
  return activeList.sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return b.lastActive - a.lastActive;
  });
}

export async function GET() {
  const users = getCleanActiveUsers();
  return NextResponse.json(
    {
      success: true,
      count: users.length,
      users,
      timeoutMs: INACTIVITY_TIMEOUT_MS,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, userName, userAvatar, userBadge } = body;

    const emailHeader = req.headers.get('x-user-email') || body.userEmail || '';
    const cleanEmail = emailHeader.toLowerCase().trim();

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: 'Valid userId is required for presence.' }, { status: 400 });
    }

    const trimmedId = userId.trim();
    if (
      trimmedId === 'dhoti_aale_ai_official' ||
      trimmedId.startsWith('guest_') ||
      !cleanEmail ||
      !cleanEmail.includes('@')
    ) {
      const users = getCleanActiveUsers();
      return NextResponse.json({ success: true, count: users.length, users });
    }

    const isAdmin = isSiteAdmin(cleanEmail);

    // Verify verified status server-side (users cannot fake this)
    const isVerified =
      contentStore.verifiedUsers.has(trimmedId) ||
      contentStore.verifiedUsers.has(cleanEmail) ||
      isAdmin;

    const presenceRecord: PresenceUser = {
      userId: trimmedId,
      userName: (userName || (isAdmin ? 'Rohit Dhakad (Admin)' : 'Dhoti Resident')).toString().trim(),
      userAvatar: (userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${trimmedId}`).toString(),
      userBadge: isAdmin ? 'Site Owner & Admin 👑' : (userBadge || 'Resident').toString(),
      isVerified,
      isAdmin,
      lastActive: Date.now(),
    };

    // Store in Map to deduplicate by userId automatically
    contentStore.activePresence.set(trimmedId, presenceRecord);

    const users = getCleanActiveUsers();

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        users,
        current: presenceRecord,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process presence heartbeat', details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;
    if (userId) {
      contentStore.activePresence.delete(userId.toString().trim());
    }
    const users = getCleanActiveUsers();
    return NextResponse.json({ success: true, count: users.length, users });
  } catch {
    return NextResponse.json({ success: true, count: contentStore.activePresence.size });
  }
}
