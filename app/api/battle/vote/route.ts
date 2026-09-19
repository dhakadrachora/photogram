import { NextRequest, NextResponse } from 'next/server';

import {
  contentStore,
  BattleEventStore,
} from '@/lib/content-store';

import {
  fetchSupabaseBattles,
  isSupabaseConfigured,
  recordSupabaseVote,
  supabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* =========================================================
   AUTH
========================================================= */

function getBearerToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();

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

  const { data, error } =
    await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

/* =========================================================
   HELPERS
========================================================= */

function getImageUrl(option: any): string {
  if (!option || typeof option !== 'object') {
    return '';
  }

  const values = [
    option.imageUrl,
    option.image_url,
    option.photoUrl,
    option.photo_url,
    option.image,
    option.url,
  ];

  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return '';
}

function getOptionLabel(option: any): string {
  if (!option || typeof option !== 'object') {
    return '';
  }

  const values = [
    option.label,
    option.name,
    option.title,
  ];

  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return '';
}

function getBattleEnded(
  battle: BattleEventStore
): boolean {
  const endsAt = Number(
    battle.endsAt || 0
  );

  return (
    battle.isEnded === true ||
    battle.status === 'closed' ||
    (endsAt > 0 &&
      Date.now() >= endsAt)
  );
}

function calculateWinner(
  battle: BattleEventStore
): string | null {
  const aVotes = Number(
    battle.optionA?.votes || 0
  );

  const bVotes = Number(
    battle.optionB?.votes || 0
  );

  if (aVotes === bVotes) {
    return null;
  }

  return aVotes > bVotes
    ? battle.optionA.id
    : battle.optionB.id;
}

function syncExpiredBattle(
  battle: BattleEventStore
): void {
  if (!getBattleEnded(battle)) {
    return;
  }

  battle.isEnded = true;
  battle.status = 'closed';

  battle.winnerOptionId =
    calculateWinner(battle) ||
    undefined;
}

/* =========================================================
   LOAD BATTLES
========================================================= */

async function hydrateBattles() {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const rows =
      await fetchSupabaseBattles();

    if (!Array.isArray(rows)) {
      return;
    }

    for (const raw of rows as any[]) {
      if (!raw?.id) {
        continue;
      }

      const optionA =
        raw.optionA ||
        raw.option_a ||
        raw.options?.[0] ||
        {};

      const optionB =
        raw.optionB ||
        raw.option_b ||
        raw.options?.[1] ||
        {};

      const normalizedA = {
        ...optionA,

        id:
          optionA.id ||
          `option_a_${raw.id}`,

        label:
          getOptionLabel(optionA),

        name:
          getOptionLabel(optionA),

        imageUrl:
          getImageUrl(optionA),

        votes:
          Number(optionA.votes || 0),
      };

      const normalizedB = {
        ...optionB,

        id:
          optionB.id ||
          `option_b_${raw.id}`,

        label:
          getOptionLabel(optionB),

        name:
          getOptionLabel(optionB),

        imageUrl:
          getImageUrl(optionB),

        votes:
          Number(optionB.votes || 0),
      };

      const battleId =
        String(raw.id);

      const existing =
        contentStore.battles.get(
          battleId
        );

      if (existing) {
        existing.title =
          raw.title || '';

        existing.category =
          raw.category ||
          'Community';

        existing.description =
          raw.description ||
          '';

        existing.optionA =
          normalizedA as any;

        existing.optionB =
          normalizedB as any;

        existing.startsAt =
          Number(
            raw.startsAt ||
              raw.starts_at ||
              0
          );

        existing.endsAt =
          Number(
            raw.endsAt ||
              raw.ends_at ||
              0
          );

        existing.published =
          raw.published !== false;

        existing.status =
          raw.status ||
          'active';

        existing.isEnded =
          raw.isEnded === true ||
          raw.is_ended === true;

        existing.winnerOptionId =
          raw.winnerOptionId ||
          raw.winner_option_id ||
          undefined;

        continue;
      }

      const battle =
        {
          id: battleId,

          title:
            raw.title || '',

          category:
            raw.category ||
            'Community',

          description:
            raw.description ||
            '',

          optionA:
            normalizedA,

          optionB:
            normalizedB,

          startsAt:
            Number(
              raw.startsAt ||
                raw.starts_at ||
                0
            ),

          endsAt:
            Number(
              raw.endsAt ||
                raw.ends_at ||
                0
            ),

          published:
            raw.published !== false,

          status:
            raw.status ||
            'active',

          isEnded:
            raw.isEnded === true ||
            raw.is_ended === true,

          winnerOptionId:
            raw.winnerOptionId ||
            raw.winner_option_id ||
            undefined,

          votedUserEmails:
            new Set<string>(),

          userVotes:
            new Map<string, string>(),
        } as BattleEventStore;

      contentStore.battles.set(
        battleId,
        battle
      );
    }
  } catch (error) {
    console.error(
      'Battle hydration error:',
      error
    );
  }
}

