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

const DEFAULT_DURATION_MS = 24 * 60 * 60 * 1000;

type AnyRecord = Record<string, any>;

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const n = Number(value);

  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
}

function toPositiveNumber(value: unknown): number | null {
  const n = toNumber(value);

  if (n === null || n <= 0) {
    return null;
  }

  return n;
}

function getDurationMs(
  body: AnyRecord,
  fallbackMs = DEFAULT_DURATION_MS
): number {
  const durationMs = toPositiveNumber(body.durationMs);

  if (durationMs) {
    return durationMs;
  }

  const durationSeconds = toPositiveNumber(
    body.durationSeconds
  );

  if (durationSeconds) {
    return durationSeconds * 1000;
  }

  const durationMinutes = toPositiveNumber(
    body.durationMinutes
  );

  if (durationMinutes) {
    return durationMinutes * 60 * 1000;
  }

  const durationHours = toPositiveNumber(
    body.durationHours
  );

  if (durationHours) {
    return durationHours * 60 * 60 * 1000;
  }

  const durationDays = toPositiveNumber(
    body.durationDays
  );

  if (durationDays) {
    return durationDays * 24 * 60 * 60 * 1000;
  }

  return fallbackMs;
}

function getImageUrl(option: AnyRecord | null | undefined): string {
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
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getOptionLabel(
  option: AnyRecord | null | undefined
): string {
  if (!option || typeof option !== 'object') {
    return '';
  }

  const values = [
    option.label,
    option.name,
    option.title,
  ];

  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getOptionId(
  option: AnyRecord | null | undefined,
  fallbackPrefix: string
): string {
  if (
    option &&
    typeof option.id === 'string' &&
    option.id.trim()
  ) {
    return option.id.trim();
  }

  return `${fallbackPrefix}_${randomUUID()}`;
}

function normalizeOption(
  option: AnyRecord | null | undefined,
  fallbackPrefix: string,
  defaultEmoji: string
): AnyRecord {
  const source =
    option && typeof option === 'object'
      ? option
      : {};

  const label = getOptionLabel(source);

  const votes = toNumber(source.votes);

  return {
    ...source,

    id: getOptionId(
      source,
      fallbackPrefix
    ),

    label,

    name: label,

    tagline:
      typeof source.tagline === 'string'
        ? source.tagline.trim()
        : '',

    votes:
      votes !== null && votes >= 0
        ? votes
        : 0,

    emoji:
      typeof source.emoji === 'string' &&
      source.emoji.trim()
        ? source.emoji.trim()
        : defaultEmoji,

    imageUrl:
      getImageUrl(source),
  };
}

function getRawOption(
  battle: AnyRecord,
  side: 'A' | 'B'
): AnyRecord {
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

function getBattleStartsAt(
  battle: AnyRecord
): number {
  return (
    toNumber(battle.startsAt) ||
    toNumber(battle.starts_at) ||
    0
  );
}

function getBattleEndsAt(
  battle: AnyRecord
): number {
  return (
    toNumber(battle.endsAt) ||
    toNumber(battle.ends_at) ||
    0
  );
}

function isBattleExpired(
  battle: AnyRecord
): boolean {
  const endsAt = getBattleEndsAt(battle);

  return endsAt > 0 && Date.now() >= endsAt;
}

function isBattleEnded(
  battle: AnyRecord
): boolean {
  return (
    battle.isEnded === true ||
    battle.is_ended === true ||
    battle.status === 'closed' ||
    isBattleExpired(battle)
  );
}

function calculateWinner(
  battle: AnyRecord
): string | null {
  const optionA = normalizeOption(
    getRawOption(battle, 'A'),
    'option_a',
    '🔥'
  );

  const optionB = normalizeOption(
    getRawOption(battle, 'B'),
    'option_b',
    '⚡'
  );

  const aVotes = Number(optionA.votes || 0);
  const bVotes = Number(optionB.votes || 0);

  if (aVotes === bVotes) {
    return null;
  }

  return aVotes > bVotes
    ? optionA.id
    : optionB.id;
}

function finalizeBattle(
  battle: BattleEventStore
): boolean {
  if (!isBattleEnded(battle)) {
    return false;
  }

  const wasClosed =
    battle.isEnded === true &&
    battle.status === 'closed';

  const optionA = normalizeOption(
    battle.optionA as AnyRecord,
    'option_a',
    '🔥'
  );

  const optionB = normalizeOption(
    battle.optionB as AnyRecord,
    'option_b',
    '⚡'
  );

  battle.optionA = optionA as any;
  battle.optionB = optionB as any;

  battle.isEnded = true;
  battle.status = 'closed';

  const winner = calculateWinner(
    battle as any
  );

  battle.winnerOptionId =
    winner || undefined;

  return !wasClosed;
}

function formatBattle(
  battle: BattleEventStore
) {
  const optionA = normalizeOption(
    battle.optionA as AnyRecord,
    'option_a',
    '🔥'
  );

  const optionB = normalizeOption(
    battle.optionB as AnyRecord,
    'option_b',
    '⚡'
  );

  const startsAt = getBattleStartsAt(
    battle as any
  );

  const endsAt = getBattleEndsAt(
    battle as any
  );

  const ended = isBattleEnded(
    battle as any
  );

  const aVotes = Number(
    optionA.votes || 0
  );

  const bVotes = Number(
    optionB.votes || 0
  );

  const totalVotes =
    aVotes + bVotes;

  const tie =
    ended &&
    aVotes === bVotes;

  const winnerOptionId = tie
    ? null
    : battle.winnerOptionId || null;

  return {
    id: battle.id,

    title: battle.title,

    category:
      battle.category ||
      'Community',

    description:
      battle.description || '',

    optionA,

    optionB,

    options: [
      optionA,
      optionB,
    ],

    startsAt,

    endsAt,

    starts_at:
      startsAt > 0
        ? new Date(startsAt).toISOString()
        : null,

    ends_at:
      endsAt > 0
        ? new Date(endsAt).toISOString()
        : null,

    isEnded: ended,

    published:
      battle.published !== false,

    status: ended
      ? 'closed'
      : battle.status || 'active',

    winnerOptionId,

    isTie: tie,

    totalVotes,

    commentsClosed: ended,

    votersCount:
      battle.votedUserEmails instanceof Set
        ? battle.votedUserEmails.size
        : totalVotes,
  };
}

async function hydrateBattles() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const rows = await fetchSupabaseBattles();

  if (!Array.isArray(rows)) {
    return;
  }

  for (const raw of rows as AnyRecord[]) {
    if (!raw?.id) {
      continue;
    }

    const optionA = normalizeOption(
      getRawOption(raw, 'A'),
      'option_a',
      '🔥'
    );

    const optionB = normalizeOption(
      getRawOption(raw, 'B'),
      'option_b',
      '⚡'
    );

    const existing =
      contentStore.battles.get(
        String(raw.id)
      );

    if (existing) {
      existing.title =
        typeof raw.title === 'string'
          ? raw.title
          : '';

      existing.category =
        typeof raw.category === 'string'
          ? raw.category
          : 'Community';

      existing.description =
        typeof raw.description === 'string'
          ? raw.description
          : '';

      existing.optionA =
        optionA as any;

      existing.optionB =
        optionB as any;

      existing.startsAt =
        getBattleStartsAt(raw);

      existing.endsAt =
        getBattleEndsAt(raw);

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

    const battle = {
      id: String(raw.id),

      title:
        typeof raw.title === 'string'
          ? raw.title
          : '',

      category:
        typeof raw.category === 'string'
          ? raw.category
          : 'Community',

      description:
        typeof raw.description === 'string'
          ? raw.description
          : '',

      optionA: optionA as any,

      optionB: optionB as any,

      startsAt:
        getBattleStartsAt(raw),

      endsAt:
        getBattleEndsAt(raw),

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
      String(raw.id),
      battle
    );
  }
}

async function persistBattle(
  battle: BattleEventStore
) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const startsAt =
    getBattleStartsAt(
      battle as any
    );

  const endsAt =
    getBattleEndsAt(
      battle as any
    );

  if (
    startsAt <= 0 ||
    endsAt <= startsAt
  ) {
    throw new Error(
      'Invalid battle start/end time.'
    );
  }

  const optionA =
    normalizeOption(
      battle.optionA as AnyRecord,
      'option_a',
      '🔥'
    );

  const optionB =
    normalizeOption(
      battle.optionB as AnyRecord,
      'option_b',
      '⚡'
    );

  const payload = {
    id: battle.id,

    title:
      battle.title,

    category:
      battle.category ||
      'Community',

    description:
      battle.description || '',

    option_a: optionA,

    option_b: optionB,

    is_ended:
      battle.isEnded === true,

    starts_at:
      new Date(
        startsAt
      ).toISOString(),

    ends_at:
      new Date(
        endsAt
      ).toISOString(),

    published:
      battle.published !== false,

    status:
      battle.status || 'active',

    winner_option_id:
      battle.winnerOptionId ||
      null,
  };

  const { error } =
    await supabase
      .from('battles')
      .upsert(
        payload,
        {
          onConflict: 'id',
        }
      );

  if (error) {
    throw error;
  }
}

async function persistExpiredBattles() {
  for (
    const battle of
    contentStore.battles.values()
  ) {
    if (!isBattleExpired(battle as any)) {
      continue;
    }

    const changed =
      finalizeBattle(battle);

    if (
      changed &&
      isSupabaseConfigured()
    ) {
      try {
        await persistBattle(
          battle
        );
      } catch (error) {
        console.error(
          'Failed to persist expired battle:',
          error
        );
      }
    }
  }
}

export async function GET(
  req: NextRequest
) {
  try {
    const isAdmin =
      await verifyAdminRequestAsync(
        req
      );

    await hydrateBattles();

    await persistExpiredBattles();

    const battles =
      Array.from(
        contentStore.battles.values()
      )
        .filter((battle) => {
          if (isAdmin) {
            return true;
          }

          return battle.published !== false;
        })
        .map(formatBattle)
        .sort(
          (a, b) =>
            Number(b.startsAt || 0) -
            Number(a.startsAt || 0)
        );

    return NextResponse.json(
      {
        success: true,

        battles,

        battle:
          battles[0] || null,

        isAdmin,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
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
          'Unauthorized: Only site owner/admin can create Battles.',
      },
      {
        status: 403,
      }
    );
  }

  try {
    const body =
      (await req.json().catch(
        () => ({})
      )) as AnyRecord;

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

    const optionALabel =
      getOptionLabel(
        optionAInput
      );

    const optionBLabel =
      getOptionLabel(
        optionBInput
      );

    if (
      !title ||
      !optionALabel ||
      !optionBLabel
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle title, Option A name, and Option B name are required.',
        },
        {
          status: 400,
        }
      );
    }

    const startsAt =
      toPositiveNumber(
        body.startsAt
      ) ||
      toPositiveNumber(
        body.starts_at
      ) ||
      Date.now();

    const explicitEndsAt =
      toPositiveNumber(
        body.endsAt
      ) ||
      toPositiveNumber(
        body.ends_at
      );

    const durationMs =
      getDurationMs(body);

    const endsAt =
      explicitEndsAt ||
      startsAt +
        durationMs;

    if (endsAt <= startsAt) {
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

    if (endsAt <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Battle end time must be in the future.',
        },
        {
          status: 400,
        }
      );
    }

    const normalizedA =
      normalizeOption(
        {
          ...optionAInput,
          label: optionALabel,
        },
        'option_a',
        '🔥'
      );

    const normalizedB =
      normalizeOption(
        {
          ...optionBInput,
          label: optionBLabel,
        },
        'option_b',
        '⚡'
      );

    const battle = {
      id:
        `battle_${randomUUID()}`,

      title,

      category:
        category || 'Community',

      description:
        description ||
        'Vote for your favorite community participant!',

      optionA:
        normalizedA as any,

      optionB:
        normalizedB as any,

      isEnded: false,

      startsAt,

      endsAt,

      published:
        body.published !== false,

      status:
        'active',

      winnerOptionId:
        undefined,

      votedUserEmails:
        new Set<string>(),

      userVotes:
        new Map<string, string>(),
    } as BattleEventStore;

    if (isSupabaseConfigured()) {
      try {
        await persistBattle(
          battle
        );
      } catch (error: any) {
        console.error(
          'Battle Supabase create error:',
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Battle could not be saved permanently.',
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

    contentStore.battles.set(
      battle.id,
      battle
    );

    return NextResponse.json(
      {
        success: true,

        message:
          'Battle created successfully!',

        battle:
          formatBattle(
            battle
          ),
      },
      {
        status: 201,
        headers: {
          'Cache-Control':
            'no-store',
        },
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
          'Unauthorized: Only site owner/admin can manage Battles.',
      },
      {
        status: 403,
      }
    );
  }

  try {
    await hydrateBattles();

    const body =
      (await req.json().catch(
        () => ({})
      )) as AnyRecord;

    const id =
      typeof body.id === 'string'
        ? body.id.trim()
        : '';

    const action =
      typeof body.action === 'string'
        ? body.action.trim()
        : '';

    const updates =
      body.updates &&
      typeof body.updates === 'object'
        ? body.updates
        : {};

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

    if (action === 'toggle_publish') {
      battle.published =
        battle.published === false;
    } else if (action === 'start') {
      const oldDuration =
        Math.max(
          1000,
          getBattleEndsAt(
            battle as any
          ) -
            getBattleStartsAt(
              battle as any
            )
        );

      const now =
        Date.now();

      battle.startsAt =
        now;

      battle.endsAt =
        now + oldDuration;

      battle.isEnded =
        false;

      battle.status =
        'active';

      battle.winnerOptionId =
        undefined;
    } else if (
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
    } else {
      if (
        typeof updates.title === 'string' &&
        updates.title.trim()
      ) {
        battle.title =
          updates.title.trim();
      }

      if (
        typeof updates.category === 'string' &&
        updates.category.trim()
      ) {
        battle.category =
          updates.category.trim();
      }

      if (
        typeof updates.description === 'string'
      ) {
        battle.description =
          updates.description.trim();
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
            battle.optionA as AnyRecord,
            'option_a',
            '🔥'
          );

        const incoming =
          updates.optionA;

        const label =
          getOptionLabel(
            incoming
          ) ||
          current.label ||
          '';

        const imageUrl =
          getImageUrl(
            incoming
          ) ||
          getImageUrl(
            current
          );

        battle.optionA =
          {
            ...current,
            ...incoming,
            id: current.id,
            label,
            name: label,
            imageUrl,
            votes:
              Number(
                current.votes || 0
              ),
          } as any;
      }

      if (
        updates.optionB &&
        typeof updates.optionB === 'object'
      ) {
        const current =
          normalizeOption(
            battle.optionB as AnyRecord,
            'option_b',
            '⚡'
          );

        const incoming =
          updates.optionB;

        const label =
          getOptionLabel(
            incoming
          ) ||
          current.label ||
          '';

        const imageUrl =
          getImageUrl(
            incoming
          ) ||
          getImageUrl(
            current
          );

        battle.optionB =
          {
            ...current,
            ...incoming,
            id: current.id,
            label,
            name: label,
            imageUrl,
            votes:
              Number(
                current.votes || 0
              ),
          } as any;
      }

      const newStartsAt =
        toPositiveNumber(
          updates.startsAt
        ) ||
        toPositiveNumber(
          updates.starts_at
        );

      const newEndsAt =
        toPositiveNumber(
          updates.endsAt
        ) ||
        toPositiveNumber(
          updates.ends_at
        );

      if (newStartsAt) {
        battle.startsAt =
          newStartsAt;
      }

      if (newEndsAt) {
        battle.endsAt =
          newEndsAt;
      }

      const hasDuration =
        updates.durationMs != null ||
        updates.durationSeconds != null ||
        updates.durationMinutes != null ||
        updates.durationHours != null ||
        updates.durationDays != null;

      if (hasDuration) {
        const currentDuration =
          Math.max(
            1000,
            getBattleEndsAt(
              battle as any
            ) -
              getBattleStartsAt(
                battle as any
              )
          );

        const durationMs =
          getDurationMs(
            updates,
            currentDuration
          );

        const timerStart =
          newStartsAt ||
          getBattleStartsAt(
            battle as any
          ) ||
          Date.now();

        battle.startsAt =
          timerStart;

        battle.endsAt =
          timerStart +
          durationMs;

        battle.isEnded =
          false;

        battle.status =
          'active';

        battle.winnerOptionId =
          undefined;
      }

      if (
        typeof updates.isEnded === 'boolean'
      ) {
        battle.isEnded =
          updates.isEnded;

        if (battle.isEnded) {
          battle.status =
            'closed';

          battle.endsAt =
            Date.now();

          battle.winnerOptionId =
            calculateWinner(
              battle as any
            ) || undefined;
        }
      }
    }

    finalizeBattle(
      battle
    );

    if (isSupabaseConfigured()) {
      try {
        await persistBattle(
          battle
        );
      } catch (error: any) {
        console.error(
          'Battle Supabase update error:',
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Battle could not be saved.',
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

    return NextResponse.json(
      {
        success: true,

        message:
          'Battle updated successfully.',

        battle:
          formatBattle(
            battle
          ),
      },
      {
        headers: {
          'Cache-Control':
            'no-store',
        },
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

export async function DELETE(
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
          'Unauthorized: Only site owner/admin can delete Battles.',
      },
      {
        status: 403,
      }
    );
  }

  try {
    await hydrateBattles();

    const url =
      new URL(req.url);

    const id =
      url.searchParams
        .get('id')
        ?.trim();

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

    if (isSupabaseConfigured()) {
      const commentsResult =
        await supabase
          .from('battle_comments')
          .delete()
          .eq(
            'battle_id',
            id
          );

      if (commentsResult.error) {
        console.warn(
          'Battle comments delete warning:',
          commentsResult.error
        );
      }

      const votesResult =
        await supabase
          .from('battle_votes')
          .delete()
          .eq(
            'battle_id',
            id
          );

      if (votesResult.error) {
        console.warn(
          'Battle votes delete warning:',
          votesResult.error
        );
      }

      const battleResult =
        await supabase
          .from('battles')
          .delete()
          .eq(
            'id',
            id
          );

      if (battleResult.error) {
        console.error(
          'Battle delete error:',
          battleResult.error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'Failed to delete battle permanently.',
          },
          {
            status: 500,
          }
        );
      }
    }

    contentStore.battles.delete(
      id
    );

    return NextResponse.json(
      {
        success: true,

        deletedId: id,

        message:
          'Battle deleted permanently by admin.',
      }
    );
  } catch (error: any) {
    console.error(
      'Battle DELETE error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          'Failed to delete battle.',
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