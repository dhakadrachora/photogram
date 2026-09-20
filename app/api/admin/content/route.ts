import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPER_ADMIN_EMAIL = 'rohitdhakaddhoti143@gmail.com';

type ContentType =
  | 'news'
  | 'people'
  | 'business'
  | 'gallery'
  | 'videos'
  | 'updates'
  | 'chat'
  | 'users'
  | 'settings'
  | 'overview';

const TABLES: Record<string, string> = {
  news: 'news',
  people: 'people',
  business: 'business',
  gallery: 'gallery',
  videos: 'videos',
  updates: 'updates',
  chat: 'chat_messages',
  users: 'users',
  settings: 'site_settings',
  battles: 'battles',
};

function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ...extraHeaders,
    },
  });
}

function cleanString(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function makeId(type: string) {
  return `${type}_${crypto.randomUUID()}`;
}

function normalizeType(value: string | null): ContentType | null {
  if (!value) return null;

  const allowed: ContentType[] = [
    'news',
    'people',
    'business',
    'gallery',
    'videos',
    'updates',
    'chat',
    'users',
    'settings',
    'overview',
  ];

  return allowed.includes(value as ContentType)
    ? (value as ContentType)
    : null;
}

async function getAuthenticatedUser(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase is not configured.',
    };
  }

  const authorization = req.headers.get('authorization');

  if (!authorization) {
    return {
      user: null,
      error: 'Missing Authorization header.',
    };
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      user: null,
      error: 'Invalid Authorization header.',
    };
  }

  const accessToken = match[1].trim();

  if (!accessToken) {
    return {
      user: null,
      error: 'Missing access token.',
    };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return {
        user: null,
        error: 'Invalid or expired login session.',
      };
    }

    return {
      user,
      error: null,
    };
  } catch (error) {
    console.error('Admin authentication error:', error);

    return {
      user: null,
      error: 'Authentication failed.',
    };
  }
}

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedUser>>['user']
>;

type SuperAdminResult =
  | {
      ok: true;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      user: AuthenticatedUser | null;
      response: NextResponse;
    };

async function requireSuperAdmin(
  req: NextRequest
): Promise<SuperAdminResult> {
  const { user, error } = await getAuthenticatedUser(req);

  if (!user) {
    return {
      ok: false,
      user: null,
      response: json(
        {
          error: error || 'Authentication required.',
          code: 'AUTH_REQUIRED',
        },
        401
      ),
    };
  }

  const email = user.email?.trim().toLowerCase();

  if (!email || email !== SUPER_ADMIN_EMAIL) {
    return {
      ok: false,
      user,
      response: json(
        {
          error: 'Super Admin access required.',
          code: 'ADMIN_REQUIRED',
        },
        403
      ),
    };
  }

  return {
    ok: true,
    user,
  };
}

async function getCount(table: string) {
  try {
    const result = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (result.error) {
      console.warn(`Count failed for ${table}:`, result.error.message);
      return 0;
    }

    return result.count || 0;
  } catch (error) {
    console.warn(`Count exception for ${table}:`, error);
    return 0;
  }
}

async function getRows(table: string) {
  const result = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data || [];
}

function mapNewsToDb(item: any) {
  return {
    id: item.id,
    title: cleanString(item.title, 'Untitled News'),
    category: cleanString(item.category, 'General'),
    excerpt: cleanString(item.excerpt),
    content: cleanString(item.content),
    image_url: cleanString(item.imageUrl),
    author: cleanString(item.author, 'Admin'),
    published: item.published !== false,
    views: Number(item.views || 0),
  };
}

function mapPeopleToDb(item: any) {
  return {
    id: item.id,
    name: cleanString(item.name, 'Anonymous'),
    designation: cleanString(item.designation, 'Community Member'),
    bio: cleanString(item.bio),
    photo_url: cleanString(item.photoUrl),
    achievements: cleanString(item.achievements),
    category: cleanString(item.category, 'Resident'),
    published: item.published !== false,
  };
}

function mapBusinessToDb(item: any) {
  return {
    id: item.id,
    name: cleanString(item.name, 'Local Enterprise'),
    category: cleanString(item.category, 'General'),
    phone: cleanString(item.phone),
    address: cleanString(item.address),
    description: cleanString(item.description),
    logo_url: cleanString(item.logoUrl),
    verified: item.verified !== false,
    published: item.published !== false,
  };
}

function mapGalleryToDb(item: any) {
  return {
    id: item.id,
    title: cleanString(item.title, 'Community Snapshot'),
    category: cleanString(item.category, 'Village Life'),
    image_url: cleanString(item.imageUrl),
    caption: cleanString(item.caption),
    published: item.published !== false,
  };
}

