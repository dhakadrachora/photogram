import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email')?.toLowerCase().trim();
    const sb = createServerClient();

    const { data: battles, error } = await sb
      .from('battles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let userVotes: Record<string, string> = {};
    if (userEmail) {
      const { data: votes } = await sb
        .from('battle_votes')
        .select('battle_id, option_id')
        .eq('user_email', userEmail);

      if (votes) {
        for (const v of votes) userVotes[v.battle_id] = v.option_id;
      }
    }

    const formatted = (battles || []).map((b) => {
      const isEnded =
        b.is_ended ||
        b.status === 'closed' ||
        (b.ends_at && Date.now() >= new Date(b.ends_at).getTime());

      const aVotes = Number(b.option_a?.votes || 0);
      const bVotes = Number(b.option_b?.votes || 0);

      return {
        id: b.id,
        title: b.title,
        category: b.category,
        description: b.description,
        optionA: b.option_a,
        optionB: b.option_b,
        startsAt: b.starts_at ? new Date(b.starts_at).getTime() : undefined,
        endsAt: b.ends_at ? new Date(b.ends_at).getTime() : undefined,
        isEnded,
        status: isEnded ? 'closed' : 'active',
        published: b.published !== false,
        userVotedOptionId: userVotes[b.id],
        totalVotes: aVotes + bVotes,
        winnerOptionId: isEnded ? b.winner_option_id : undefined,
        isDraw: isEnded && aVotes === bVotes,
      };
    });

    return NextResponse.json(
      { success: true, battles: formatted },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const battleId = String(body.battleId || '').trim();
    const optionId = String(body.optionId || '').trim();
    const bodyEmail = String(body.userEmail || '').trim();
    const headerEmail = req.headers.get('x-user-email') || '';
    const userEmail = (headerEmail || bodyEmail).toLowerCase().trim();

    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Login required to vote.', code: 'LOGIN_REQUIRED' },
        { status: 401 }
      );
    }

    if (!battleId || !optionId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID and Option ID required.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const sb = createServerClient();

    const { data: battle, error: battleErr } = await sb
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .maybeSingle();

    if (battleErr || !battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const isEnded =
      battle.is_ended ||
      battle.status === 'closed' ||
      (battle.ends_at && Date.now() >= new Date(battle.ends_at).getTime());

    if (isEnded) {
      return NextResponse.json(
        { success: false, error: 'Voting has ended.', code: 'BATTLE_ENDED' },
        { status: 400 }
      );
    }

    const validOption = optionId === battle.option_a?.id || optionId === battle.option_b?.id;

    if (!validOption) {
      return NextResponse.json(
        { success: false, error: 'Invalid option.', code: 'INVALID_OPTION' },
        { status: 400 }
      );
    }

    const { data: userProfile } = await sb
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    const userId = userProfile?.id || userEmail;

    const { data: existingVote } = await sb
      .from('battle_votes')
      .select('option_id')
      .eq('battle_id', battleId)
      .eq('user_email', userEmail)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already voted in this battle.',
          code: 'ALREADY_VOTED',
          votedOptionId: existingVote.option_id,
        },
        { status: 409 }
      );
    }

    const { error: voteErr } = await sb.from('battle_votes').insert({
      battle_id: battleId,
      user_id: userId,
      user_email: userEmail,
      option_id: optionId,
    });

    if (voteErr) {
      if (voteErr.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'You already voted.', code: 'ALREADY_VOTED' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Vote failed.', details: voteErr.message },
        { status: 500 }
      );
    }

    const { data: allVotes } = await sb
      .from('battle_votes')
      .select('option_id')
      .eq('battle_id', battleId);

    const aVotes = (allVotes || []).filter((v) => v.option_id === battle.option_a.id).length;
    const bVotes = (allVotes || []).filter((v) => v.option_id === battle.option_b.id).length;

    await sb
      .from('battles')
      .update({
        option_a: { ...battle.option_a, votes: aVotes },
        option_b: { ...battle.option_b, votes: bVotes },
      })
      .eq('id', battleId);

    return NextResponse.json({
      success: true,
      message: 'Vote registered!',
      aVotes,
      bVotes,
    });
  } catch (error: any) {
    console.error('[VOTE POST ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Vote failed.' },
      { status: 500 }
    );
  }
}