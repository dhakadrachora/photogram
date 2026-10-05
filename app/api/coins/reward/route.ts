import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    let accessToken: string | null = null;

    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (match && match[1]?.trim() && match[1] !== 'null') {
        accessToken = match[1].trim();
      }
    }

    const body = await req.json().catch(() => ({}));
    const reqUserId = body.userId;
    const reqEmail = body.email;

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    // Verify token if available
    if (accessToken && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        if (user) {
          targetUserId = user.id;
          targetEmail = user.email || null;
        }
      } catch (err) {
        console.warn('Token verify warning in reward route:', err);
      }
    }

    if (!targetUserId && reqUserId) {
      targetUserId = reqUserId;
    }
    if (!targetEmail && reqEmail) {
      targetEmail = reqEmail;
    }

    const REWARD_AMOUNT = 50;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({
        success: true,
        reward: REWARD_AMOUNT,
        newCoins: 50,
        isGuest: true,
        message: `+${REWARD_AMOUNT} Dhoti Coins granted to guest session!`,
      });
    }

    if (isSupabaseConfigured()) {
      const sb = createServerClient();
      
      let query = sb.from('users').select('id, coins, name, email');
      if (targetUserId) {
        query = query.eq('id', targetUserId);
      } else if (targetEmail) {
        query = query.eq('email', targetEmail.toLowerCase().trim());
      }

      const { data: existingUser, error: fetchErr } = await query.maybeSingle();

      if (!fetchErr && existingUser) {
        const currentCoins = Number(existingUser.coins || 0);
        const newCoins = currentCoins + REWARD_AMOUNT;

        await sb
          .from('users')
          .update({ coins: newCoins })
          .eq('id', existingUser.id);

        return NextResponse.json({
          success: true,
          reward: REWARD_AMOUNT,
          newCoins,
          message: `+${REWARD_AMOUNT} Dhoti Coins credited successfully!`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      reward: REWARD_AMOUNT,
      newCoins: 150, // Fallback optimistic coins for guest or offline mode
      message: `+${REWARD_AMOUNT} Dhoti Coins granted!`,
    });
  } catch (error: any) {
    console.error('Error in reward route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
