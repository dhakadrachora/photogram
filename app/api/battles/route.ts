import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAdminRequest } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

function getWinner(battle: any): string | null {
  const aVotes = Number(battle.option_a?.votes || 0);
  const bVotes = Number(battle.option_b?.votes || 0);
  if (aVotes === bVotes) return null;
  return aVotes > bVotes ? battle.option_a.id : battle.option_b.id;
}

function formatBattle(battle: any) {
  const isEnded =
    battle.is_ended ||
    battle.status === 'closed' ||
    (battle.ends_at && Date.now() >= new Date(battle.ends_at).getTime());

  const aVotes = Number(battle.option_a?.votes || 0);
  const bVotes = Number(battle.option_b?.votes || 0);

  return {
    id: battle.id,
    title: battle.title,
    category: battle.category,
    description: battle.description,
    optionA: battle.option_a,
    optionB: battle.option_b,
    startsAt: battle.starts_at ? new Date(battle.starts_at).getTime() : undefined,
    endsAt: battle.ends_at ? new Date(battle.ends_at).getTime() : undefined,
    isEnded,
    status: isEnded ? 'closed' : 'active',
    published: battle.published !== false,
    totalVotes: aVotes + bVotes,
    winnerOptionId: isEnded ? (battle.winner_option_id || getWinner(battle)) : undefined,
    isDraw: isEnded && aVotes === bVotes,
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    const isAdmin = auth.isAdmin;
    const sb = createServerClient();

    let query = sb.from('battles').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('published', true);

    const { data, error } = await query;

    if (error) {
      console.error('[BATTLES GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const battles = (data || []).map(formatBattle);

    return NextResponse.json(
      { success: true, battles, isAdmin },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('[BATTLES GET ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load battles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can create battles.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      category,
      description,
      optionA,
      optionB,
      startsAt,
      endsAt,
      durationMinutes,
      published = true,
    } = body;

    if (!title || !optionA?.label || !optionB?.label) {
      return NextResponse.json(
        { error: 'Title, Option A label, and Option B label are required.' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const startMs = startsAt || now;
    const endMs = endsAt || now + 24 * 60 * 60 * 1000;
    const duration = durationMinutes || Math.floor((endMs - startMs) / 60000);

    const id = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const row = {
      id,
      title: String(title).trim(),
      category: String(category || 'Community Clash ⚔️').trim(),
      description: String(description || 'Vote for your favorite!').trim(),
      option_a: {
        id: optionA.id || `option_a_${Math.random().toString(36).slice(2, 8)}`,
        label: String(optionA.label).trim(),
        tagline: String(optionA.tagline || '').trim(),
        votes: 0,
        emoji: optionA.emoji || '🔥',
        imageUrl: optionA.imageUrl || '',
      },
      option_b: {
        id: optionB.id || `option_b_${Math.random().toString(36).slice(2, 8)}`,
        label: String(optionB.label).trim(),
        tagline: String(optionB.tagline || '').trim(),
        votes: 0,
        emoji: optionB.emoji || '⚡',
        imageUrl: optionB.imageUrl || '',
      },
      is_ended: false,
      starts_at: new Date(startMs).toISOString(),
      ends_at: new Date(endMs).toISOString(),
      duration_minutes: duration,
      published: Boolean(published),
      status: 'active',
      winner_option_id: null,
    };

    const sb = createServerClient();
    const { data, error } = await sb.from('battles').insert(row).select().single();

    if (error) {
      console.error('[BATTLE CREATE]', error);
      return NextResponse.json(
        { error: 'Failed to create battle.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Battle created successfully.',
      battle: formatBattle(data),
    });
  } catch (error: any) {
    console.error('[BATTLE CREATE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to create battle.', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can update battles.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, action, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Battle ID required.' }, { status: 400 });
    }

    const sb = createServerClient();
    const { data: battle, error: fetchErr } = await sb
      .from('battles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !battle) {
      return NextResponse.json({ error: 'Battle not found.' }, { status: 404 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (action === 'toggle_publish') {
      updateData.published = battle.published === false;
    } else if (action === 'start') {
      updateData.is_ended = false;
      updateData.status = 'active';
      updateData.winner_option_id = null;
      updateData.starts_at = new Date().toISOString();
    } else if (action === 'end' || action === 'close') {
      updateData.is_ended = true;
      updateData.status = 'closed';
      updateData.ends_at = new Date().toISOString();
      updateData.winner_option_id = getWinner(battle);
    } else if (updates) {
      if (updates.title) updateData.title = updates.title.trim();
      if (updates.category) updateData.category = updates.category.trim();
      if (updates.description) updateData.description = updates.description.trim();
      if (typeof updates.published === 'boolean') updateData.published = updates.published;
    }

    const { data, error } = await sb
      .from('battles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, battle: formatBattle(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Only Super Admin can delete battles.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Battle ID required.' }, { status: 400 });
  }

  try {
    const sb = createServerClient();

    try {
      await sb.from('battle_comments').delete().eq('battle_id', id);
    } catch (err) {
      console.warn('[DELETE] comments error:', err);
    }

    await sb.from('battle_votes').delete().eq('battle_id', id);

    const { error } = await sb.from('battles').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: verify } = await sb.from('battles').select('id').eq('id', id).maybeSingle();

    if (verify) {
      return NextResponse.json({ error: 'Delete verification failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}