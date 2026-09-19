import { NextRequest, NextResponse } from 'next/server';
import { contentStore } from '@/lib/content-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_COMMENT_LENGTH = 500;

async function getAuthenticatedUser(req: NextRequest) {
  if (!isSupabaseConfigured()) return null;

  const authorization = req.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

function getBattle(battleId: string) {
  return contentStore.battles.get(battleId);
}

function isBattleEnded(battle: any) {
  return (
    battle.isEnded === true ||
    battle.status === 'closed' ||
    Date.now() >= Number(battle.endsAt || 0)
  );
}

/**
 * GET
 *
 * Comments are public.
 * Anyone can read comments.
 *
 * New comments are NOT accepted after battle expiry.
 * Existing comments remain permanently.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const battleId = searchParams.get('battleId')?.trim();

    if (!battleId) {
      return NextResponse.json(
        {
          error: 'battleId is required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const battle = getBattle(battleId);

    if (!battle) {
      return NextResponse.json(
        {
          error: 'Battle not found.',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        comments: [],
      });
    }

    const { data, error } = await supabase
      .from('battle_comments')
      .select(`
        id,
        battle_id,
        user_id,
        user_name,
        user_email,
        avatar_url,
        text,
        created_at
      `)
      .eq('battle_id', battleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Battle comments GET error:', error);

      return NextResponse.json(
        {
          error: 'Failed to load comments.',
          code: 'COMMENTS_LOAD_FAILED',
        },
        { status: 500 }
      );
    }

    /**
     * Public response intentionally does NOT expose email/user_id.
     */
    const comments = (data || []).map((comment) => ({
      id: comment.id,
      battleId: comment.battle_id,
      userName: comment.user_name || 'User',
      avatarUrl: comment.avatar_url || null,
      text: comment.text,
      createdAt: comment.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        comments,
        commentsClosed: isBattleEnded(battle),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Battle comments GET error:', error);

    return NextResponse.json(
      {
        error: 'Failed to load comments.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST
 *
 * Only authenticated users can comment.
 *
 * Rules:
 * - Real Supabase user required
 * - Battle must exist
 * - Battle must still be active
 * - Maximum 500 characters
 * - Identity comes from Supabase auth
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Comments are temporarily unavailable.',
          code: 'SUPABASE_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Login is required to comment.',
          code: 'LOGIN_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const battleId =
      typeof body?.battleId === 'string'
        ? body.battleId.trim()
        : '';

    const text =
      typeof body?.text === 'string'
        ? body.text.trim()
        : '';

    if (!battleId || !text) {
      return NextResponse.json(
        {
          error: 'battleId and text are required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters.`,
          code: 'COMMENT_TOO_LONG',
        },
        { status: 400 }
      );
    }

    const battle = getBattle(battleId);

    if (!battle) {
      return NextResponse.json(
        {
          error: 'Battle not found.',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    /**
     * Server-side timer enforcement.
     */
    if (isBattleEnded(battle)) {
      return NextResponse.json(
        {
          error: 'Comments are closed because this battle has ended.',
          code: 'BATTLE_ENDED',
        },
        { status: 400 }
      );
    }

    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    /**
     * Save permanent comment.
     */
    const { data, error } = await supabase
      .from('battle_comments')
      .insert({
        battle_id: battleId,
        user_id: user.id,
        user_name: userName,
        user_email: user.email?.toLowerCase().trim() || null,
        avatar_url: avatarUrl,
        text,
      })
      .select(`
        id,
        battle_id,
        user_id,
        user_name,
        user_email,
        avatar_url,
        text,
        created_at
      `)
      .single();

    if (error) {
      console.error('Battle comment insert error:', error);

      return NextResponse.json(
        {
          error: 'Failed to save comment.',
          code: 'COMMENT_SAVE_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      comment: {
        id: data.id,
        battleId: data.battle_id,
        userName: data.user_name || 'User',
        avatarUrl: data.avatar_url || null,
        text: data.text,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Battle comments POST error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create comment.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 *
 * User can delete ONLY their own comment.
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Comments are temporarily unavailable.',
        },
        { status: 503 }
      );
    }

    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Login is required.',
          code: 'LOGIN_REQUIRED',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const commentId =
      typeof body?.commentId === 'string'
        ? body.commentId.trim()
        : '';

    if (!commentId) {
      return NextResponse.json(
        {
          error: 'commentId is required.',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const { data: existingComment, error: findError } =
      await supabase
        .from('battle_comments')
        .select('id, user_id')
        .eq('id', commentId)
        .maybeSingle();

    if (findError) {
      console.error('Comment lookup error:', findError);

      return NextResponse.json(
        {
          error: 'Unable to find comment.',
        },
        { status: 500 }
      );
    }

    if (!existingComment) {
      return NextResponse.json(
        {
          error: 'Comment not found.',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        {
          error: 'You can delete only your own comment.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('battle_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Comment delete error:', deleteError);

      return NextResponse.json(
        {
          error: 'Failed to delete comment.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCommentId: commentId,
    });
  } catch (error) {
    console.error('Battle comments DELETE error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete comment.',
      },
      { status: 500 }
    );
  }
}