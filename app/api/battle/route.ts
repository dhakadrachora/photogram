import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { verifyAdminRequestAsync } from '@/lib/admin-auth';
import {
  contentStore,
  BattleEventStore,
} from '@/lib/content-store';

import {
  fetchSupabaseBattles,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_DURATION_MS =
  24 * 60 * 60 * 1000;

type AnyRecord = Record<string, any>;

function toNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function getDurationMs(
  body: AnyRecord
): number {
  const durationMs =
    toNumber(body.durationMs);

  if (
    durationMs !== null &&
    durationMs > 0
  ) {
    return durationMs;
  }

  const durationMinutes =
    toNumber(body.durationMinutes);

  if (
    durationMinutes !== null &&
    durationMinutes > 0
  ) {
    return (
      durationMinutes *
      60 *
      1000
    );
  }

  const durationHours =
    toNumber(body.durationHours);

  if (
    durationHours !== null &&
    durationHours > 0
  ) {
    return (
      durationHours *
      60 *
      60 *
      1000
    );
  }

  const durationDays =
    toNumber(body.durationDays);

  if (
    durationDays !== null &&
    durationDays > 0
  ) {
    return (
      durationDays *
      24 *
      60 *
      60 *
      1000
    );
  }

  return DEFAULT_DURATION_MS;
}

function getImageUrl(
  option: AnyRecord | null | undefined
): string {
  if (
    !option ||
    typeof option !== 'object'
  ) {
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

function getOptionLabel(
  option: AnyRecord | null | undefined
): string {
  if (
    !option ||
    typeof option !== 'object'
  ) {
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

function normalizeOption(
  option: AnyRecord | null | undefined,
  prefix: string,
  emoji: string
) {
  const source =
    option &&
    typeof option === 'object'
      ? option
      : {};

  const label =
    getOptionLabel(source);

  const votes =
    toNumber(source.votes) || 0;

  return {
    ...source,

    id:
      typeof source.id === 'string' &&
      source.id.trim()
        ? source.id.trim()
        : `${prefix}_${randomUUID()}`,

    label,

    name: label,

    tagline:
      typeof source.tagline === 'string'
        ? source.tagline
        : '',

    imageUrl:
      getImageUrl(source),

    votes:
      votes >= 0
        ? votes
        : 0,

    emoji:
      typeof source.emoji === 'string' &&
      source.emoji.trim()
        ? source.emoji
        : emoji,
  };
}

function getRawOption(
  battle: AnyRecord,
  side: 'A' | 'B'
) {
  if (side === 'A') {
    return (
      battle.optionA ||
      battle.option_a ||
      battle.options?.[0] ||
      {}
    );
  }

  return (
    battle.optionB ||
    battle.option_b ||
    battle.options?.[1] ||
    {}
  );
}

function getStartsAt(
  battle: AnyRecord
): number {
  return (
    toNumber(battle.startsAt) ||
    toNumber(battle.starts_at) ||
    0
  );
}

function getEndsAt(
  battle: AnyRecord
): number {
  return (
    toNumber(battle.endsAt) ||
    toNumber(battle.ends_at) ||
    0
  );
}

function isExpired(
  battle: AnyRecord
): boolean {
  const endsAt =
    getEndsAt(battle);

  return (
    endsAt > 0 &&
    Date.now() >= endsAt
  );
}

function isEnded(
  battle: AnyRecord
): boolean {
  return (
    battle.isEnded === true ||
    battle.is_ended === true ||
    battle.status === 'closed' ||
    isExpired(battle)
  );
}

function calculateWinner(
  battle: AnyRecord
): string | null {
  const optionA =
    normalizeOption(
      getRawOption(battle, 'A'),
      'option_a',
      '🔥'
    );

  const optionB =
    normalizeOption(
      getRawOption(battle, 'B'),
      'option_b',
      '⚡'
    );

  const a =
    Number(optionA.votes || 0);

  const b =
    Number(optionB.votes || 0);

  if (a === b) {
    return null;
  }

  return a > b
    ? optionA.id
    : optionB.id;
}

function finalizeBattle(
  battle: BattleEventStore
) {
  if (
    !isEnded(battle as any)
  ) {
    return;
  }

  battle.optionA =
    normalizeOption(
      battle.optionA as any,
      'option_a',
      '🔥'
    ) as any;

  battle.optionB =
    normalizeOption(
      battle.optionB as any,
      'option_b',
      '⚡'
    ) as any;

  battle.isEnded = true;
  battle.status = 'closed';

  battle.winnerOptionId =
    calculateWinner(
      battle as any
    ) || undefined;
}

function formatBattle(
  battle: BattleEventStore
) {
  const optionA =
    normalizeOption(
      battle.optionA as any,
      'option_a',
      '🔥'
    );

  const optionB =
    normalizeOption(
      battle.optionB as any,
      'option_b',
      '⚡'
    );

  const startsAt =
    getStartsAt(
      battle as any
    );

  const endsAt =
    getEndsAt(
      battle as any
    );

  const ended =
    isEnded(
      battle as any
    );

  const aVotes =
    Number(optionA.votes || 0);

  const bVotes =
    Number(optionB.votes || 0);

  const tie =
    ended &&
    aVotes === bVotes;

  return {
    id: battle.id,

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

    startsAt,

    endsAt,

    starts_at:
      startsAt
        ? new Date(
            startsAt
          ).toISOString()
        : null,

    ends_at:
      endsAt
        ? new Date(
            endsAt
          ).toISOString()
        : null,

    published:
      battle.published !== false,

    isEnded: ended,

    status:
      ended
        ? 'closed'
        : battle.status ||
          'active',

    winnerOptionId:
      tie
        ? null
        : battle.winnerOptionId ||
          calculateWinner(
            battle as any
          ),

    isTie: tie,

    totalVotes:
      aVotes + bVotes,

    commentsClosed:
      ended,
  };
}

/* =========================================================
   HYDRATE
========================================================= */

async function hydrateBattles() {
  if (
    !isSupabaseConfigured()
  ) {
    return;
  }

  const rows =
    await fetchSupabaseBattles();

  if (
    !Array.isArray(rows)
  ) {
    return;
  }

  for (
    const raw of rows as AnyRecord[]
  ) {
    if (!raw?.id) {
      continue;
    }

    const id =
      String(raw.id);

    const optionA =
      normalizeOption(
        getRawOption(raw, 'A'),
        'option_a',
        '🔥'
      );

    const optionB =
      normalizeOption(
        getRawOption(raw, 'B'),
        'option_b',
        '⚡'
      );

    const existing =
      contentStore.battles.get(
        id
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
        optionA as any;

      existing.optionB =
        optionB as any;

      existing.startsAt =
        getStartsAt(raw);

      existing.endsAt =
        getEndsAt(raw);

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
        id,

        title:
          raw.title || '',

        category:
          raw.category ||
          'Community',

        description:
          raw.description ||
          '',

        optionA:
          optionA as any,

        optionB:
          optionB as any,

        startsAt:
          getStartsAt(raw),

        endsAt:
          getEndsAt(raw),

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
      id,
      battle
    );
  }
}

/* =========================================================
   SAVE
========================================================= */

async function persistBattle(
  battle: BattleEventStore
) {
  if (
    !isSupabaseConfigured()
  ) {
    return;
  }

  const startsAt =
    getStartsAt(
      battle as any
    );

  const endsAt =
    getEndsAt(
      battle as any
    );

  if (
    !startsAt ||
    !endsAt ||
    endsAt <= startsAt
  ) {
    throw new Error(
      'Invalid battle start/end time.'
    );
  }

  const optionA =
    normalizeOption(
      battle.optionA as any,
      'option_a',
      '🔥'
    );

  const optionB =
    normalizeOption(
      battle.optionB as any,
      'option_b',
      '⚡'
    );

  const { error } =
    await supabase
      .from('battles')
      .upsert(
        {
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

          option_a:
            optionA,

          option_b:
            optionB,

          starts_at:
            new Date(
              startsAt
            ).toISOString(),

          ends_at:
            new Date(
              endsAt
            ).toISOString(),

          is_ended:
            battle.isEnded === true,

          status:
            battle.status ||
            'active',

          published:
            battle.published !== false,

          winner_option_id:
            battle.winnerOptionId ||
            null,
        },
        {
          onConflict: 'id',
        }
      );

  if (error) {
    throw error;
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req: NextRequest
) {
  try {
    const isAdmin =
      await verifyAdminRequestAsync(
        req
      );

    await hydrateBattles();

    for (
      const battle of
      contentStore.battles.values()
    ) {
      if (
        isExpired(
          battle as any
        )
      ) {
        finalizeBattle(
          battle
        );

        try {
          await persistBattle(
            battle
          );
        } catch (error) {
          console.error(
            'Failed to finalize expired battle:',
            error
          );
        }
      }
    }

    const battles =
      Array.from(
        contentStore.battles.values()
      )
        .filter((battle) =>
          isAdmin
            ? true
            : battle.published !== false
        )
        .map(formatBattle)
        .sort(
          (a, b) =>
            b.startsAt -
            a.startsAt
        );

    return NextResponse.json(
      {
        success: true,

        battles,

        battle:
          battles[0] ||
          null,

        isAdmin,
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
      'Battle GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to load battles.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  req: NextRequest
) {
  const isAdmin =
    await verifyAdminRequestAsync(
      req
    );

  if (!isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Unauthorized.',
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      await req.json();

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const category =
      typeof body.category === 'string'
        ? body.category.trim()
        : 'Community';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const optionAInput =
      body.optionA ||
      body.option_a ||
      body.options?.[0] ||
      {};

    const optionBInput =
      body.optionB ||
      body.option_b ||
      body.options?.[1] ||
      {};

    const labelA =
      getOptionLabel(
        optionAInput
      );

    const labelB =
      getOptionLabel(
        optionBInput
      );

    if (
      !title ||
      !labelA ||
      !labelB
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Battle title and both participant names are required.',
        },
        {
          status: 400,
        }
      );
    }

    const startsAt =
      toNumber(
        body.startsAt
      ) ||
      toNumber(
        body.starts_at
      ) ||
      Date.now();

    const endsAt =
      toNumber(
        body.endsAt
      ) ||
      toNumber(
        body.ends_at
      ) ||
      startsAt +
        getDurationMs(body);

    if (
      endsAt <= startsAt
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Battle end time must be after start time.',
        },
        {
          status: 400,
        }
      );
    }

    const battle =
      {
        id:
          `battle_${randomUUID()}`,

        title,

        category:
          category ||
          'Community',

        description,

        optionA:
          normalizeOption(
            {
              ...optionAInput,
              label: labelA,
            },
            'option_a',
            '🔥'
          ) as any,

        optionB:
          normalizeOption(
            {
              ...optionBInput,
              label: labelB,
            },
            'option_b',
            '⚡'
          ) as any,

        startsAt,

        endsAt,

        published:
          body.published !== false,

        isEnded:
          false,

        status:
          'active',

        winnerOptionId:
          undefined,

        votedUserEmails:
          new Set<string>(),

        userVotes:
          new Map<string, string>(),
      } as BattleEventStore;

    await persistBattle(
      battle
    );

    contentStore.battles.set(
      battle.id,
      battle
    );

    return NextResponse.json(
      {
        success: true,

        battle:
          formatBattle(
            battle
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      'Battle POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to create battle.',

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
   PUT
========================================================= */

export async function PUT(
  req: NextRequest
) {
  const isAdmin =
    await verifyAdminRequestAsync(
      req
    );

  if (!isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Unauthorized.',
      },
      {
        status: 403,
      }
    );
  }

  try {
    await hydrateBattles();

    const body =
      await req.json();

    const id =
      typeof body.id === 'string'
        ? body.id.trim()
        : '';

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle id is required.',
        },
        {
          status: 400,
        }
      );
    }

    const battle =
      contentStore.battles.get(
        id
      );

    if (!battle) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle not found.',
        },
        {
          status: 404,
        }
      );
    }

    const action =
      typeof body.action === 'string'
        ? body.action.trim()
        : '';

    if (
      action === 'toggle_publish'
    ) {
      battle.published =
        battle.published === false;
    }

    if (
      action === 'start'
    ) {
      const duration =
        Math.max(
          60 * 1000,
          getEndsAt(
            battle as any
          ) -
            getStartsAt(
              battle as any
            )
        );

      battle.startsAt =
        Date.now();

      battle.endsAt =
        battle.startsAt +
        duration;

      battle.isEnded =
        false;

      battle.status =
        'active';

      battle.winnerOptionId =
        undefined;
    }

    if (
      action === 'end' ||
      action === 'close'
    ) {
      battle.isEnded =
        true;

      battle.status =
        'closed';

      battle.endsAt =
        Date.now();

      battle.winnerOptionId =
        calculateWinner(
          battle as any
        ) || undefined;
    }

    const updates =
      body.updates &&
      typeof body.updates === 'object'
        ? body.updates
        : {};

    if (
      typeof updates.title === 'string'
    ) {
      battle.title =
        updates.title.trim();
    }

    if (
      typeof updates.description === 'string'
    ) {
      battle.description =
        updates.description.trim();
    }

    if (
      typeof updates.category === 'string'
    ) {
      battle.category =
        updates.category.trim();
    }

    if (
      typeof updates.published === 'boolean'
    ) {
      battle.published =
        updates.published;
    }

    if (
      updates.optionA &&
      typeof updates.optionA === 'object'
    ) {
      const current =
        normalizeOption(
          battle.optionA as any,
          'option_a',
          '🔥'
        );

      const incoming =
        updates.optionA;

      const label =
        getOptionLabel(
          incoming
        ) ||
        current.label;

      battle.optionA =
        {
          ...current,
          ...incoming,
          id: current.id,
          label,
          name: label,
          imageUrl:
            getImageUrl(
              incoming
            ) ||
            current.imageUrl,
          votes:
            current.votes,
        } as any;
    }

    if (
      updates.optionB &&
      typeof updates.optionB === 'object'
    ) {
      const current =
        normalizeOption(
          battle.optionB as any,
          'option_b',
          '⚡'
        );

      const incoming =
        updates.optionB;

      const label =
        getOptionLabel(
          incoming
        ) ||
        current.label;

      battle.optionB =
        {
          ...current,
          ...incoming,
          id: current.id,
          label,
          name: label,
          imageUrl:
            getImageUrl(
              incoming
            ) ||
            current.imageUrl,
          votes:
            current.votes,
        } as any;
    }

    finalizeBattle(
      battle
    );

    await persistBattle(
      battle
    );

    return NextResponse.json(
      {
        success: true,

        battle:
          formatBattle(
            battle
          ),
      }
    );
  } catch (error: any) {
    console.error(
      'Battle PUT error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to update battle.',

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
   DELETE — PERMANENT BATTLE DELETE
========================================================= */

export async function DELETE(
  req: NextRequest
) {
  try {
    const isAdmin =
      await verifyAdminRequestAsync(
        req
      );

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Unauthorized: Only admin can delete battles.',
        },
        {
          status: 403,
        }
      );
    }

    const url =
      new URL(req.url);

    const battleId =
      url.searchParams
        .get('id')
        ?.trim() || '';

    if (!battleId) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Battle id is required.',
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      '[BATTLE DELETE] Requested:',
      battleId
    );

    if (
      !isSupabaseConfigured()
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'Supabase is not configured. Battle cannot be permanently deleted.',
        },
        {
          status: 500,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * Delete child rows first.
     * This prevents foreign-key problems.
     */

    const comments =
      await supabase
        .from('battle_comments')
        .delete()
        .eq(
          'battle_id',
          battleId
        );

    if (comments.error) {
      console.error(
        '[BATTLE DELETE] Comments delete failed:',
        comments.error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Could not delete battle comments.',

          details:
            comments.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const votes =
      await supabase
        .from('battle_votes')
        .delete()
        .eq(
          'battle_id',
          battleId
        );

    if (votes.error) {
      console.error(
        '[BATTLE DELETE] Votes delete failed:',
        votes.error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Could not delete battle votes.',

          details:
            votes.error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * NOW delete the actual battle.
     */

    const battleDelete =
      await supabase
        .from('battles')
        .delete()
        .eq(
          'id',
          battleId
        )
        .select('id');

    if (
      battleDelete.error
    ) {
      console.error(
        '[BATTLE DELETE] Battle delete failed:',
        battleDelete.error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Battle could not be deleted from database.',

          details:
            battleDelete.error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * VERY IMPORTANT:
     *
     * If DELETE affected zero rows,
     * do not pretend it succeeded.
     */

    const deletedRows =
      battleDelete.data || [];

    if (
      deletedRows.length === 0
    ) {
      console.error(
        '[BATTLE DELETE] Zero rows deleted:',
        battleId
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Battle was not deleted. Database returned zero deleted rows.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Remove from server runtime too.
     */

    contentStore.battles.delete(
      battleId
    );

    /*
     * Verify that database no longer
     * contains the battle.
     */

    const verification =
      await supabase
        .from('battles')
        .select('id')
        .eq(
          'id',
          battleId
        )
        .maybeSingle();

    if (
      verification.error
    ) {
      console.error(
        '[BATTLE DELETE] Verification failed:',
        verification.error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Battle delete verification failed.',

          details:
            verification.error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (
      verification.data
    ) {
      console.error(
        '[BATTLE DELETE] Battle still exists:',
        battleId
      );

      return NextResponse.json(
        {
          success: false,

          error:
            'Battle still exists in database after delete.',
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      '[BATTLE DELETE] Successfully deleted:',
      battleId
    );

    return NextResponse.json(
      {
        success: true,

        deletedId:
          battleId,

        message:
          'Battle permanently deleted.',
      },
      {
        status: 200,

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
      '[BATTLE DELETE] Fatal error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to permanently delete battle.',

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