function mapVideosToDb(item: any) {
  return {
    id: item.id,
    title: cleanString(item.title, 'Community Video'),
    category: cleanString(item.category, 'Culture'),
    video_url: cleanString(item.videoUrl),
    thumbnail_url: cleanString(item.thumbnailUrl),
    description: cleanString(item.description),
    published: item.published !== false,
    views: Number(item.views || 0),
  };
}

function mapUpdatesToDb(item: any) {
  return {
    id: item.id,
    title: cleanString(item.title, 'Community Announcement'),
    summary: cleanString(item.summary),
    tag: cleanString(item.tag, 'Announcement'),
    badge_color: cleanString(item.badgeColor, 'amber'),
    published: item.published !== false,
    date: cleanString(item.date, 'Just now'),
    link_url: cleanString(item.linkUrl),
  };
}

function mapDbToApp(type: string, row: any) {
  if (!row) return row;

  if (type === 'news') {
    return {
      ...row,
      imageUrl: row.image_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  if (type === 'people') {
    return {
      ...row,
      photoUrl: row.photo_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  if (type === 'business') {
    return {
      ...row,
      logoUrl: row.logo_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  if (type === 'gallery') {
    return {
      ...row,
      imageUrl: row.image_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  if (type === 'videos') {
    return {
      ...row,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  if (type === 'updates') {
    return {
      ...row,
      badgeColor: row.badge_color,
      linkUrl: row.link_url,
      createdAt: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  }

  return row;
}

export async function GET(
  req: NextRequest
): Promise<NextResponse> {
  const admin = await requireSuperAdmin(req);

  if (!admin.ok) {
    return admin.response;
  }

  if (!isSupabaseConfigured()) {
    return json(
      {
        error: 'Supabase is not configured.',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
      500
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const requestedType = searchParams.get('type') || 'overview';
    const type = normalizeType(requestedType);

    if (!type) {
      return json(
        {
          error: 'Invalid content type.',
          allowedTypes: Object.keys(TABLES),
        },
        400
      );
    }

    if (type === 'overview') {
      const [
        totalNews,
        totalPeople,
        totalBusiness,
        totalGallery,
        totalVideos,
        totalUpdates,
        totalBattles,
        totalChatMessages,
        totalUsers,
      ] = await Promise.all([
        getCount('news'),
        getCount('people'),
        getCount('business'),
        getCount('gallery'),
        getCount('videos'),
        getCount('updates'),
        getCount('battles'),
        getCount('chat_messages'),
        getCount('users'),
      ]);

      let settings: any = null;

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (!error) {
          settings = data;
        }
      } catch (error) {
        console.warn('Failed to load site settings:', error);
      }

      return json({
        success: true,
        stats: {
          totalNews,
          totalPeople,
          totalBusiness,
          totalGallery,
          totalVideos,
          totalUpdates,
          totalBattles,
          totalChatMessages,
          totalUsers,
        },
        settings,
      });
    }

    if (type === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          name,
          email,
          phone,
          avatar,
          badge,
          rank,
          role,
          is_admin,
          coins,
          wins,
          battles,
          is_verified,
          is_blocked,
          blocked_at,
          blocked_reason,
          chat_blocked,
          voting_blocked,
          created_at,
          updated_at
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        return json(
          {
            error: error.message,
            code: 'USERS_LOAD_FAILED',
          },
          500
        );
      }

      return json({
        success: true,
        items: data || [],
      });
    }

    if (type === 'settings') {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        return json(
          {
            error: error.message,
            code: 'SETTINGS_LOAD_FAILED',
          },
          500
        );
      }

      return json({
        success: true,
        settings: data,
      });
    }

    if (type === 'chat') {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        return json(
          {
            error: error.message,
            code: 'CHAT_LOAD_FAILED',
          },
          500
        );
      }

      return json({
        success: true,
        messages: data || [],
      });
    }

    const table = TABLES[type];
    const rows = await getRows(table);

    return json({
      success: true,
      items: rows.map((row) => mapDbToApp(type, row)),
    });
  } catch (error: any) {
    console.error('Admin GET error:', error);

    return json(
      {
        error: error?.message || 'Failed to load admin data.',
        code: 'ADMIN_GET_FAILED',
      },
      500
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse> {
  const admin = await requireSuperAdmin(req);

  if (!admin.ok) {
    return admin.response;
  }

  if (!isSupabaseConfigured()) {
    return json(
      {
        error: 'Supabase is not configured.',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
      500
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const type = normalizeType(body.type);
    const item = body.item;

    if (!type || !item) {
      return json({ error: 'Missing type or item.' }, 400);
    }

    if (
      type === 'overview' ||
      type === 'users' ||
      type === 'chat' ||
      type === 'settings'
    ) {
      return json(
        {
          error: `${type} cannot be created using this endpoint.`,
        },
        400
      );
    }

    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : makeId(type);

    let payload: any;

    switch (type) {
      case 'news':
        payload = mapNewsToDb({ ...item, id });
        break;
      case 'people':
        payload = mapPeopleToDb({ ...item, id });
        break;
      case 'business':
        payload = mapBusinessToDb({ ...item, id });
        break;
      case 'gallery':
        payload = mapGalleryToDb({ ...item, id });
        break;
      case 'videos':
        payload = mapVideosToDb({ ...item, id });
        break;
      case 'updates':
        payload = mapUpdatesToDb({ ...item, id });
        break;
      default:
        return json({ error: 'Unsupported content type.' }, 400);
    }

    const { data, error } = await supabase
      .from(TABLES[type])
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error(`Admin ${type} insert error:`, error);

      return json(
        {
          error: error.message,
          code: 'CONTENT_CREATE_FAILED',
        },
        500
      );
    }

    return json({
      success: true,
      item: mapDbToApp(type, data),
    });
  } catch (error: any) {
    console.error('Admin POST error:', error);

    return json(
      {
        error: error?.message || 'Failed to create content.',
        code: 'ADMIN_POST_FAILED',
      },
      500
    );
  }
}

export async function PUT(
  req: NextRequest
): Promise<NextResponse> {
  const admin = await requireSuperAdmin(req);

  if (!admin.ok) {
    return admin.response;
  }

  if (!isSupabaseConfigured()) {
    return json(
      {
        error: 'Supabase is not configured.',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
      500
    );
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const type = normalizeType(body.type);
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const updates = body.updates;
    const settings = body.settings;

    if (type === 'settings' && settings) {
      const payload = {
        id: 'default',
        site_title: settings.siteTitle ?? settings.site_title ?? null,
        site_tagline: settings.siteTagline ?? settings.site_tagline ?? null,
        announcement_banner:
          settings.announcementBanner ??
          settings.announcement_banner ??
          null,
        is_announcement_active:
          settings.isAnnouncementActive ??
          settings.is_announcement_active ??
          false,
        allow_world_chat:
          settings.allowWorldChat ?? settings.allow_world_chat ?? true,
        allow_guest_ai:
          settings.allowGuestAi ?? settings.allow_guest_ai ?? true,
        hero_badge: settings.heroBadge ?? settings.hero_badge ?? null,
        contact_email:
          settings.contactEmail ?? settings.contact_email ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        return json(
          {
            error: error.message,
            code: 'SETTINGS_UPDATE_FAILED',
          },
          500
        );
      }

      return json({
        success: true,
        settings: data,
      });
    }

    if (!type || !id || !updates) {
      return json(
        {
          error: 'Missing type, id, or updates.',
        },
        400
      );
    }

    if (
      type === 'overview' ||
      type === 'users' ||
      type === 'chat'
    ) {
      return json(
        {
          error: `${type} cannot be updated through this endpoint.`,
        },
        400
      );
    }

    let payload: any = {};

    switch (type) {
      case 'news':
        payload = {
          ...(updates.title !== undefined && {
            title: cleanString(updates.title),
          }),
          ...(updates.category !== undefined && {
            category: cleanString(updates.category),
          }),
          ...(updates.excerpt !== undefined && {
            excerpt: cleanString(updates.excerpt),
          }),
          ...(updates.content !== undefined && {
            content: cleanString(updates.content),
          }),
          ...(updates.imageUrl !== undefined && {
            image_url: cleanString(updates.imageUrl),
          }),
          ...(updates.author !== undefined && {
            author: cleanString(updates.author),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
        };
        break;

      case 'people':
        payload = {
          ...(updates.name !== undefined && {
            name: cleanString(updates.name),
          }),
          ...(updates.designation !== undefined && {
            designation: cleanString(updates.designation),
          }),
          ...(updates.bio !== undefined && {
            bio: cleanString(updates.bio),
          }),
          ...(updates.photoUrl !== undefined && {
            photo_url: cleanString(updates.photoUrl),
          }),
          ...(updates.achievements !== undefined && {
            achievements: cleanString(updates.achievements),
          }),
          ...(updates.category !== undefined && {
            category: cleanString(updates.category),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
        };
        break;

      case 'business':
        payload = {
          ...(updates.name !== undefined && {
            name: cleanString(updates.name),
          }),
          ...(updates.category !== undefined && {
            category: cleanString(updates.category),
          }),
          ...(updates.phone !== undefined && {
            phone: cleanString(updates.phone),
          }),
          ...(updates.address !== undefined && {
            address: cleanString(updates.address),
          }),
          ...(updates.description !== undefined && {
            description: cleanString(updates.description),
          }),
          ...(updates.logoUrl !== undefined && {
            logo_url: cleanString(updates.logoUrl),
          }),
          ...(updates.verified !== undefined && {
            verified: Boolean(updates.verified),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
        };
        break;

      case 'gallery':
        payload = {
          ...(updates.title !== undefined && {
            title: cleanString(updates.title),
          }),
          ...(updates.category !== undefined && {
            category: cleanString(updates.category),
          }),
          ...(updates.imageUrl !== undefined && {
            image_url: cleanString(updates.imageUrl),
          }),
          ...(updates.caption !== undefined && {
            caption: cleanString(updates.caption),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
        };
        break;

      case 'videos':
        payload = {
          ...(updates.title !== undefined && {
            title: cleanString(updates.title),
          }),
          ...(updates.category !== undefined && {
            category: cleanString(updates.category),
          }),
          ...(updates.videoUrl !== undefined && {
            video_url: cleanString(updates.videoUrl),
          }),
          ...(updates.thumbnailUrl !== undefined && {
            thumbnail_url: cleanString(updates.thumbnailUrl),
          }),
          ...(updates.description !== undefined && {
            description: cleanString(updates.description),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
        };
        break;

      case 'updates':
        payload = {
          ...(updates.title !== undefined && {
            title: cleanString(updates.title),
          }),
          ...(updates.summary !== undefined && {
            summary: cleanString(updates.summary),
          }),
          ...(updates.tag !== undefined && {
            tag: cleanString(updates.tag),
          }),
          ...(updates.badgeColor !== undefined && {
            badge_color: cleanString(updates.badgeColor),
          }),
          ...(updates.published !== undefined && {
            published: Boolean(updates.published),
          }),
          ...(updates.date !== undefined && {
            date: cleanString(updates.date),
          }),
          ...(updates.linkUrl !== undefined && {
            link_url: cleanString(updates.linkUrl),
          }),
        };
        break;

      default:
        return json({ error: 'Invalid content type.' }, 400);
    }

    if (Object.keys(payload).length === 0) {
      return json(
        {
          error: 'No valid fields were supplied for update.',
        },
        400
      );
    }

    const { data, error } = await supabase
      .from(TABLES[type])
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`Admin ${type} update error:`, error);

      return json(
        {
          error: error.message,
          code: 'CONTENT_UPDATE_FAILED',
        },
        500
      );
    }

    return json({
      success: true,
      item: mapDbToApp(type, data),
    });
  } catch (error: any) {
    console.error('Admin PUT error:', error);

    return json(
      {
        error: error?.message || 'Failed to update content.',
        code: 'ADMIN_PUT_FAILED',
      },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest
): Promise<NextResponse> {
  const admin = await requireSuperAdmin(req);

  if (!admin.ok) {
    return admin.response;
  }

  if (!isSupabaseConfigured()) {
    return json(
      {
        error: 'Supabase is not configured.',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
      500
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    const type = normalizeType(searchParams.get('type'));
    const id = searchParams.get('id')?.trim();

    if (!type || !id) {
      return json(
        {
          error: 'Missing type or id.',
        },
        400
      );
    }

    if (
      type === 'overview' ||
      type === 'users' ||
      type === 'settings'
    ) {
      return json(
        {
          error: `${type} cannot be deleted through this endpoint.`,
        },
        400
      );
    }

    const table = TABLES[type];

    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error(`Admin ${type} delete error:`, error);

      return json(
        {
          error: error.message,
          code: 'CONTENT_DELETE_FAILED',
        },
        500
      );
    }

    if (!data) {
      return json(
        {
          success: false,
          error: 'Item not found.',
          code: 'NOT_FOUND',
        },
        404
      );
    }

    return json({
      success: true,
      deletedId: id,
      type,
    });
  } catch (error: any) {
    console.error('Admin DELETE error:', error);

    return json(
      {
        error: error?.message || 'Failed to delete content.',
        code: 'ADMIN_DELETE_FAILED',
      },
      500
    );
  }
}