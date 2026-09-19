import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequestAsync } from '@/lib/admin-auth';
import { contentStore } from '@/lib/content-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only the site admin (rohitdhakaddhoti143@gmail.com) can manage verified badges.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, userEmail, isVerified } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Valid userId is required.' }, { status: 400 });
    }

    const trimmedId = userId.trim();
    const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : null;
    const verifiedStatus = Boolean(isVerified);

    // Update In-Memory Content Store
    if (verifiedStatus) {
      contentStore.verifiedUsers.add(trimmedId);
      if (cleanEmail) contentStore.verifiedUsers.add(cleanEmail);
    } else {
      contentStore.verifiedUsers.delete(trimmedId);
      if (cleanEmail) contentStore.verifiedUsers.delete(cleanEmail);
    }

    // Update active presence if currently connected
    const active = contentStore.activePresence.get(trimmedId);
    if (active) {
      active.isVerified = verifiedStatus;
      contentStore.activePresence.set(trimmedId, active);
    }

    // Update in-memory chat messages from this user so the badge reflects
    contentStore.chatMessages.forEach((m) => {
      if (m.userId === trimmedId) {
        m.isVerified = verifiedStatus;
      }
    });

    // Update Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('users')
          .update({
            is_verified: verifiedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', trimmedId);
      } catch (err) {
        console.warn('Could not update is_verified on Supabase users table:', err);
      }
    }

    return NextResponse.json({
      success: true,
      userId: trimmedId,
      userEmail: cleanEmail,
      isVerified: verifiedStatus,
      message: verifiedStatus
        ? 'User successfully granted Blue Verified Tick.'
        : 'User Blue Verified Tick revoked.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update user verification', details: err?.message },
      { status: 500 }
    );
  }
}
