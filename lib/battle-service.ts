import { createServerClient, supabase } from '@/lib/supabase';

/* ============================================================
   HELPERS
   ============================================================ */

function getWinnerFromRow(battle: any): string | null {
  const aVotes = Number(battle.option_a?.votes || 0);
  const bVotes = Number(battle.option_b?.votes || 0);
  if (aVotes === bVotes) return null;
  return aVotes > bVotes ? battle.option_a.id : battle.option_b.id;
}

export function formatBattleForClient(battle: any, userVotedOptionId?: string | null) {
  const isEnded =
    battle.is_ended ||
    battle.status === 'closed' ||
    (battle.ends_at && Date.now() >= new Date(battle.ends_at).getTime());

  let winnerOptionId = battle.winner_option_id;
  if (isEnded && !winnerOptionId) {
    winnerOptionId = getWinnerFromRow(battle);
  }

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
    userVotedOptionId: userVotedOptionId || undefined,
    totalVotes: aVotes + bVotes,
    winnerOptionId: isEnded ? winnerOptionId : undefined,
    isDraw: isEnded && aVotes === bVotes,
    durationMinutes: battle.duration_minutes,
  };
}

/* ============================================================
   FETCH ALL BATTLES
   ============================================================ */

export async function getAllBattles(isAdmin: boolean = false) {
  const sb = createServerClient();

  let query = sb.from('battles').select('*').order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('published', true);

  const { data, error } = await query;
  if (error) {
    console.error('[BATTLES] Fetch error:', error);
    return [];
  }
  return data || [];
}

/* ============================================================
   FETCH ONE BATTLE
   ============================================================ */

export async function getBattleById(id: string) {
  const sb = createServerClient();
  const { data, error } = await sb.from('battles').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data;
}

/* ============================================================
   CREATE BATTLE
   ============================================================ */

export async function createBattle(input: {
  title: string;
  category: string;
  description?: string;
  optionA: { id?: string; label: string; tagline?: string; emoji?: string; imageUrl?: string };
  optionB: { id?: string; label: string; tagline?: string; emoji?: string; imageUrl?: string };
  startsAt?: number;
  endsAt?: number;
  durationMinutes?: number;
  published?: boolean;
}) {
  const sb = createServerClient();
  const now = Date.now();
  const startsAt = input.startsAt || now;
  const endsAt = input.endsAt || now + 24 * 60 * 60 * 1000;
  const durationMinutes = input.durationMinutes || Math.floor((endsAt - startsAt) / 60000);

  const id = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    title: input.title.trim(),
    category: (input.category || 'Community Clash ⚔️').trim(),
    description: (input.description || 'Vote for your favorite community champion!').trim(),
    option_a: {
      id: input.optionA.id || `option_a_${Math.random().toString(36).slice(2, 8)}`,
      label: input.optionA.label.trim(),
      tagline: (input.optionA.tagline || '').trim(),
      votes: 0,
      emoji: input.optionA.emoji || '🔥',
      imageUrl: input.optionA.imageUrl || '',
    },
    option_b: {
      id: input.optionB.id || `option_b_${Math.random().toString(36).slice(2, 8)}`,
      label: input.optionB.label.trim(),
      tagline: (input.optionB.tagline || '').trim(),
      votes: 0,
      emoji: input.optionB.emoji || '⚡',
      imageUrl: input.optionB.imageUrl || '',
    },
    is_ended: false,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    duration_minutes: durationMinutes,
    published: input.published !== false,
    status: 'active',
    winner_option_id: null,
  };

  const { data, error } = await sb.from('battles').insert(row).select().single();
  if (error) {
    console.error('[BATTLE CREATE]', error);
    throw new Error(error.message);
  }
  return data;
}

/* ============================================================
   CAST VOTE
   ============================================================ */

