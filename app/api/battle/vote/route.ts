import { NextRequest, NextResponse } from 'next/server';
import { contentStore, BattleEventStore } from '@/lib/content-store';
import {
  isSupabaseConfigured,
  recordSupabaseVote,
  supabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_EMAIL = 'rohitdhakaddhoti143@gmail.com';

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7).trim();
  return token || null;
}

async function getAuthenticatedUser(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

function getBattleEnded(battle: BattleEventStore) {
  return (
    battle.isEnded ||
    battle.status === 'closed' ||
    Date.now() >= Number(battle.endsAt || 0)
  );
}

function formatBattleForClient(
  battle: BattleEventStore,
  userVotedOptionId?: string | null
) {
  const isEnded = getBattleEnded(battle);

  const totalVotes =
    Number(battle.optionA?.votes || 0) +
    Number(battle.optionB?.votes || 0);

  let winnerOptionId: string | undefined;

  if (isEnded) {
    if (battle.winnerOptionId) {
      winnerOptionId = battle.winnerOptionId;
    } else if (
      Number(battle.optionA?.votes || 0) >
      Number(battle.optionB?.votes || 0)
    ) {
      winnerOptionId = battle.optionA.id;
    } else if (
      Number(battle.optionB?.votes || 0) >
      Number(battle.optionA?.votes || 0)
    ) {
      winnerOptionId = battle.optionB.id;
    } else {
      // Tie
      winnerOptionId = undefined;
    }
  }

  return {
    id: battle.id,
    title: battle.title,
    category: battle.category,
    description: battle.description,

    optionA: {
      ...battle.optionA,
      votes: Number(battle.optionA?.votes || 0),
    },

    optionB: {
      ...battle.optionB,
      votes: Number(battle.optionB?.votes || 0),
    },

    published: battle.published !== false,

    isEnded,

    status: isEnded ? 'closed' : battle.status,

    endsAt: Number(battle.endsAt || 0),

    userVotedOptionId: userVotedOptionId || undefined,

    totalVotes,

    winnerOptionId,

    isTie:
      isEnded &&
      Number(battle.optionA?.votes || 0) ===
        Number(battle.optionB?.votes || 0),
  };
}

/**
 * GET
 *
 * Public:
 * - Anyone can see battles
 * - Anyone can see live vote counts
 *
 * Logged-in:
 * - Their own vote status is returned
 *
 * IMPORTANT:
 * We never trust email/user ID coming from query parameters.
 */
export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;

    const user = await getAuthenticatedUser(req);

    if (user) {
      userId = user.id;
      userEmail = user.email?.toLowerCase().trim() || null;
    }

    /**
     * Get user's votes from Supabase.
     *
     * The database remains the source of truth for whether
     * this authenticated user has voted.
     */
    const userVotes = new Map<string, string>();

    if (user && isSupabaseConfigured()) {
      try {
        // Prefer user_id because email can change.
        const { data, error } = await supabase
          .from('battle_votes')
          .select('battle_id, option_id')
          .eq('user_id', user.id);

        if (!error && data) {
          for (const vote of data) {
            if (vote.battle_id && vote.option_id) {
              userVotes.set(vote.battle_id, vote.option_id);
            }
          }
        } else if (userEmail) {
          /**
           * Backward compatibility for old rows which may only
           * contain user_email.
           */
          const fallback = await supabase
            .from('battle_votes')
            .select('battle_id, option_id')
            .eq('user_email', userEmail);

          if (!fallback.error && fallback.data) {
            for (const vote of fallback.data) {
              if (vote.battle_id && vote.option_id) {
                userVotes.set(vote.battle_id, vote.option_id);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Unable to load user battle votes:', error);
      }
    }

    /**
     * Public battle list.
     *
     * Note:
     * contentStore is still being used here because the rest of
     * the battle system is currently being migrated to Supabase.
     */
    const battles = Array.from(contentStore.battles.values())
      .filter((battle) => battle.published !== false)
      .map((battle) =>
        formatBattleForClient(
          battle,
          userId ? userVotes.get(battle.id) || null : null
        )
      );

    return NextResponse.json(
      {
        success: true,
        battles,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Battle GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load battles.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Authenticated users only.
 *
 * Rules:
 * - Real Supabase user required
 * - Client cannot choose another user's identity
 * - Battle must exist
 * - Battle must still be active
 * - Option must be valid
 * - One vote per authenticated user
 * - Vote is persisted in Supabase
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Battle voting is temporarily unavailable.',
          code: 'SUPABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    /**
     * REAL AUTHENTICATION
     *
     * Never trust:
     * x-user-email
     * x-user-id
     * body.userEmail
     * body.userId
     */
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Login is required to vote.',
          code: 'LOGIN_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const battleId =
      typeof body?.battleId === 'string'
        ? body.battleId.trim()
        : '';

    const optionId =
      typeof body?.optionId === 'string'
        ? body.optionId.trim()
        : '';

    if (!battleId || !optionId) {
      return NextResponse.json(
        {
          error: 'battleId and optionId are required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    /**
     * Find battle.
     */
    const battle = contentStore.battles.get(battleId);

    if (!battle || battle.published === false) {
      return NextResponse.json(
        {
          error: 'Battle event not found.',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    /**
     * Validate option BEFORE writing vote.
     */
    const isOptionA = optionId === battle.optionA.id;
    const isOptionB = optionId === battle.optionB.id;

    if (!isOptionA && !isOptionB) {
      return NextResponse.json(
        {
          error: 'Invalid option chosen for this battle.',
          code: 'INVALID_OPTION',
        },
        { status: 400 }
      );
    }

    /**
     * Server-side timer check.
     */
    const now = Date.now();

    if (
      battle.isEnded ||
      battle.status === 'closed' ||
      !battle.endsAt ||
      now >= Number(battle.endsAt)
    ) {
      battle.isEnded = true;
      battle.status = 'closed';

      return NextResponse.json(
        {
          error: 'Voting has ended for this battle.',
          code: 'BATTLE_ENDED',
        },
        { status: 400 }
      );
    }

    /**
     * Check whether this real authenticated user already voted.
     *
     * Database check is the important one.
     */
    const { data: existingVotes, error: existingVoteError } =
      await supabase
        .from('battle_votes')
        .select('option_id')
        .eq('battle_id', battleId)
        .eq('user_id', user.id)
        .limit(1);

    if (!existingVoteError && existingVotes?.length) {
      const existingOptionId = existingVotes[0].option_id;

      return NextResponse.json(
        {
          error: 'You have already voted in this battle.',
          code: 'ALREADY_VOTED',
          votedOptionId: existingOptionId,
        },
        { status: 409 }
      );
    }

    /**
     * Backward compatibility:
     * Check old email-based votes too.
     */
    const email = user.email?.toLowerCase().trim();

    if (email) {
      try {
        const { data: oldEmailVote } = await supabase
          .from('battle_votes')
          .select('option_id')
          .eq('battle_id', battleId)
          .eq('user_email', email)
          .limit(1);

        if (oldEmailVote?.length) {
          return NextResponse.json(
            {
              error: 'You have already voted in this battle.',
              code: 'ALREADY_VOTED',
              votedOptionId: oldEmailVote[0].option_id,
            },
            { status: 409 }
          );
        }
      } catch {
        // Ignore legacy lookup failure.
      }
    }

    /**
     * Save REAL vote in Supabase.
     *
     * IMPORTANT:
     * user ID/email comes ONLY from authenticated Supabase user.
     */
    const voteResult = await recordSupabaseVote(
      battleId,
      email || user.id,
      optionId,
      user.id
    );

    if (voteResult.alreadyVoted) {
      return NextResponse.json(
        {
          error: 'You have already voted in this battle.',
          code: 'ALREADY_VOTED',
        },
        { status: 409 }
      );
    }

    if (voteResult.error) {
      console.error('Supabase vote error:', voteResult.error);

      return NextResponse.json(
        {
          error: 'Unable to save your vote.',
          code: 'VOTE_SAVE_FAILED',
        },
        { status: 500 }
      );
    }

    /**
     * Update current battle state.
     *
     * This keeps the existing BattleEventStore compatible while
     * Supabase remains the permanent vote record.
     */
    if (isOptionA) {
      battle.optionA.votes =
        Number(battle.optionA.votes || 0) + 1;
    } else {
      battle.optionB.votes =
        Number(battle.optionB.votes || 0) + 1;
    }

    /**
     * Keep in-memory state aware of this user's vote.
     */
    if (email) {
      battle.votedUserEmails.add(email);
      battle.userVotes.set(email, optionId);
    }

    /**
     * Persist current vote counts.
     *
     * The actual individual vote is already stored in battle_votes.
     */
    try {
      await supabase
        .from('battles')
        .update({
          option_a: battle.optionA,
          option_b: battle.optionB,
        })
        .eq('id', battleId);
    } catch (error) {
      console.warn(
        'Could not update cached battle vote counts:',
        error
      );
    }

    const updatedBattle = formatBattleForClient(
      battle,
      optionId
    );

    return NextResponse.json({
      success: true,

      message: `Vote registered for ${
        isOptionA
          ? battle.optionA.label
          : battle.optionB.label
      }!`,

      battle: updatedBattle,
    });
  } catch (error: any) {
    console.error('Battle vote POST error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record vote.',
        details:
          process.env.NODE_ENV === 'development'
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}