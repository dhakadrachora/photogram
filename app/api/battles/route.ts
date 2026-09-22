import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAdminRequestAsync } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

function getWinner(battle: any): string | null {
  const aVotes = Number(battle.option_a?.votes || 0);
  const bVotes = Number(battle.option_b?.votes || 0);
  if (aVotes === bVotes) return null;
  return aVotes > bVotes ? battle.option_a?.id || null : battle.option_b?.id || null;
}

function formatBattle(battle: any) {
  const optionA = battle.option_a || { id: 'option_a', label: 'Option A', votes: 0 };
  const optionB = battle.option_b || { id: 'option_b', label: 'Option B', votes: 0 };
  const isEnded = Boolean(
    battle.is_ended ||
      battle.status === 'closed' ||
      (battle.ends_at && Date.now() >= new Date(battle.ends_at).getTime())
  );
  const aVotes = Number(optionA.votes || 0);
  const bVotes = Number(optionB.votes || 0);

  return {
    id: battle.id,
    title: battle.title,
    category: battle.category,
    description: battle.description,
    optionA,
    optionB,
    startsAt: battle.starts_at ? new Date(battle.starts_at).getTime() : undefined,
    endsAt: battle.ends_at ? new Date(battle.ends_at).getTime() : undefined,
    isEnded,
    status: isEnded ? 'closed' : 'active',
    published: battle.published !== false,
    totalVotes: aVotes + bVotes,
    winnerOptionId: isEnded ? battle.winner_option_id || getWinner({ option_a: optionA, option_b: optionB }) : undefined,
    isDraw: isEnded && aVotes === bVotes,
  };
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequestAsync(req);
    const sb = createServerClient();
    let query = sb.from('battles').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('published', true);
    const { data, error } = await query;
    if (error) {
      console.error('[BATTLES GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { success: true, battles: (data || []).map(formatBattle), isAdmin },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('[BATTLES GET ERROR]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load battles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequestAsync(req))) {
    return NextResponse.json({ error: 'Only Super Admin can create battles.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { title, category, description, optionA, optionB, startsAt, endsAt, durationMinutes, published = true } = body;
    if (!String(title || '').trim() || !String(optionA?.label || '').trim() || !String(optionB?.label || '').trim()) {
      return NextResponse.json({ error: 'Title, Option A label, and Option B label are required.' }, { status: 400 });
    }
    const now = Date.now();
    const startMs = startsAt ? new Date(startsAt).getTime() : now;
    const requestedEndMs = endsAt ? new Date(endsAt).getTime() : NaN;
    const endMs = Number.isFinite(requestedEndMs) && requestedEndMs > startMs
      ? requestedEndMs
      : startMs + Math.max(1, Number(durationMinutes) || 1440) * 60 * 1000;
    const duration = Math.max(1, Math.floor((endMs - startMs) / 60000));
    const id = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      id,
      title: String(title).trim(),
      category: String(category || 'Community Clash ⚔️').trim(),
      description: String(description || 'Vote for your favorite!').trim(),
      option_a: { id: optionA.id || `option_a_${Math.random().toString(36).slice(2, 8)}`, label: String(optionA.label).trim(), tagline: String(optionA.tagline || '').trim(), votes: 0, emoji: optionA.emoji || '🔥', imageUrl: typeof optionA.imageUrl === 'string' ? optionA.imageUrl.trim() : '' },
      option_b: { id: optionB.id || `option_b_${Math.random().toString(36).slice(2, 8)}`, label: String(optionB.label).trim(), tagline: String(optionB.tagline || '').trim(), votes: 0, emoji: optionB.emoji || '⚡', imageUrl: typeof optionB.imageUrl === 'string' ? optionB.imageUrl.trim() : '' },
      is_ended: false,
      starts_at: new Date(startMs).toISOString(),
      ends_at: new Date(endMs).toISOString(),
      duration_minutes: duration,
      published: Boolean(published),
      status: 'active',
      winner_option_id: null,
    };
    const { data, error } = await createServerClient().from('battles').insert(row).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create battle.', details: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Battle created successfully.', battle: formatBattle(data) });
  } catch (error: any) {
    console.error('[BATTLE CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to create battle.', details: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminRequestAsync(req))) return NextResponse.json({ error: 'Only Super Admin can update battles.' }, { status: 403 });
  try {
    const { id, action, updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Battle ID required.' }, { status: 400 });
    const sb = createServerClient();
    const { data: battle, error: fetchErr } = await sb.from('battles').select('*').eq('id', id).maybeSingle();
    if (fetchErr || !battle) return NextResponse.json({ error: 'Battle not found.' }, { status: 404 });
    const updateData: any = { updated_at: new Date().toISOString() };
    if (action === 'toggle_publish') updateData.published = battle.published === false;
    else if (action === 'start') { updateData.is_ended = false; updateData.status = 'active'; updateData.winner_option_id = null; updateData.starts_at = new Date().toISOString(); if (!battle.ends_at || new Date(battle.ends_at).getTime() <= Date.now()) updateData.ends_at = new Date(Date.now() + 86400000).toISOString(); }
    else if (action === 'end' || action === 'close') { updateData.is_ended = true; updateData.status = 'closed'; updateData.ends_at = new Date().toISOString(); updateData.winner_option_id = getWinner(battle); }
    else if (updates) { if (typeof updates.title === 'string' && updates.title.trim()) updateData.title = updates.title.trim(); if (typeof updates.category === 'string') updateData.category = updates.category.trim(); if (typeof updates.description === 'string') updateData.description = updates.description.trim(); if (typeof updates.published === 'boolean') updateData.published = updates.published; }
    const { data, error } = await sb.from('battles').update(updateData).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, battle: formatBattle(data) });
  } catch (error: any) { return NextResponse.json({ error: error?.message || 'Failed to update battle.' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifyAdminRequestAsync(req))) return NextResponse.json({ error: 'Only Super Admin can delete battles.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Battle ID required.' }, { status: 400 });
  try {
    const sb = createServerClient();
    await sb.from('battle_comments').delete().eq('battle_id', id);
    await sb.from('battle_votes').delete().eq('battle_id', id);
    const { error } = await sb.from('battles').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) { return NextResponse.json({ error: error?.message || 'Failed to delete battle.' }, { status: 500 }); }
}