export async function castVote(
  battleId: string,
  optionId: string,
  userId: string,
  userEmail: string
) {
  const sb = createServerClient();

  // 1. Battle fetch
  const battle = await getBattleById(battleId);
  if (!battle) throw new Error('Battle not found');

  // 2. Timer check
  const isEnded =
    battle.is_ended ||
    battle.status === 'closed' ||
    (battle.ends_at && Date.now() >= new Date(battle.ends_at).getTime());

  if (isEnded) {
    // Auto-close
    if (!battle.is_ended) {
      await sb.from('battles').update({
        is_ended: true,
        status: 'closed',
        winner_option_id: getWinnerFromRow(battle),
      }).eq('id', battleId);
    }
    throw new Error('Voting has ended for this battle.');
  }

  // 3. Option validation
  const validOption = optionId === battle.option_a?.id || optionId === battle.option_b?.id;
  if (!validOption) throw new Error('Invalid option chosen.');

  // 4. Check existing vote
  const { data: existing } = await sb
    .from('battle_votes')
    .select('option_id')
    .eq('battle_id', battleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    throw new Error('You have already voted in this battle.');
  }

  // 5. Insert vote
  const { error: voteErr } = await sb.from('battle_votes').insert({
    battle_id: battleId,
    user_id: userId,
    user_email: userEmail.toLowerCase(),
    option_id: optionId,
  });

  if (voteErr) {
    if (voteErr.code === '23505') throw new Error('You have already voted.');
    throw new Error(voteErr.message);
  }

  // 6. Recount votes
  const { data: allVotes } = await sb
    .from('battle_votes')
    .select('option_id')
    .eq('battle_id', battleId);

  const aVotes = (allVotes || []).filter(v => v.option_id === battle.option_a.id).length;
  const bVotes = (allVotes || []).filter(v => v.option_id === battle.option_b.id).length;

  // 7. Update denormalized counts
  await sb.from('battles').update({
    option_a: { ...battle.option_a, votes: aVotes },
    option_b: { ...battle.option_b, votes: bVotes },
  }).eq('id', battleId);

  return {
    success: true,
    aVotes,
    bVotes,
    battle: { ...battle, option_a: { ...battle.option_a, votes: aVotes }, option_b: { ...battle.option_b, votes: bVotes } },
  };
}

/* ============================================================
   UPDATE BATTLE (Admin)
   ============================================================ */

export async function updateBattle(battleId: string, updates: any) {
  const sb = createServerClient();
  const battle = await getBattleById(battleId);
  if (!battle) throw new Error('Battle not found');

  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.action === 'toggle_publish') {
    updateData.published = battle.published === false;
  } else if (updates.action === 'start') {
    updateData.is_ended = false;
    updateData.status = 'active';
    updateData.winner_option_id = null;
    updateData.starts_at = new Date().toISOString();
    if (battle.ends_at && new Date(battle.ends_at).getTime() <= Date.now()) {
      updateData.ends_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
  } else if (updates.action === 'end' || updates.action === 'close') {
    updateData.is_ended = true;
    updateData.status = 'closed';
    updateData.ends_at = new Date().toISOString();
    updateData.winner_option_id = getWinnerFromRow(battle);
  } else if (updates.title) updateData.title = updates.title.trim();
  else if (updates.category) updateData.category = updates.category.trim();
  else if (updates.description) updateData.description = updates.description.trim();
  else if (typeof updates.published === 'boolean') updateData.published = updates.published;

  const { data, error } = await sb.from('battles').update(updateData).eq('id', battleId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

/* ============================================================
   DELETE BATTLE (Permanent)
   ============================================================ */

export async function deleteBattlePermanently(battleId: string): Promise<boolean> {
  const sb = createServerClient();
  console.log(`[DELETE] Starting delete: ${battleId}`);

  // 1. Comments
  await sb.from('battle_comments').delete().eq('battle_id', battleId);

  // 2. Votes
  await sb.from('battle_votes').delete().eq('battle_id', battleId);

  // 3. Battle
  const { error } = await sb.from('battles').delete().eq('id', battleId);
  if (error) {
    console.error('[DELETE] Battle delete failed:', error);
    return false;
  }

  // 4. Verify
  const { data: verify } = await sb.from('battles').select('id').eq('id', battleId).maybeSingle();
  if (verify) {
    console.error('[DELETE] Verification failed — battle still exists!');
    return false;
  }

  console.log(`[DELETE] ✅ Battle ${battleId} deleted`);
  return true;
}