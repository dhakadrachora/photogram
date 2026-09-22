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

function sanitizeAndMapToDb(type: string, body: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  if (type === 'news') {
    if (body.title !== undefined) result.title = body.title;
    if (body.category !== undefined) result.category = body.category;
    if (body.excerpt !== undefined) result.excerpt = body.excerpt;
    if (body.content !== undefined) result.content = body.content;
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      result.image_url = body.image_url || body.imageUrl || null;
    }
    if (body.author !== undefined) result.author = body.author;
    if (body.published !== undefined) result.published = Boolean(body.published);
    if (body.views !== undefined) result.views = Number(body.views) || 0;
  } else if (type === 'people') {
    if (body.name !== undefined) result.name = body.name;
    if (body.designation !== undefined) result.designation = body.designation;
    if (body.bio !== undefined) result.bio = body.bio;
    if (body.photoUrl !== undefined || body.photo_url !== undefined) {
      result.photo_url = body.photo_url || body.photoUrl || null;
    }
    if (body.achievements !== undefined) result.achievements = body.achievements;
    if (body.category !== undefined) result.category = body.category;
    if (body.published !== undefined) result.published = Boolean(body.published);
  } else if (type === 'business') {
    if (body.name !== undefined) result.name = body.name;
    if (body.category !== undefined) result.category = body.category;
    if (body.phone !== undefined) result.phone = body.phone;
    if (body.address !== undefined) result.address = body.address;
    if (body.description !== undefined) result.description = body.description;
    if (body.logoUrl !== undefined || body.logo_url !== undefined) {
      result.logo_url = body.logo_url || body.logoUrl || null;
    }
    if (body.verified !== undefined) result.verified = Boolean(body.verified);
    if (body.published !== undefined) result.published = Boolean(body.published);
  } else if (type === 'gallery') {
    if (body.title !== undefined) result.title = body.title;
    if (body.category !== undefined) result.category = body.category;
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      result.image_url = body.image_url || body.imageUrl || null;
    }
    if (body.caption !== undefined) result.caption = body.caption;
    if (body.published !== undefined) result.published = Boolean(body.published);
  } else if (type === 'videos') {
    if (body.title !== undefined) result.title = body.title;
    if (body.category !== undefined) result.category = body.category;
    if (body.videoUrl !== undefined || body.video_url !== undefined) {
      result.video_url = body.video_url || body.videoUrl || null;
    }
    if (body.thumbnailUrl !== undefined || body.thumbnail_url !== undefined) {
      result.thumbnail_url = body.thumbnail_url || body.thumbnailUrl || null;
    }
    if (body.description !== undefined) result.description = body.description;
    if (body.published !== undefined) result.published = Boolean(body.published);
    if (body.views !== undefined) result.views = Number(body.views) || 0;
  } else if (type === 'updates') {
    if (body.title !== undefined) result.title = body.title;
    if (body.summary !== undefined) result.summary = body.summary;
    if (body.tag !== undefined) result.tag = body.tag;
    if (body.badgeColor !== undefined || body.badge_color !== undefined) {
      result.badge_color = body.badge_color || body.badgeColor || 'amber';
    }
    if (body.published !== undefined) result.published = Boolean(body.published);
    if (body.date !== undefined) result.date = body.date;
    if (body.linkUrl !== undefined || body.link_url !== undefined) {
      result.link_url = body.link_url || body.linkUrl || null;
    }
  } else if (type === 'settings') {
    if (body.site_title !== undefined) result.site_title = body.site_title;
    if (body.site_tagline !== undefined) result.site_tagline = body.site_tagline;
    if (body.announcement_banner !== undefined) result.announcement_banner = body.announcement_banner;
    if (body.is_announcement_active !== undefined) result.is_announcement_active = Boolean(body.is_announcement_active);
    if (body.allow_world_chat !== undefined) result.allow_world_chat = Boolean(body.allow_world_chat);
    if (body.allow_guest_ai !== undefined) result.allow_guest_ai = Boolean(body.allow_guest_ai);
    if (body.hero_badge !== undefined) result.hero_badge = body.hero_badge;
    if (body.contact_email !== undefined) result.contact_email = body.contact_email;
  }

  return result;
}

function formatContentItem(type: string, item: any): any {
  if (!item) return item;
  if (type === 'news') {
    return {
      ...item,
      imageUrl: item.image_url || item.imageUrl || '',
    };
  }
  if (type === 'people') {
    return {
      ...item,
      photoUrl: item.photo_url || item.photoUrl || '',
    };
  }
  if (type === 'business') {
    return {
      ...item,
      logoUrl: item.logo_url || item.logoUrl || '',
    };
  }
  if (type === 'gallery') {
    return {
      ...item,
      imageUrl: item.image_url || item.imageUrl || '',
    };
  }
  if (type === 'videos') {
    return {
      ...item,
      videoUrl: item.video_url || item.videoUrl || '',
      thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || '',
    };
  }
  if (type === 'updates') {
    return {
      ...item,
      badgeColor: item.badge_color || item.badgeColor || 'amber',
      linkUrl: item.link_url || item.linkUrl || '',
    };
  }
  return item;
}

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
    const formattedData = (data || []).map((item: any) => formatContentItem(type, item));

    return NextResponse.json({
      success: true,
      data: formattedData,
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

    const sanitized = sanitizeAndMapToDb(type, body);

    const row = {
      ...sanitized,
      id,
      created_at: body.created_at || new Date().toISOString(),
    };

    const { data, error } = await sb.from(table).insert(row).select().single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${type} item created successfully`,
      data: formatContentItem(type, data),
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
      const sanitizedSettings = sanitizeAndMapToDb('settings', body);
      const { data, error } = await sb
        .from('site_settings')
        .upsert({ ...sanitizedSettings, id: 'default', updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Settings updated', data });
    }

    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required for update' }, { status: 400 });
    }

    const sanitized = sanitizeAndMapToDb(type, body);

    const { data, error } = await sb
      .from(table)
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      data: formatContentItem(type, data),
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
