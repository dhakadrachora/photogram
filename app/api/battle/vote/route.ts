import { NextRequest, NextResponse } from 'next/server';
import { contentStore, BattleEventStore } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

function formatBattleForClient(battle: BattleEventStore, userEmail?: string | null) {
  const normalizedEmail = userEmail ? userEmail.toLowerCase().trim() : null;
  const userVotedOptionId = normalizedEmail ? battle.userVotes.get(normalizedEmail) : undefined;
  const isEnded = battle.isEnded || Date.now() >= battle.endsAt || battle.status === 'closed';

  return {
    id: battle.id,
    title: battle.title,
    category: battle.category,
    description: battle.description,
    optionA: { ...battle.optionA },
    optionB: { ...battle.optionB },
    isEnded,
    endsAt: battle.endsAt,
    userVotedOptionId,
    totalVotes: battle.optionA.votes + battle.optionB.votes,
    winnerOptionId: isEnded
      ? battle.winnerOptionId || (battle.optionA.votes >= battle.optionB.votes ? battle.optionA.id : battle.optionB.id)
      : undefined,
  };
}

// GET: Anyone can view battles and live results (PUBLIC ACCESS)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get('email');

  // Filter only published battles for public client
  const battles = Array.from(contentStore.battles.values())
    .filter((b) => b.published !== false)
    .map((b) => formatBattleForClient(b, userEmail));

  return NextResponse.json(
    { battles },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

// POST: Strictly Authenticated Voting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { battleId, optionId, userEmail: bodyEmail } = body;

    const headerEmail = req.headers.get('x-user-email');
    const userEmail = (headerEmail || bodyEmail || '').toString().trim().toLowerCase();

    // 1. Authentication Check: Google Sign-In is required to vote in Battle
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        {
          error: 'Google Sign-In is required to vote in Battle.',
          code: 'LOGIN_REQUIRED',
        },
        { status: 401 }
      );
    }

    // 2. Battle Existence Check
    const battle = contentStore.battles.get(battleId);
    if (!battle) {
      return NextResponse.json(
        { error: 'Battle event not found.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Battle Expiration / Ended Check
    const isNowEnded = battle.isEnded || Date.now() >= battle.endsAt || battle.status === 'closed';
    if (isNowEnded) {
      return NextResponse.json(
        {
          error: 'Voting has ended for this battle. No more votes can be submitted.',
          code: 'BATTLE_ENDED',
        },
        { status: 400 }
      );
    }

    // 4. One Vote Per User Check (Server-Side Enforced)
    if (battle.votedUserEmails.has(userEmail)) {
      const existingVote = battle.userVotes.get(userEmail);
      return NextResponse.json(
        {
          error: 'You have already voted in this battle. Only one vote per user is allowed.',
          code: 'ALREADY_VOTED',
          votedOptionId: existingVote,
        },
        { status: 409 }
      );
    }

    // 5. Option Validation Check
    if (optionId !== battle.optionA.id && optionId !== battle.optionB.id) {
      return NextResponse.json(
        { error: 'Invalid option chosen for this battle.', code: 'INVALID_OPTION' },
        { status: 400 }
      );
    }

    // 6. Record Vote
    if (optionId === battle.optionA.id) {
      battle.optionA.votes += 1;
    } else {
      battle.optionB.votes += 1;
    }
    battle.votedUserEmails.add(userEmail);
    battle.userVotes.set(userEmail, optionId);

    const updatedBattle = formatBattleForClient(battle, userEmail);

    return NextResponse.json({
      success: true,
      message: `Vote registered for ${optionId === battle.optionA.id ? battle.optionA.label : battle.optionB.label}!`,
      battle: updatedBattle,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to record vote', details: error?.message },
      { status: 500 }
    );
  }
}
