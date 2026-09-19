import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequestAsync, verifyAdminRequest } from '@/lib/admin-auth';
import { contentStore, BattleEventStore } from '@/lib/content-store';
import {
  fetchSupabaseBattles,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function formatBattleAdmin(b: BattleEventStore) {
  const isExpired = Date.now() >= b.endsAt;
  const isNowEnded = b.isEnded || isExpired || b.status === 'closed';

  return {
    id: b.id,
    title: b.title,
    category: b.category,
    description: b.description,
    optionA: { ...b.optionA },
    optionB: { ...b.optionB },
    startsAt: b.startsAt || Date.now() - 1000 * 60 * 60 * 24,
    endsAt: b.endsAt,
    isEnded: isNowEnded,
    published: b.published ?? true,
    status: isNowEnded ? 'closed' : (b.status || 'active'),
    winnerOptionId: b.winnerOptionId || (isNowEnded ? (b.optionA.votes >= b.optionB.votes ? b.optionA.id : b.optionB.id) : undefined),
    totalVotes: b.optionA.votes + b.optionB.votes,
    votersCount: b.votedUserEmails ? b.votedUserEmails.size : (b.optionA.votes + b.optionB.votes),
  };
}

// GET: Returns battles list
export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);

  if (isSupabaseConfigured()) {
    const sbBattles = await fetchSupabaseBattles();
    if (sbBattles && sbBattles.length > 0) {
      for (const sb of sbBattles) {
        if (!contentStore.battles.has(sb.id)) {
          contentStore.battles.set(sb.id, {
            ...sb,
            votedUserEmails: new Set<string>(),
            userVotes: new Map<string, string>(),
          });
        }
      }
    }
  }

  const battles = Array.from(contentStore.battles.values())
    .filter((b) => (isAdmin ? true : b.published !== false))
    .map((b) => formatBattleAdmin(b))
    .reverse();

  return NextResponse.json(
    { battles, isAdmin },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

// POST: Admin creates a Battle (SERVER-SIDE AUTHORIZATION ENFORCED)
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only site owner/admin can create Battles.' },
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

    if (!title || !optionA?.label || !optionB?.label) {
      return NextResponse.json(
        { error: 'Battle title, Option A label, and Option B label are required.' },
        { status: 400 }
      );
    }

    const id = `battle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const parsedStartsAt = startsAt ? Number(startsAt) : Date.now();
    const parsedEndsAt = endsAt ? Number(endsAt) : Date.now() + 1000 * 60 * 60 * 24 * 3;

    const newBattle: BattleEventStore = {
      id,
      title: title.trim(),
      category: category?.trim() || 'Community Clash ⚔️',
      description: description?.trim() || 'Vote for your favorite community champion!',
      optionA: {
        id: optionA.id || 'opt_a_' + Math.random().toString(36).substring(2, 6),
        label: optionA.label.trim(),
        tagline: optionA.tagline?.trim() || '',
        votes: 0,
        emoji: optionA.emoji || '🔥',
        imageUrl: optionA.imageUrl || '',
      },
      optionB: {
        id: optionB.id || 'opt_b_' + Math.random().toString(36).substring(2, 6),
        label: optionB.label.trim(),
        tagline: optionB.tagline?.trim() || '',
        votes: 0,
        emoji: optionB.emoji || '⚡',
        imageUrl: optionB.imageUrl || '',
      },
      isEnded: false,
      startsAt: parsedStartsAt,
      endsAt: parsedEndsAt,
      published: Boolean(published),
      status: 'active',
      votedUserEmails: new Set<string>(),
      userVotes: new Map<string, string>(),
    };

    contentStore.battles.set(id, newBattle);

    // Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('battles').insert({
          id,
          title: newBattle.title,
          category: newBattle.category,
          description: newBattle.description,
          option_a: newBattle.optionA,
          option_b: newBattle.optionB,
          is_ended: false,
          starts_at: new Date(parsedStartsAt).toISOString(),
          ends_at: new Date(parsedEndsAt).toISOString(),
          published: newBattle.published,
          status: 'active',
        });
      } catch (err) {
        console.warn('Failed to insert battle to Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Battle created successfully!',
      battle: formatBattleAdmin(newBattle),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create battle', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT: Admin edits Battle
export async function PUT(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only site owner/admin can manage Battles.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, action, updates } = body;

    if (!id || !contentStore.battles.has(id)) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    const battle = contentStore.battles.get(id)!;

    if (action === 'toggle_publish') {
      battle.published = !battle.published;
    } else if (action === 'start') {
      battle.isEnded = false;
      battle.status = 'active';
      if (battle.endsAt <= Date.now()) {
        battle.endsAt = Date.now() + 1000 * 60 * 60 * 24 * 2;
      }
    } else if (action === 'end' || action === 'close') {
      battle.isEnded = true;
      battle.status = 'closed';
      battle.endsAt = Date.now();
      battle.winnerOptionId = battle.optionA.votes >= battle.optionB.votes ? battle.optionA.id : battle.optionB.id;
    } else if (updates) {
      if (updates.title) battle.title = updates.title.trim();
      if (updates.category) battle.category = updates.category.trim();
      if (updates.description) battle.description = updates.description.trim();
      if (typeof updates.published === 'boolean') battle.published = updates.published;
      if (typeof updates.isEnded === 'boolean') battle.isEnded = updates.isEnded;
      if (updates.startsAt) battle.startsAt = Number(updates.startsAt);
      if (updates.endsAt) battle.endsAt = Number(updates.endsAt);
      if (updates.optionA) battle.optionA = { ...battle.optionA, ...updates.optionA };
      if (updates.optionB) battle.optionB = { ...battle.optionB, ...updates.optionB };
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('battles').update({
          title: battle.title,
          category: battle.category,
          description: battle.description,
          option_a: battle.optionA,
          option_b: battle.optionB,
          is_ended: battle.isEnded,
          starts_at: new Date(battle.startsAt || Date.now()).toISOString(),
          ends_at: new Date(battle.endsAt).toISOString(),
          published: battle.published,
          status: battle.status,
          winner_option_id: battle.winnerOptionId || null,
        }).eq('id', id);
      } catch (err) {
        console.warn('Failed to update battle in Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Battle updated successfully',
      battle: formatBattleAdmin(battle),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update battle', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: Admin deletes a Battle
export async function DELETE(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only site owner/admin can delete Battles.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || !contentStore.battles.has(id)) {
    return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
  }

  contentStore.battles.delete(id);

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('battles').delete().eq('id', id);
      await supabase.from('battle_votes').delete().eq('battle_id', id);
    } catch (err) {
      console.warn('Failed to delete battle from Supabase:', err);
    }
  }

  return NextResponse.json({ success: true, deletedId: id });
}
