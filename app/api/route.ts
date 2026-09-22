import { NextRequest, NextResponse } from 'next/server';
import { contentStore, BattleEventStore } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

function formatBattleForClient(
  battle: BattleEventStore,
  userEmail?: string | null
) {
  const normalizedEmail = userEmail
    ? userEmail.toLowerCase().trim()
    : null;

  const userVotedOptionId = normalizedEmail
    ? battle.userVotes.get(normalizedEmail)
    : undefined;

  const isEnded =
    battle.isEnded ||
    (battle.endsAt && Date.now() >= battle.endsAt) ||
    battle.status === 'closed';

  let winnerOptionId: string | undefined;

  if (isEnded) {
    if (battle.winnerOptionId) {
      winnerOptionId = battle.winnerOptionId;
    } else if (
      battle.optionA.votes > battle.optionB.votes
    ) {
      winnerOptionId = battle.optionA.id;
    } else if (
      battle.optionB.votes > battle.optionA.votes
    ) {
      winnerOptionId = battle.optionB.id;
    }
  }

  return {
    id: battle.id,

    title: battle.title,

    category: battle.category,

    description: battle.description,

    optionA: {
      ...battle.optionA,
    },

    optionB: {
      ...battle.optionB,
    },

    startsAt: battle.startsAt,

    endsAt: battle.endsAt,

    isEnded,

    status: isEnded
      ? 'closed'
      : 'active',

    published:
      battle.published !== false,

    userVotedOptionId,

    totalVotes:
      Number(battle.optionA.votes || 0) +
      Number(battle.optionB.votes || 0),

    winnerOptionId,

    isDraw:
      isEnded &&
      Number(battle.optionA.votes || 0) ===
        Number(battle.optionB.votes || 0),
  };
}

/* ============================================================
   GET — PUBLIC BATTLE LIST
   ============================================================ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } =
      new URL(req.url);

    const userEmail =
      searchParams.get('email');

    const battles =
      Array.from(
        contentStore.battles.values()
      )
        .filter(
          (battle) =>
            battle.published !== false
        )
        .map((battle) =>
          formatBattleForClient(
            battle,
            userEmail
          )
        );

    return NextResponse.json(
      {
        success: true,
        battles,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error(
      '[BATTLE VOTE GET ERROR]',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to load battles.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST — SUBMIT VOTE
   ============================================================ */

export async function POST(req: NextRequest) {
  try {
    const body =
      await req.json().catch(
        () => ({})
      );

    const battleId =
      typeof body.battleId === 'string'
        ? body.battleId.trim()
        : '';

    const optionId =
      typeof body.optionId === 'string'
        ? body.optionId.trim()
        : '';

    const bodyEmail =
      typeof body.userEmail === 'string'
        ? body.userEmail.trim()
        : '';

    const headerEmail =
      req.headers.get(
        'x-user-email'
      ) || '';

    const userEmail = (
      headerEmail ||
      bodyEmail
    )
      .trim()
      .toLowerCase();

    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    if (
      !userEmail ||
      !userEmail.includes('@')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Google Sign-In is required to vote in Battle.',
          code:
            'LOGIN_REQUIRED',
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       REQUEST VALIDATION
    -------------------------------------------------------- */

    if (!battleId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle ID is required.',
          code:
            'INVALID_BATTLE_ID',
        },
        {
          status: 400,
        }
      );
    }

    if (!optionId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Option ID is required.',
          code:
            'INVALID_OPTION_ID',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       FIND BATTLE
    -------------------------------------------------------- */

    const battle =
      contentStore.battles.get(
        battleId
      );

    if (!battle) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle event not found.',
          code:
            'NOT_FOUND',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       SERVER-SIDE TIMER CHECK
    -------------------------------------------------------- */

    const now = Date.now();

    const isEnded =
      battle.isEnded ||
      battle.status === 'closed' ||
      (battle.endsAt && now >= battle.endsAt);

    if (isEnded) {
      /*
       * IMPORTANT:
       *
       * Battle is NOT deleted here.
       *
       * Only voting is closed.
       */

      if (!battle.isEnded) {
        battle.isEnded = true;
        battle.status = 'closed';

        if (
          battle.optionA.votes >
          battle.optionB.votes
        ) {
          battle.winnerOptionId =
            battle.optionA.id;
        } else if (
          battle.optionB.votes >
          battle.optionA.votes
        ) {
          battle.winnerOptionId =
            battle.optionB.id;
        } else {
          battle.winnerOptionId =
            undefined;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error:
            'Voting has ended for this battle. No more votes can be submitted.',
          code:
            'BATTLE_ENDED',
          battle:
            formatBattleForClient(
              battle,
              userEmail
            ),
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       OPTION VALIDATION
    -------------------------------------------------------- */

    const validOption =
      optionId === battle.optionA.id ||
      optionId === battle.optionB.id;

    if (!validOption) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid option chosen for this battle.',
          code:
            'INVALID_OPTION',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       ONE VOTE PER USER
    -------------------------------------------------------- */

    if (
      battle.votedUserEmails.has(
        userEmail
      )
    ) {
      const existingVote =
        battle.userVotes.get(
          userEmail
        );

      return NextResponse.json(
        {
          success: false,
          error:
            'You have already voted in this battle. Only one vote per user is allowed.',
          code:
            'ALREADY_VOTED',
          votedOptionId:
            existingVote,
          battle:
            formatBattleForClient(
              battle,
              userEmail
            ),
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       REGISTER VOTE
    -------------------------------------------------------- */

    if (
      optionId ===
      battle.optionA.id
    ) {
      battle.optionA.votes =
        Number(
          battle.optionA.votes || 0
        ) + 1;
    } else {
      battle.optionB.votes =
        Number(
          battle.optionB.votes || 0
        ) + 1;
    }

    battle.votedUserEmails.add(
      userEmail
    );

    battle.userVotes.set(
      userEmail,
      optionId
    );

    /* --------------------------------------------------------
       RETURN UPDATED BATTLE
    -------------------------------------------------------- */

    const updatedBattle =
      formatBattleForClient(
        battle,
        userEmail
      );

    const selectedLabel =
      optionId ===
      battle.optionA.id
        ? battle.optionA.label
        : battle.optionB.label;

    return NextResponse.json(
      {
        success: true,

        message:
          `Vote registered for ${selectedLabel}!`,

        battle:
          updatedBattle,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      '[BATTLE VOTE POST ERROR]',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to record vote.',
      },
      {
        status: 500,
      }
    );
  }
}