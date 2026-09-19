import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { verifyAdminRequestAsync } from '@/lib/admin-auth';
import { contentStore, BattleEventStore } from '@/lib/content-store';
import {
  fetchSupabaseBattles,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_DURATION_MS = 24 * 60 * 60 * 1000;

function toMs(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function getDurationMs(body: any, fallbackMs = DEFAULT_DURATION_MS) {
  const durationMs = toMs(body?.durationMs);

  if (durationMs) {
    return durationMs;
  }

  const durationSeconds = toMs(body?.durationSeconds);

  if (durationSeconds) {
    return durationSeconds * 1000;
  }

  const durationMinutes = toMs(body?.durationMinutes);

  if (durationMinutes) {
    return durationMinutes * 60 * 1000;
  }

  const durationHours = toMs(body?.durationHours);

  if (durationHours) {
    return durationHours * 60 * 60 * 1000;
  }

  const durationDays = toMs(body?.durationDays);

  if (durationDays) {
    return durationDays * 24 * 60 * 60 * 1000;
  }

  return fallbackMs;
}

function getBattleEnded(battle: BattleEventStore) {
  return (
    battle.isEnded === true ||
    battle.status === 'closed' ||
    Date.now() >= Number(battle.endsAt || 0)
  );
}

function calculateWinner(battle: BattleEventStore) {
  const aVotes = Number(battle.optionA?.votes || 0);
  const bVotes = Number(battle.optionB?.votes || 0);

  if (aVotes === bVotes) {
    return null;
  }

  return aVotes > bVotes
    ? battle.optionA.id
    : battle.optionB.id;
}

function syncExpiredBattle(battle: BattleEventStore) {
  if (!getBattleEnded(battle)) {
    return;
  }

  battle.isEnded = true;
  battle.status = 'closed';

  const winner = calculateWinner(battle);

  if (winner) {
    battle.winnerOptionId = winner;
  } else {
    battle.winnerOptionId = undefined;
  }
}

function formatBattleAdmin(battle: BattleEventStore) {
  syncExpiredBattle(battle);

  const aVotes = Number(battle.optionA?.votes || 0);
  const bVotes = Number(battle.optionB?.votes || 0);

  const isTie =
    battle.isEnded &&
    aVotes === bVotes;

  return {
    id: battle.id,

    title: battle.title,
    category: battle.category,
    description: battle.description,

    optionA: {
      ...battle.optionA,
      votes: aVotes,
      imageUrl:
        battle.optionA?.imageUrl ||
        (battle.optionA as any)?.image_url ||
        '',
    },

    optionB: {
      ...battle.optionB,
      votes: bVotes,
      imageUrl:
        battle.optionB?.imageUrl ||
        (battle.optionB as any)?.image_url ||
        '',
    },

    startsAt: Number(battle.startsAt || 0),
    endsAt: Number(battle.endsAt || 0),

    isEnded: battle.isEnded,

    published: battle.published !== false,

    status: battle.isEnded
      ? 'closed'
      : battle.status || 'active',

    winnerOptionId: isTie
      ? undefined
      : battle.winnerOptionId || undefined,

    isTie,

    totalVotes: aVotes + bVotes,

    votersCount: battle.votedUserEmails?.size
      ? battle.votedUserEmails.size
      : aVotes + bVotes,

    commentsClosed: battle.isEnded,
  };
}

/**
 * Load Supabase battles into the local compatibility store.
 *
 * Supabase remains the permanent database.
 */
async function hydrateBattlesFromSupabase() {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const battles = await fetchSupabaseBattles();

    if (!battles) {
      return;
    }

    for (const battle of battles) {
      const existing = contentStore.battles.get(battle.id);

      if (existing) {
        /**
         * Keep existing runtime vote maps but refresh
         * persistent battle data.
         */
        existing.title = battle.title;
        existing.category = battle.category;
        existing.description = battle.description;
        existing.optionA = battle.optionA;
        existing.optionB = battle.optionB;
        existing.startsAt = battle.startsAt;
        existing.endsAt = battle.endsAt;
        existing.published = battle.published;
        existing.status = battle.status;
        existing.isEnded = battle.isEnded;
        existing.winnerOptionId = battle.winnerOptionId;

        continue;
      }

      contentStore.battles.set(battle.id, {
        ...battle,
        votedUserEmails: new Set<string>(),
        userVotes: new Map<string, string>(),
      });
    }
  } catch (error) {
    console.error(
      'Failed to hydrate battles from Supabase:',
      error
    );
  }
}

/**
 * Persist a battle to Supabase.
 */
async function persistBattle(battle: BattleEventStore) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const payload = {
    id: battle.id,
    title: battle.title,
    category: battle.category,
    description: battle.description,

    option_a: battle.optionA,
    option_b: battle.optionB,

    is_ended: battle.isEnded,

    starts_at: new Date(
      Number(battle.startsAt)
    ).toISOString(),

    ends_at: new Date(
      Number(battle.endsAt)
    ).toISOString(),

    published: battle.published !== false,

    status: battle.status || 'active',

    winner_option_id:
      battle.winnerOptionId || null,
  };

  const { error } = await supabase
    .from('battles')
    .upsert(payload, {
      onConflict: 'id',
    });

  if (error) {
    throw error;
  }
}

