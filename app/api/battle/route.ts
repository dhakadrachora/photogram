from pathlib import Path

code = r'''import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

import { verifyAdminRequestAsync } from "@/lib/admin-auth";
import { contentStore } from "@/lib/content-store";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://zlngcbefvdtbihndaeun.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

type AnyRecord = Record<string, any>;

type BattleOption = {
  id: string;
  name: string;
  imageUrl?: string;
  image_url?: string;
  votes?: number;
};

type BattleRecord = {
  id: string;
  title?: string;
  question?: string;
  optionA: BattleOption;
  optionB: BattleOption;
  option_a?: BattleOption;
  option_b?: BattleOption;
  durationMinutes?: number;
  startsAt?: string;
  endsAt?: string;
  starts_at?: string;
  ends_at?: string;
  status?: string;
  published?: boolean;
  isPublished?: boolean;
  isEnded?: boolean;
  winnerOptionId?: string;
  winner_option_id?: string | null;
  totalVotes?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

function getDatabaseClient(preferAdmin = false): SupabaseClient {
  if (preferAdmin && SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return supabase;
}

function getAdminDatabaseClient(): SupabaseClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add the server-side Supabase service role key to your environment variables."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });
}

function cleanString(value: any): string {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrl(option: AnyRecord): string {
  return cleanString(
    option?.imageUrl ??
      option?.image_url ??
      option?.image ??
      option?.photoUrl ??
      option?.photo_url ??
      ""
  );
}

function normalizeOption(
  option: AnyRecord,
  fallbackId: string,
  fallbackName: string
): BattleOption {
  const source = option || {};

  const id =
    cleanString(source.id) ||
    cleanString(source.optionId) ||
    cleanString(source.option_id) ||
    fallbackId;

  const name =
    cleanString(source.name) ||
    cleanString(source.title) ||
    cleanString(source.label) ||
    fallbackName;

  const imageUrl = getImageUrl(source);

  const votes =
    typeof source.votes === "number" && Number.isFinite(source.votes)
      ? source.votes
      : 0;

  return {
    id,
    name,
    imageUrl: imageUrl || undefined,
    image_url: imageUrl || undefined,
    votes,
  };
}

function normalizeBattle(row: AnyRecord): BattleRecord {
  const optionA = normalizeOption(
    row.option_a ?? row.optionA ?? {},
    "option_a",
    "Option A"
  );

  const optionB = normalizeOption(
    row.option_b ?? row.optionB ?? {},
    "option_b",
    "Option B"
  );

  const startsAt =
    cleanString(row.starts_at) ||
    cleanString(row.startsAt) ||
    cleanString(row.start_time) ||
    cleanString(row.startTime);

  const endsAt =
    cleanString(row.ends_at) ||
    cleanString(row.endsAt) ||
    cleanString(row.end_time) ||
    cleanString(row.endTime);

  const status = cleanString(row.status) || "active";

  const published =
    typeof row.published === "boolean"
      ? row.published
      : typeof row.is_published === "boolean"
        ? row.is_published
        : typeof row.isPublished === "boolean"
          ? row.isPublished
          : true;

  const winnerOptionId =
    cleanString(row.winner_option_id) ||
    cleanString(row.winnerOptionId) ||
    "";

  const durationMinutes =
    typeof row.duration_minutes === "number"
      ? row.duration_minutes
      : typeof row.durationMinutes === "number"
        ? row.durationMinutes
        : undefined;

  const createdAt =
    cleanString(row.created_at) ||
    cleanString(row.createdAt) ||
    new Date().toISOString();

  const updatedAt =
    cleanString(row.updated_at) ||
    cleanString(row.updatedAt) ||
    createdAt;

  const endTimestamp = endsAt
    ? new Date(endsAt).getTime()
    : NaN;

  const isEnded =
    status === "closed" ||
    status === "ended" ||
    Boolean(row.is_ended) ||
    Boolean(row.isEnded) ||
    (Number.isFinite(endTimestamp) &&
      endTimestamp <= Date.now());

  return {
    ...row,
    id: cleanString(row.id),

    title:
      cleanString(row.title) ||
      cleanString(row.question) ||
      "Battle",

    question:
      cleanString(row.question) ||
      cleanString(row.title) ||
      "Battle",

    optionA,
    optionB,
    option_a: optionA,
    option_b: optionB,

    durationMinutes,

    startsAt: startsAt || undefined,
    endsAt: endsAt || undefined,
    starts_at: startsAt || undefined,
    ends_at: endsAt || undefined,

    status: isEnded ? "closed" : status,

    published,
    isPublished: published,

    isEnded,

    winnerOptionId:
      winnerOptionId || undefined,

    winner_option_id:
      winnerOptionId || null,

    totalVotes:
      Number(optionA.votes || 0) +
      Number(optionB.votes || 0),

    createdAt,
    created_at: createdAt,

    updatedAt,
    updated_at: updatedAt,
  };
}

function getDurationMinutes(body: AnyRecord): number {
  const value =
    Number(body.durationMinutes) ||
    Number(body.duration_minutes) ||
    Number(body.duration) ||
    10;

  if (!Number.isFinite(value) || value <= 0) {
    return 10;
  }

  return Math.max(1, Math.round(value));
}

function getStartTime(body: AnyRecord): string {
  const raw =
    cleanString(body.startsAt) ||
    cleanString(body.starts_at) ||
    cleanString(body.startTime) ||
    cleanString(body.start_time);

  if (raw) {
    const timestamp = new Date(raw);

    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp.toISOString();
    }
  }

  return new Date().toISOString();
}

function calculateEndTime(
  startsAt: string,
  durationMinutes: number
): string {
  const start = new Date(startsAt);

  if (Number.isNaN(start.getTime())) {
    return new Date(
      Date.now() + durationMinutes * 60 * 1000
    ).toISOString();
  }

  return new Date(
    start.getTime() + durationMinutes * 60 * 1000
  ).toISOString();
}

function getEndTime(
  body: AnyRecord,
  startsAt: string,
  durationMinutes: number
): string {
  const rawEnd =
    cleanString(body.endsAt) ||
    cleanString(body.ends_at);

  if (rawEnd) {
    const endDate = new Date(rawEnd);

    if (!Number.isNaN(endDate.getTime())) {
      return endDate.toISOString();
    }
  }

  return calculateEndTime(
    startsAt,
    durationMinutes
  );
}

function isBattleExpired(
  battle: BattleRecord
): boolean {
  if (
    battle.status === "closed" ||
    battle.status === "ended" ||
    battle.isEnded
  ) {
    return true;
  }

  const endsAt = battle.endsAt;

  if (
    endsAt == null ||
    endsAt === ""
  ) {
    return false;
  }

  const endTimestamp =
    new Date(endsAt).getTime();

  return (
    Number.isFinite(endTimestamp) &&
    endTimestamp <= Date.now()
  );
}

function getWinnerOptionId(
  battle: BattleRecord
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

function finalizeBattle(
  battle: BattleRecord
): boolean {
  if (!isBattleExpired(battle)) {
    return false;
  }

  const winner =
    getWinnerOptionId(battle);

  battle.status = "closed";
  battle.isEnded = true;

  battle.winnerOptionId =
    winner || undefined;

  battle.winner_option_id =
    winner;

  battle.totalVotes =
    Number(
      battle.optionA?.votes || 0
    ) +
    Number(
      battle.optionB?.votes || 0
    );

  battle.updatedAt =
    new Date().toISOString();

  battle.updated_at =
    battle.updatedAt;

  return true;
}

function getBattleDbRow(
  battle: BattleRecord
): AnyRecord {
  const optionA =
    normalizeOption(
      battle.optionA || {},
      "option_a",
      "Option A"
    );

  const optionB =
    normalizeOption(
      battle.optionB || {},
      "option_b",
      "Option B"
    );

  return {
    id: battle.id,

    title:
      battle.title ||
      battle.question ||
      "Battle",

    question:
      battle.question ||
      battle.title ||
      "Battle",

    option_a: {
      ...optionA,
      imageUrl:
        optionA.imageUrl || null,
      image_url:
        optionA.imageUrl || null,
      votes:
        Number(optionA.votes || 0),
    },

    option_b: {
      ...optionB,
      imageUrl:
        optionB.imageUrl || null,
      image_url:
        optionB.imageUrl || null,
      votes:
        Number(optionB.votes || 0),
    },

    duration_minutes:
      typeof battle.durationMinutes ===
      "number"
        ? battle.durationMinutes
        : null,

    starts_at:
      battle.startsAt || null,

    ends_at:
      battle.endsAt || null,

    status:
      battle.status === "ended"
        ? "closed"
        : battle.status || "active",

    published:
      typeof battle.published ===
      "boolean"
        ? battle.published
        : true,

    winner_option_id:
      battle.winnerOptionId ||
      battle.winner_option_id ||
      null,

    is_ended:
      Boolean(battle.isEnded),

    created_at:
      battle.createdAt ||
      battle.created_at ||
      new Date().toISOString(),

    updated_at:
      battle.updatedAt ||
      battle.updated_at ||
      new Date().toISOString(),
  };
}

async function fetchDatabaseBattles(): Promise<
  BattleRecord[]
> {
  const db =
    getDatabaseClient(
      Boolean(
        SUPABASE_SERVICE_ROLE_KEY
      )
    );

  const {
    data,
    error,
  } = await db
    .from("battles")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load battles from Supabase: ${error.message}`
    );
  }

  return (data || [])
    .map((row: AnyRecord) =>
      normalizeBattle(row)
    )
    .filter((battle) =>
      Boolean(battle.id)
    );
}

async function hydrateBattles(): Promise<
  BattleRecord[]
> {
  const databaseBattles =
    await fetchDatabaseBattles();

  const dbIds = new Set(
    databaseBattles.map(
      (battle) => battle.id
    )
  );

  const runtimeBattles =
    (contentStore as any).battles;

  if (
    runtimeBattles instanceof Map
  ) {
    for (
      const runtimeId of Array.from(
        runtimeBattles.keys()
      )
    ) {
      if (
        !dbIds.has(
          String(runtimeId)
        )
      ) {
        runtimeBattles.delete(
          runtimeId
        );
      }
    }

    for (
      const battle of databaseBattles
    ) {
      runtimeBattles.set(
        battle.id,
        battle
      );
    }

    return Array.from(
      runtimeBattles.values()
    ) as BattleRecord[];
  }

  return databaseBattles;
}

async function persistBattle(
  battle: BattleRecord
): Promise<void> {
  const db =
    getDatabaseClient(
      Boolean(
        SUPABASE_SERVICE_ROLE_KEY
      )
    );

  const row =
    getBattleDbRow(battle);

  const {
    error,
  } = await db
    .from("battles")
    .upsert(row, {
      onConflict: "id",
    });

  if (error) {
    throw new Error(
      `Failed to save battle: ${error.message}`
    );
  }
}

async function removeBattleFromRuntime(
  battleId: string
): Promise<void> {
  const runtimeBattles =
    (contentStore as any).battles;

  if (
    runtimeBattles instanceof Map
  ) {
    runtimeBattles.delete(
      battleId
    );
  }

  const store =
    contentStore as any;

  if (
    typeof store.deleteBattle ===
    "function"
  ) {
    try {
      await store.deleteBattle(
        battleId
      );
    } catch {
      // Ignore runtime cleanup errors.
    }
  }

  if (
    typeof store.removeBattle ===
    "function"
  ) {
    try {
      await store.removeBattle(
        battleId
      );
    } catch {
      // Ignore runtime cleanup errors.
    }
  }
}

function formatBattle(
  battle: BattleRecord
): AnyRecord {
  const optionA =
    normalizeOption(
      battle.optionA || {},
      "option_a",
      "Option A"
    );

  const optionB =
    normalizeOption(
      battle.optionB || {},
      "option_b",
      "Option B"
    );

  const ended =
    isBattleExpired(
      battle
    );

  const winnerOptionId =
    battle.winnerOptionId ||
    battle.winner_option_id ||
    (
      ended
        ? getWinnerOptionId(
            battle
          )
        : null
    );

  const totalVotes =
    Number(optionA.votes || 0) +
    Number(optionB.votes || 0);

  return {
    id: battle.id,

    title:
      battle.title ||
      battle.question ||
      "Battle",

    question:
      battle.question ||
      battle.title ||
      "Battle",

    optionA,
    optionB,

    durationMinutes:
      battle.durationMinutes,

    startsAt:
      battle.startsAt,

    endsAt:
      battle.endsAt,

    status:
      ended
        ? "closed"
        : battle.status ||
          "active",

    published:
      typeof battle.published ===
      "boolean"
        ? battle.published
        : true,

    isPublished:
      typeof battle.published ===
      "boolean"
        ? battle.published
        : true,

    isEnded:
      ended,

    winnerOptionId:
      winnerOptionId || null,

    totalVotes,

    commentsClosed:
      ended,

    createdAt:
      battle.createdAt ||
      battle.created_at,

    updatedAt:
      battle.updatedAt ||
      battle.updated_at,
  };
}

async function finalizeExpiredBattles(
  battles: BattleRecord[]
): Promise<void> {
  for (
    const battle of battles
  ) {
    if (
      !isBattleExpired(
        battle
      )
    ) {
      continue;
    }

    const changed =
      finalizeBattle(
        battle
      );

    if (!changed) {
      continue;
    }

    try {
      await persistBattle(
        battle
      );
    } catch (error) {
      console.error(
        "[BATTLE] Failed to persist expired battle:",
        error
      );
    }
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
      Boolean(
        await verifyAdminRequestAsync(
          req
        )
      );

    const battles =
      await hydrateBattles();

    await finalizeExpiredBattles(
      battles
    );

    const refreshedBattles =
      await hydrateBattles();

    const visibleBattles =
      refreshedBattles
        .filter((battle) => {
          if (isAdmin) {
            return true;
          }

          const published =
            typeof battle.published ===
            "boolean"
              ? battle.published
              : true;

          return published;
        })
        .map(formatBattle);

    return jsonResponse({
      success: true,
      battles:
        visibleBattles,
    });
  } catch (error: any) {
    console.error(
      "[BATTLE GET ERROR]",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error?.message ||
          "Failed to load battles.",
      },
      500
    );
  }
}

/* =========================================================
   POST - CREATE BATTLE
   ========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    const isAdmin =
      Boolean(
        await verifyAdminRequestAsync(
          req
        )
      );

    if (!isAdmin) {
      return jsonResponse(
        {
          success: false,
          error:
            "Admin access required.",
        },
        403
      );
    }

    const body =
      await req.json();

    const title =
      cleanString(body.title) ||
      cleanString(body.question) ||
      "Battle";

    const question =
      cleanString(body.question) ||
      title;

    const optionA =
      normalizeOption(
        body.optionA ??
          body.option_a ??
          body.a ??
          {},
        "option_a",
        "Option A"
      );

    const optionB =
      normalizeOption(
        body.optionB ??
          body.option_b ??
          body.b ??
          {},
        "option_b",
        "Option B"
      );

    const durationMinutes =
      getDurationMinutes(body);

    const startsAt =
      getStartTime(body);

    const endsAt =
      getEndTime(
        body,
        startsAt,
        durationMinutes
      );

    const battleId =
      cleanString(body.id) ||
      `battle_${crypto.randomUUID()}`;

    const published =
      typeof body.published ===
      "boolean"
        ? body.published
        : typeof body.isPublished ===
            "boolean"
          ? body.isPublished
          : true;

    const now =
      new Date().toISOString();

    const battle: BattleRecord = {
      id: battleId,

      title,
      question,

      optionA: {
        ...optionA,
        votes: 0,
      },

      optionB: {
        ...optionB,
        votes: 0,
      },

      durationMinutes,

      startsAt,
      endsAt,

      status:
        "active",

      published,
      isPublished:
        published,

      isEnded:
        false,

      winnerOptionId:
        undefined,

      winner_option_id:
        null,

      totalVotes:
        0,

      createdAt:
        now,

      updatedAt:
        now,
    };

    await persistBattle(
      battle
    );

    const runtimeBattles =
      (contentStore as any)
        .battles;

    if (
      runtimeBattles instanceof Map
    ) {
      runtimeBattles.set(
        battle.id,
        battle
      );
    }

    return jsonResponse(
      {
        success: true,
        battle:
          formatBattle(
            battle
          ),
      },
      201
    );
  } catch (error: any) {
    console.error(
      "[BATTLE POST ERROR]",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error?.message ||
          "Failed to create battle.",
      },
      500
    );
  }
}

/* =========================================================
   PUT - UPDATE BATTLE
   ========================================================= */

export async function PUT(
  req: NextRequest
) {
  try {
    const isAdmin =
      Boolean(
        await verifyAdminRequestAsync(
          req
        )
      );

    if (!isAdmin) {
      return jsonResponse(
        {
          success: false,
          error:
            "Admin access required.",
        },
        403
      );
    }

    const body =
      await req.json();

    const battleId =
      cleanString(body.id) ||
      cleanString(body.battleId) ||
      cleanString(body.battle_id);

    if (!battleId) {
      return jsonResponse(
        {
          success: false,
          error:
            "Battle ID is required.",
        },
        400
      );
    }

    const battles =
      await hydrateBattles();

    const battle =
      battles.find(
        (item) =>
          item.id ===
          battleId
      );

    if (!battle) {
      return jsonResponse(
        {
          success: false,
          error:
            "Battle not found.",
        },
        404
      );
    }

    if (
      typeof body.title ===
        "string" &&
      cleanString(
        body.title
      )
    ) {
      battle.title =
        cleanString(
          body.title
        );
    }

    if (
      typeof body.question ===
        "string" &&
      cleanString(
        body.question
      )
    ) {
      battle.question =
        cleanString(
          body.question
        );
    }

    if (
      body.optionA ||
      body.option_a
    ) {
      const incoming =
        normalizeOption(
          body.optionA ??
            body.option_a,
          battle.optionA.id,
          battle.optionA.name
        );

      battle.optionA = {
        ...battle.optionA,
        ...incoming,

        imageUrl:
          incoming.imageUrl ||
          battle.optionA
            .imageUrl,

        image_url:
          incoming.imageUrl ||
          battle.optionA
            .imageUrl,

        votes:
          battle.optionA
            .votes || 0,
      };
    }

    if (
      body.optionB ||
      body.option_b
    ) {
      const incoming =
        normalizeOption(
          body.optionB ??
            body.option_b,
          battle.optionB.id,
          battle.optionB.name
        );

      battle.optionB = {
        ...battle.optionB,
        ...incoming,

        imageUrl:
          incoming.imageUrl ||
          battle.optionB
            .imageUrl,

        image_url:
          incoming.imageUrl ||
          battle.optionB
            .imageUrl,

        votes:
          battle.optionB
            .votes || 0,
      };
    }

    if (
      typeof body.published ===
      "boolean"
    ) {
      battle.published =
        body.published;

      battle.isPublished =
        body.published;
    }

    if (
      typeof body.isPublished ===
      "boolean"
    ) {
      battle.published =
        body.isPublished;

      battle.isPublished =
        body.isPublished;
    }

    if (
      body.durationMinutes !==
        undefined ||
      body.duration_minutes !==
        undefined
    ) {
      const duration =
        getDurationMinutes(
          body
        );

      battle.durationMinutes =
        duration;

      if (
        body.endsAt ===
          undefined &&
        body.ends_at ===
          undefined
      ) {
        const start =
          battle.startsAt ||
          new Date().toISOString();

        battle.endsAt =
          calculateEndTime(
            start,
            duration
          );

        battle.ends_at =
          battle.endsAt;
      }
    }

    if (
      body.startsAt ||
      body.starts_at
    ) {
      const startsAt =
        getStartTime(body);

      battle.startsAt =
        startsAt;

      battle.starts_at =
        startsAt;
    }

    if (
      body.endsAt ||
      body.ends_at
    ) {
      const rawEnd =
        cleanString(
          body.endsAt ||
            body.ends_at
        );

      const endDate =
        new Date(rawEnd);

      if (
        !Number.isNaN(
          endDate.getTime()
        )
      ) {
        battle.endsAt =
          endDate.toISOString();

        battle.ends_at =
          battle.endsAt;
      }
    }

    if (
      body.status ===
        "closed" ||
      body.status ===
        "ended"
    ) {
      battle.status =
        "closed";

      battle.isEnded =
        true;

      battle.winnerOptionId =
        getWinnerOptionId(
          battle
        ) || undefined;

      battle.winner_option_id =
        battle.winnerOptionId ||
        null;
    }

    if (
      body.status ===
      "active"
    ) {
      battle.status =
        "active";

      battle.isEnded =
        false;

      battle.winnerOptionId =
        undefined;

      battle.winner_option_id =
        null;
    }

    finalizeBattle(
      battle
    );

    battle.totalVotes =
      Number(
        battle.optionA.votes ||
          0
      ) +
      Number(
        battle.optionB.votes ||
          0
      );

    battle.updatedAt =
      new Date().toISOString();

    battle.updated_at =
      battle.updatedAt;

    await persistBattle(
      battle
    );

    const runtimeBattles =
      (contentStore as any)
        .battles;

    if (
      runtimeBattles instanceof Map
    ) {
      runtimeBattles.set(
        battle.id,
        battle
      );
    }

    return jsonResponse({
      success: true,
      battle:
        formatBattle(
          battle
        ),
    });
  } catch (error: any) {
    console.error(
      "[BATTLE PUT ERROR]",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error?.message ||
          "Failed to update battle.",
      },
      500
    );
  }
}

/* =========================================================
   DELETE - PERMANENTLY DELETE BATTLE
   ========================================================= */

export async function DELETE(
  req: NextRequest
) {
  try {
    const isAdmin =
      Boolean(
        await verifyAdminRequestAsync(
          req
        )
      );

    if (!isAdmin) {
      return jsonResponse(
        {
          success: false,
          error:
            "Admin access required.",
        },
        403
      );
    }

    const body =
      await req.json().catch(
        () => ({})
      );

    const url =
      new URL(req.url);

    const battleId =
      cleanString(body.id) ||
      cleanString(
        body.battleId
      ) ||
      cleanString(
        body.battle_id
      ) ||
      cleanString(
        url.searchParams.get("id")
      ) ||
      cleanString(
        url.searchParams.get(
          "battleId"
        )
      );

    if (!battleId) {
      return jsonResponse(
        {
          success: false,
          error:
            "Battle ID is required.",
        },
        400
      );
    }

    const db =
      getAdminDatabaseClient();

    const {
      error:
        commentsError,
    } = await db
      .from(
        "battle_comments"
      )
      .delete()
      .eq(
        "battle_id",
        battleId
      );

    if (commentsError) {
      throw new Error(
        `Failed to delete battle comments: ${commentsError.message}`
      );
    }

    const {
      error:
        votesError,
    } = await db
      .from(
        "battle_votes"
      )
      .delete()
      .eq(
        "battle_id",
        battleId
      );

    if (votesError) {
      throw new Error(
        `Failed to delete battle votes: ${votesError.message}`
      );
    }

    const {
      data:
        deletedRows,
      error:
        battleDeleteError,
    } = await db
      .from("battles")
      .delete()
      .eq(
        "id",
        battleId
      )
      .select("id");

    if (battleDeleteError) {
      throw new Error(
        `Failed to delete battle: ${battleDeleteError.message}`
      );
    }

    await removeBattleFromRuntime(
      battleId
    );

    const {
      data:
        remainingBattle,
      error:
        verifyError,
    } = await db
      .from("battles")
      .select("id")
      .eq(
        "id",
        battleId
      )
      .maybeSingle();

    if (verifyError) {
      throw new Error(
        `Battle deletion verification failed: ${verifyError.message}`
      );
    }

    if (remainingBattle) {
      return jsonResponse(
        {
          success: false,
          error:
            "Battle was not completely deleted from Supabase.",
        },
        500
      );
    }

    const deleted =
      Array.isArray(
        deletedRows
      ) &&
      deletedRows.length >
        0;

    return jsonResponse({
      success: true,

      message:
        deleted
          ? "Battle permanently deleted."
          : "Battle was already absent from the database and has been removed from runtime.",

      deleted: true,

      battleId,
    });
  } catch (error: any) {
    console.error(
      "[BATTLE DELETE ERROR]",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error?.message ||
          "Failed to delete battle.",
      },
      500
    );
  }
}
'''

path = Path("/mnt/data/route-fixed.ts")
path.write_text(code, encoding="utf-8")
print(path)
