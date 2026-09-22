import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient } from '@/lib/supabase';
import { isSiteAdmin } from '@/lib/admin-auth';

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
    // 1. Fetch Supabase Auth users to get mobile numbers and detect any missing profiles
    let authUserMap: Record<string, { phone?: string; name?: string; avatar?: string }> = {};
    try {
      const { data: authUsersData } = await sb.auth.admin.listUsers();
      if (authUsersData?.users) {
        for (const u of authUsersData.users) {
          const email = u.email?.toLowerCase().trim() || '';
          const phone = u.user_metadata?.phone || u.phone || '';
          const name = u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0];
          const avatar = u.user_metadata?.avatar_url || '';

          authUserMap[u.id] = { phone, name, avatar };

          // Automatically ensure they exist in public.users
          const isOwner = isSiteAdmin(email);
          await sb.from('users').upsert(
            {
              id: u.id,
              email,
              name,
              avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
              badge: isOwner ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
              role: isOwner ? 'owner' : 'resident',
              is_admin: isOwner,
              coins: 50,
              wins: 0,
              battles: 0,
              rank: isOwner ? 'Owner' : 'Resident',
              created_at: u.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        }
      }
    } catch (authErr) {
      console.warn('[ADMIN_USERS_AUTH_SYNC]', authErr);
    }

    // 2. Query public.users (without non-existent 'phone' column to prevent 42703 error)
    let query = sb
      .from('users')
      .select('id, name, email, avatar, badge, rank, role, is_admin, coins, wins, battles, created_at', {
        count: 'exact',
      });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // 3. Attach phone from authUserMap
    const enrichedUsers = (data || []).map((u: any) => ({
      ...u,
      phone: authUserMap[u.id]?.phone || u.phone || '',
      is_admin: isSiteAdmin(u.email),
      isOwner: isSiteAdmin(u.email),
    }));

    const total = count || enrichedUsers.length;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
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
      .select('id, name, email, avatar, badge, rank, role, is_admin, coins, wins, battles, created_at')
      .single();

    if (error) throw error;

    // Also update auth user metadata if badge or role was changed
    if (updates.badge !== undefined || updates.role !== undefined) {
      const isVerified = String(updates.badge || '').toLowerCase().includes('verified');
      await sb.auth.admin.updateUserById(userId, {
        user_metadata: {
          badge: updates.badge,
          is_verified: isVerified,
        },
      }).catch(() => {});
    }

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
    // Check if target is site owner
    const { data: targetUser } = await sb.from('users').select('email').eq('id', userId).maybeSingle();
    if (targetUser && isSiteAdmin(targetUser.email)) {
      return NextResponse.json({ success: false, error: 'Site Owner account cannot be deleted' }, { status: 403 });
    }

    const { error } = await sb.from('users').delete().eq('id', userId);
    if (error) throw error;

    // Also delete from auth users
    await sb.auth.admin.deleteUser(userId).catch(() => {});

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