/* =========================================================
   REAL VOTE COUNTS
========================================================= */

async function getRealVoteCounts(
  battleId: string,
  optionAId: string,
  optionBId: string
) {
  const { data, error } =
    await supabase
      .from('battle_votes')
      .select('option_id')
      .eq(
        'battle_id',
        battleId
      );

  if (error) {
    throw error;
  }

  let optionAVotes = 0;
  let optionBVotes = 0;

  for (const vote of data || []) {
    if (
      vote.option_id ===
      optionAId
    ) {
      optionAVotes++;
    }

    if (
      vote.option_id ===
      optionBId
    ) {
      optionBVotes++;
    }
  }

  return {
    optionAVotes,
    optionBVotes,
  };
}

/* =========================================================
   SYNC VOTE COUNTS
========================================================= */

async function syncBattleVoteCounts(
  battle: BattleEventStore
) {
  const {
    optionAVotes,
    optionBVotes,
  } =
    await getRealVoteCounts(
      battle.id,
      battle.optionA.id,
      battle.optionB.id
    );

  battle.optionA.votes =
    optionAVotes;

  battle.optionB.votes =
    optionBVotes;

  if (
    getBattleEnded(battle)
  ) {
    syncExpiredBattle(battle);
  }

  const { error } =
    await supabase
      .from('battles')
      .update({
        option_a:
          battle.optionA,

        option_b:
          battle.optionB,

        is_ended:
          battle.isEnded,

        status:
          battle.status,

        winner_option_id:
          battle.winnerOptionId ||
          null,
      })
      .eq(
        'id',
        battle.id
      );

  if (error) {
    console.warn(
      'Battle count sync warning:',
      error
    );
  }

  return {
    optionAVotes,
    optionBVotes,
  };
}

/* =========================================================
   FORMAT
========================================================= */