/**
 * GET
 *
 * Public:
 * - published battles
 *
 * Admin:
 * - all battles
 */
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequestAsync(req);

    await hydrateBattlesFromSupabase();

    /**
     * Automatically mark expired battles as closed.
     * The battle itself is NOT deleted.
     */
    for (const battle of contentStore.battles.values()) {
      if (getBattleEnded(battle) && !battle.isEnded) {
        syncExpiredBattle(battle);

        if (isSupabaseConfigured()) {
          try {
            await persistBattle(battle);
          } catch (error) {
            console.warn(
              'Failed to persist expired battle:',
              error
            );
          }
        }
      }
    }

    const battles = Array.from(
      contentStore.battles.values()
    )
      .filter((battle) =>
        isAdmin
          ? true
          : battle.published !== false
      )
      .map(formatBattleAdmin)
      .reverse();

    return NextResponse.json(
      {
        success: true,
        battles,
        isAdmin,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
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
 * Admin creates a battle.
 *
 * Supports:
 * durationMs
 * durationSeconds
 * durationMinutes
 * durationHours
 * durationDays
 *
 * Also supports explicit startsAt / endsAt.
 */
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error:
          'Unauthorized: Only site owner/admin can create Battles.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));

    const {
      title,
      category,
      description,
      optionA,
      optionB,
      startsAt,
      endsAt,
      published = true,
    } = body;

    if (
      !title?.trim() ||
      !optionA?.label?.trim() ||
      !optionB?.label?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'Battle title, Option A label, and Option B label are required.',
        },
        { status: 400 }
      );
    }

    const parsedStartsAt =
      toMs(startsAt) || Date.now();

    /**
     * If admin supplied endsAt, use it.
     * Otherwise calculate it from selected duration.
     */
    const explicitEndsAt = toMs(endsAt);

    const durationMs = getDurationMs(body);

    const parsedEndsAt =
      explicitEndsAt ||
      parsedStartsAt + durationMs;

    if (parsedEndsAt <= parsedStartsAt) {
      return NextResponse.json(
        {
          error:
            'Battle end time must be after start time.',
        },
        { status: 400 }
      );
    }

    const id = `battle_${randomUUID()}`;

    const optionAId =
      typeof optionA.id === 'string' &&
      optionA.id.trim()
        ? optionA.id.trim()
        : `option_a_${randomUUID()}`;

    const optionBId =
      typeof optionB.id === 'string' &&
      optionB.id.trim()
        ? optionB.id.trim()
        : `option_b_${randomUUID()}`;

    const newBattle: BattleEventStore = {
      id,

      title: title.trim(),

      category:
        category?.trim() ||
        'Community Clash ⚔️',

      description:
        description?.trim() ||
        'Vote for your favorite community champion!',

      optionA: {
        id: optionAId,

        label: optionA.label.trim(),

        tagline:
          optionA.tagline?.trim() || '',

        votes: 0,

        emoji:
          optionA.emoji || '🔥',

        /**
         * Real uploaded image URL.
         *
         * This can be Supabase Storage,
         * Cloudflare R2, or another public image URL.
         */
        imageUrl:
          optionA.imageUrl ||
          optionA.image_url ||
          '',
      },

      optionB: {
        id: optionBId,

        label: optionB.label.trim(),

        tagline:
          optionB.tagline?.trim() || '',

        votes: 0,

        emoji:
          optionB.emoji || '⚡',

        imageUrl:
          optionB.imageUrl ||
          optionB.image_url ||
          '',
      },

      isEnded: false,

      startsAt: parsedStartsAt,

      endsAt: parsedEndsAt,

      published: Boolean(published),

      status: 'active',

      votedUserEmails:
        new Set<string>(),

      userVotes:
        new Map<string, string>(),
    };

    /**
     * Do not create an already-expired active battle.
     */
    if (parsedEndsAt <= Date.now()) {
      return NextResponse.json(
        {
          error:
            'Battle end time must be in the future.',
        },
        { status: 400 }
      );
    }

    /**
     * Save to memory for compatibility.
     */
    contentStore.battles.set(
      id,
      newBattle
    );

    /**
     * Save permanently to Supabase.
     */
    if (isSupabaseConfigured()) {
      try {
        await persistBattle(newBattle);
      } catch (error: any) {
        /**
         * Roll back memory if database creation failed.
         */
        contentStore.battles.delete(id);

        console.error(
          'Battle Supabase insert error:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Battle could not be saved permanently.',
            details:
              process.env.NODE_ENV ===
              'development'
                ? error?.message
                : undefined,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,

      message:
        'Battle created successfully!',

      battle:
        formatBattleAdmin(newBattle),
    });
  } catch (error: any) {
    console.error(
      'Battle POST error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to create battle.',
        details:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT
 *
 * Admin actions:
 *
 * toggle_publish
 * start
 * end
 * close
 *
 * Or updates:
 * title
 * category
 * description
 * images
 * timer
 * publish state
 */
export async function PUT(req: NextRequest) {
  const isAdmin =
    await verifyAdminRequestAsync(req);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error:
          'Unauthorized: Only site owner/admin can manage Battles.',
      },
      { status: 403 }
    );
  }

  try {
    await hydrateBattlesFromSupabase();

    const body =
      await req.json().catch(() => ({}));

    const {
      id,
      action,
      updates = {},
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Battle id is required.',
        },
        { status: 400 }
      );
    }

    const battle =
      contentStore.battles.get(id);

    if (!battle) {
      return NextResponse.json(
        {
          error: 'Battle not found.',
        },
        { status: 404 }
      );
    }

    /**
     * Publish / unpublish.
     */
    if (action === 'toggle_publish') {
      battle.published =
        battle.published === false;
    }

    /**
     * Start / restart battle.
     */
    else if (action === 'start') {
      const now = Date.now();

      let durationMs =
        Number(battle.endsAt) -
        Number(battle.startsAt);

      if (
        !Number.isFinite(durationMs) ||
        durationMs <= 0
      ) {
        durationMs =
          DEFAULT_DURATION_MS;
      }

      battle.startsAt = now;
      battle.endsAt =
        now + durationMs;

      battle.isEnded = false;
      battle.status = 'active';
      battle.winnerOptionId =
        undefined;
    }

    /**
     * End manually.
     */
    else if (
      action === 'end' ||
      action === 'close'
    ) {
      battle.isEnded = true;
      battle.status = 'closed';
      battle.endsAt = Date.now();

      battle.winnerOptionId =
        calculateWinner(battle) ||
        undefined;
    }

    /**
     * Update fields.
     */
    else if (updates) {
      if (
        typeof updates.title === 'string' &&
        updates.title.trim()
      ) {
        battle.title =
          updates.title.trim();
      }

      if (
        typeof updates.category ===
          'string' &&
        updates.category.trim()
      ) {
        battle.category =
          updates.category.trim();
      }

      if (
        typeof updates.description ===
          'string'
      ) {
        battle.description =
          updates.description.trim();
      }

      if (
        typeof updates.published ===
        'boolean'
      ) {
        battle.published =
          updates.published;
      }

      if (
        updates.optionA &&
        typeof updates.optionA ===
          'object'
      ) {
        battle.optionA = {
          ...battle.optionA,
          ...updates.optionA,

          imageUrl:
            updates.optionA.imageUrl ??
            updates.optionA.image_url ??
            battle.optionA.imageUrl ??
            '',
        };
      }

      if (
        updates.optionB &&
        typeof updates.optionB ===
          'object'
      ) {
        battle.optionB = {
          ...battle.optionB,
          ...updates.optionB,

          imageUrl:
            updates.optionB.imageUrl ??
            updates.optionB.image_url ??
            battle.optionB.imageUrl ??
            '',
        };
      }

      /**
       * Change start/end directly.
       */
      const newStartsAt =
        toMs(updates.startsAt);

      const newEndsAt =
        toMs(updates.endsAt);

      if (newStartsAt) {
        battle.startsAt =
          newStartsAt;
      }

      if (newEndsAt) {
        battle.endsAt =
          newEndsAt;
      }

      /**
       * Change timer duration.
       */
      const hasDuration =
        updates.durationMs != null ||
        updates.durationSeconds != null ||
        updates.durationMinutes != null ||
        updates.durationHours != null ||
        updates.durationDays != null;

      if (hasDuration) {
        const durationMs =
          getDurationMs(
            updates,
            Math.max(
              1000,
              Number(battle.endsAt) -
                Number(battle.startsAt)
            )
          );

        const timerStart =
          newStartsAt ||
          Number(battle.startsAt) ||
          Date.now();

        battle.startsAt =
          timerStart;

        battle.endsAt =
          timerStart + durationMs;

        battle.isEnded = false;
        battle.status = 'active';
        battle.winnerOptionId =
          undefined;
      }

      /**
       * Explicit isEnded control.
       */
      if (
        typeof updates.isEnded ===
        'boolean'
      ) {
        battle.isEnded =
          updates.isEnded;

        if (battle.isEnded) {
          battle.status =
            'closed';

          battle.endsAt =
            Math.min(
              Number(battle.endsAt),
              Date.now()
            );

          battle.winnerOptionId =
            calculateWinner(battle) ||
            undefined;
        }
      }
    }

    /**
     * Automatic expiration.
     */
    syncExpiredBattle(battle);

    /**
     * Persist changes.
     */
    if (isSupabaseConfigured()) {
      try {
        await persistBattle(battle);
      } catch (error: any) {
        console.error(
          'Battle Supabase update error:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Battle could not be saved.',
            details:
              process.env.NODE_ENV ===
              'development'
                ? error?.message
                : undefined,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,

      message:
        'Battle updated successfully.',

      battle:
        formatBattleAdmin(battle),
    });
  } catch (error: any) {
    console.error(
      'Battle PUT error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to update battle.',
        details:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * Only Super Admin can delete through
 * verifyAdminRequestAsync.
 *
 * Battle, votes and comments are deleted
 * only when admin explicitly deletes the battle.
 *
 * Timer expiry NEVER deletes the battle.
 */
export async function DELETE(req: NextRequest) {
  const isAdmin =
    await verifyAdminRequestAsync(req);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error:
          'Unauthorized: Only site owner/admin can delete Battles.',
      },
      { status: 403 }
    );
  }

  try {
    await hydrateBattlesFromSupabase();

    const { searchParams } =
      new URL(req.url);

    const id =
      searchParams.get('id')?.trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Battle id is required.',
        },
        { status: 400 }
      );
    }

    const battle =
      contentStore.battles.get(id);

    if (!battle) {
      return NextResponse.json(
        {
          error:
            'Battle not found.',
        },
        { status: 404 }
      );
    }

    /**
     * Delete comments first.
     */
    if (isSupabaseConfigured()) {
      const { error: commentsError } =
        await supabase
          .from('battle_comments')
          .delete()
          .eq('battle_id', id);

      if (commentsError) {
        console.warn(
          'Battle comments delete warning:',
          commentsError
        );
      }

      /**
       * Delete votes.
       */
      const { error: votesError } =
        await supabase
          .from('battle_votes')
          .delete()
          .eq('battle_id', id);

      if (votesError) {
        console.warn(
          'Battle votes delete warning:',
          votesError
        );
      }

      /**
       * Delete battle itself.
       */
      const { error: battleError } =
        await supabase
          .from('battles')
          .delete()
          .eq('id', id);

      if (battleError) {
        console.error(
          'Battle delete error:',
          battleError
        );

        return NextResponse.json(
          {
            error:
              'Failed to delete battle permanently.',
          },
          { status: 500 }
        );
      }
    }

    contentStore.battles.delete(id);

    return NextResponse.json({
      success: true,

      deletedId: id,

      message:
        'Battle deleted permanently by admin.',
    });
  } catch (error: any) {
    console.error(
      'Battle DELETE error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Failed to delete battle.',
        details:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}