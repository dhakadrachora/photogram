import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['news', 'people', 'business', 'gallery', 'videos', 'updates', 'settings', 'overview', 'users'] as const;
type ContentType = (typeof VALID_TYPES)[number];

const TYPE_TO_TABLE: Record<string, string> = {
  news: 'news',
  people: 'people',
  business: 'business',
  gallery: 'gallery',
  videos: 'videos',
  updates: 'updates',
  settings: 'site_settings',
  users: 'users',
};

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'news') as ContentType;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
  const search = searchParams.get('search')?.trim().toLowerCase() || '';

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: `Invalid content type: ${type}` }, { status: 400 });
  }

  const sb = createServerClient();

  try {
    if (type === 'overview') {
      const [uCount, bCount, nCount, upCount, busCount, gCount, vCount] = await Promise.all([
        sb.from('users').select('*', { count: 'exact', head: true }),
        sb.from('battles').select('*', { count: 'exact', head: true }),
        sb.from('news').select('*', { count: 'exact', head: true }),
        sb.from('updates').select('*', { count: 'exact', head: true }),
        sb.from('business').select('*', { count: 'exact', head: true }),
        sb.from('gallery').select('*', { count: 'exact', head: true }),
        sb.from('videos').select('*', { count: 'exact', head: true }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          users: uCount.count || 0,
          battles: bCount.count || 0,
          news: nCount.count || 0,
          updates: upCount.count || 0,
          business: busCount.count || 0,
          gallery: gCount.count || 0,
          videos: vCount.count || 0,
        },
      });
    }

    const table = TYPE_TO_TABLE[type];

    if (type === 'settings') {
      const { data, error } = await sb.from(table).select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, data: data || {} });
    }

    let query = sb.from(table).select('*', { count: 'exact' });

    if (search) {
      if (type === 'news') query = query.ilike('title', `%${search}%`);
      else if (type === 'people') query = query.ilike('name', `%${search}%`);
      else if (type === 'business') query = query.ilike('name', `%${search}%`);
      else if (type === 'gallery') query = query.ilike('title', `%${search}%`);
      else if (type === 'videos') query = query.ilike('title', `%${search}%`);
      else if (type === 'updates') query = query.ilike('title', `%${search}%`);
      else if (type === 'users') query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
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
    console.error(`[ADMIN_CONTENT_GET_${type}]`, err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || '') as ContentType;

  if (!VALID_TYPES.includes(type) || type === 'settings') {
    return NextResponse.json({ success: false, error: `Invalid content type for creation: ${type}` }, { status: 400 });
  }

  const sb = createServerClient();
  const table = TYPE_TO_TABLE[type];

  try {
    const body = await req.json();
    const id = body.id || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const row = {
      ...body,
      id,
      created_at: body.created_at || new Date().toISOString(),
    };

    const { data, error } = await sb.from(table).insert(row).select().single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${type} item created successfully`,
      data,
    });
  } catch (err: any) {
    console.error(`[ADMIN_CONTENT_POST_${type}]`, err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || '') as ContentType;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: `Invalid content type: ${type}` }, { status: 400 });
  }

  const sb = createServerClient();
  const table = TYPE_TO_TABLE[type];

  try {
    const body = await req.json();

    if (type === 'settings') {
      const { data, error } = await sb
        .from('site_settings')
        .upsert({ ...body, id: 'default', updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Settings updated', data });
    }

    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required for update' }, { status: 400 });
    }

    const { data, error } = await sb
      .from(table)
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      data,
    });
  } catch (err: any) {
    console.error(`[ADMIN_CONTENT_PUT_${type}]`, err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update item' },
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
  const type = (searchParams.get('type') || '') as ContentType;
  const id = searchParams.get('id');

  if (!VALID_TYPES.includes(type) || type === 'settings') {
    return NextResponse.json({ success: false, error: `Invalid content type: ${type}` }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID parameter is required' }, { status: 400 });
  }

  const sb = createServerClient();
  const table = TYPE_TO_TABLE[type];

  try {
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
      deletedId: id,
    });
  } catch (err: any) {
    console.error(`[ADMIN_CONTENT_DELETE_${type}]`, err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