function formatBattleForClient(
  battle: BattleEventStore,
  userVotedOptionId?: string | null
) {
  const isEnded =
    getBattleEnded(battle);

  if (isEnded) {
    syncExpiredBattle(battle);
  }

  const optionAVotes =
    Number(
      battle.optionA?.votes || 0
    );

  const optionBVotes =
    Number(
      battle.optionB?.votes || 0
    );

  const totalVotes =
    optionAVotes +
    optionBVotes;

  const isTie =
    isEnded &&
    optionAVotes ===
      optionBVotes;

  const optionA = {
    ...battle.optionA,

    label:
      getOptionLabel(
        battle.optionA
      ),

    name:
      getOptionLabel(
        battle.optionA
      ),

    imageUrl:
      getImageUrl(
        battle.optionA
      ),

    votes:
      optionAVotes,
  };

  const optionB = {
    ...battle.optionB,

    label:
      getOptionLabel(
        battle.optionB
      ),

    name:
      getOptionLabel(
        battle.optionB
      ),

    imageUrl:
      getImageUrl(
        battle.optionB
      ),

    votes:
      optionBVotes,
  };

  let winnerOptionId:
    | string
    | null = null;

  if (!isTie) {
    winnerOptionId =
      battle.winnerOptionId ||
      calculateWinner(battle);
  }

  return {
    id:
      battle.id,

    title:
      battle.title,

    category:
      battle.category ||
      'Community',

    description:
      battle.description ||
      '',

    optionA,

    optionB,

    options: [
      optionA,
      optionB,
    ],

    published:
      battle.published !== false,

    isEnded,

    status:
      isEnded
        ? 'closed'
        : battle.status ||
          'active',

    startsAt:
      Number(
        battle.startsAt || 0
      ),

    endsAt:
      Number(
        battle.endsAt || 0
      ),

    userVotedOptionId:
      userVotedOptionId ||
      undefined,

    totalVotes,

    winnerOptionId,

    isTie,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req: NextRequest
) {
  try {
    if (
      !isSupabaseConfigured()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle voting is temporarily unavailable.',
        },
        {
          status: 503,
        }
      );
    }

    await hydrateBattles();

    const user =
      await getAuthenticatedUser(
        req
      );

    const userVotes =
      new Map<
        string,
        string
      >();

    if (user) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'battle_votes'
          )
          .select(
            'battle_id, option_id'
          )
          .eq(
            'user_id',
            user.id
          );

      if (
        !error &&
        Array.isArray(data)
      ) {
        for (
          const vote of data
        ) {
          if (
            vote.battle_id &&
            vote.option_id
          ) {
            userVotes.set(
              String(
                vote.battle_id
              ),
              String(
                vote.option_id
              )
            );
          }
        }
      }
    }

    const battles = [];

    for (
      const battle of
      contentStore.battles.values()
    ) {
      if (
        battle.published === false
      ) {
        continue;
      }

      try {
        await syncBattleVoteCounts(
          battle
        );
      } catch (error) {
        console.warn(
          'Vote count refresh failed:',
          error
        );
      }

      battles.push(
        formatBattleForClient(
          battle,
          user
            ? userVotes.get(
                battle.id
              ) || null
            : null
        )
      );
    }

    battles.sort(
      (a, b) =>
        Number(
          b.startsAt || 0
        ) -
        Number(
          a.startsAt || 0
        )
    );

    return NextResponse.json(
      {
        success: true,

        battles,

        battle:
          battles[0] ||
          null,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',

          Pragma:
            'no-cache',

          Expires:
            '0',
        },
      }
    );
  } catch (error: any) {
    console.error(
      'Battle vote GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to load battles.',

        details:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST VOTE
========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    if (
      !isSupabaseConfigured()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle voting is temporarily unavailable.',
        },
        {
          status: 503,
        }
      );
    }

    const user =
      await getAuthenticatedUser(
        req
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Login is required to vote.',

          code:
            'LOGIN_REQUIRED',
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json().catch(
        () => ({})
      );

    const battleId =
      typeof body?.battleId ===
      'string'
        ? body.battleId.trim()
        : '';

    const optionId =
      typeof body?.optionId ===
      'string'
        ? body.optionId.trim()
        : '';

    if (
      !battleId ||
      !optionId
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'battleId and optionId are required.',
        },
        {
          status: 400,
        }
      );
    }

    await hydrateBattles();

    const battle =
      contentStore.battles.get(
        battleId
      );

    if (
      !battle ||
      battle.published === false
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Battle event not found.',
        },
        {
          status: 404,
        }
      );
    }

    if (
      getBattleEnded(battle)
    ) {
      syncExpiredBattle(
        battle
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Voting has ended for this battle.',

          code:
            'BATTLE_ENDED',
        },
        {
          status: 400,
        }
      );
    }

    const isOptionA =
      optionId ===
      battle.optionA.id;

    const isOptionB =
      optionId ===
      battle.optionB.id;

    if (
      !isOptionA &&
      !isOptionB
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Invalid option chosen for this battle.',
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------
       Check existing vote
    --------------------------------------------- */

    const {
      data: existingVotes,
      error:
        existingVoteError,
    } =
      await supabase
        .from(
          'battle_votes'
        )
        .select(
          'option_id'
        )
        .eq(
          'battle_id',
          battleId
        )
        .eq(
          'user_id',
          user.id
        )
        .limit(1);

    if (
      !existingVoteError &&
      existingVotes &&
      existingVotes.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'You have already voted in this battle.',

          code:
            'ALREADY_VOTED',

          votedOptionId:
            existingVotes[0]
              .option_id,
        },
        {
          status: 409,
        }
      );
    }

    /* ---------------------------------------------
       Save vote
    --------------------------------------------- */

    const email =
      user.email
        ?.toLowerCase()
        .trim() || '';

    const voteResult =
      await recordSupabaseVote(
        battleId,
        email ||
          user.id,
        optionId,
        user.id
      );

    if (
      voteResult?.alreadyVoted
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'You have already voted in this battle.',

          code:
            'ALREADY_VOTED',
        },
        {
          status: 409,
        }
      );
    }

    if (
      voteResult?.error
    ) {
      console.error(
        'Supabase vote error:',
        voteResult.error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Unable to save your vote.',
        },
        {
          status: 500,
        }
      );
    }

    /* ---------------------------------------------
       Refresh real counts
    --------------------------------------------- */

    try {
      await syncBattleVoteCounts(
        battle
      );
    } catch (error) {
      console.warn(
        'Vote count refresh failed:',
        error
      );

      if (isOptionA) {
        battle.optionA.votes =
          Number(
            battle.optionA.votes ||
              0
          ) + 1;
      } else {
        battle.optionB.votes =
          Number(
            battle.optionB.votes ||
              0
          ) + 1;
      }
    }

    if (email) {
      battle.votedUserEmails.add(
        email
      );

      battle.userVotes.set(
        email,
        optionId
      );
    }

    const updatedBattle =
      formatBattleForClient(
        battle,
        optionId
      );

    return NextResponse.json(
      {
        success: true,

        message:
          `Vote registered for ${
            isOptionA
              ? getOptionLabel(
                  battle.optionA
                )
              : getOptionLabel(
                  battle.optionB
                )
          }.`,

        battle:
          updatedBattle,

        votedOptionId:
          optionId,
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error(
      'Battle vote POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to process vote.',

        details:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}