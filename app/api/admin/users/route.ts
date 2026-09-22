import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  const sb = createServerClient();

  try {
    let query = sb
      .from('users')
      .select('id, name, email, phone, avatar, badge, rank, role, is_admin, coins, wins, battles, created_at', {
        count: 'exact',
      });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('[ADMIN_USERS_GET]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const sb = createServerClient();

  try {
    const body = await req.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const allowedFields = ['badge', 'rank', 'role', 'is_admin', 'coins'];
    const safeUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const { data, error } = await sb
      .from('users')
      .update(safeUpdates)
      .eq('id', userId)
      .select('id, name, email, phone, avatar, badge, rank, role, is_admin, coins, wins, battles, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data,
    });
  } catch (err: any) {
    console.error('[ADMIN_USERS_PATCH]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
  }

  // Prevent self-deletion
  if (userId === auth.user?.id) {
    return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 });
  }

  const sb = createServerClient();

  try {
    const { error } = await sb.from('users').delete().eq('id', userId);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedId: userId,
    });
  } catch (err: any) {
    console.error('[ADMIN_USERS_DELETE]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
