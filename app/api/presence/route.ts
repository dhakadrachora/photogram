import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSiteAdmin } from '@/lib/admin-auth';
import { PresenceUser } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://zlngcbefvdtbihndaeun.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_JxGddMQ5KqRFTANuZG2TGg_I05TTskS';

const INACTIVITY_TIMEOUT_MS = 35_000;

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

function getBearerToken(req: NextRequest): string {
  const header = req.headers.get('authorization') || '';

  if (!header.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return header.slice(7).trim();
}

function createUserClient(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapPresenceRow(row: any): PresenceUser {
  return {
    userId: String(row.user_id),
    userName: String(row.user_name || 'Dhoti Resident'),
    userAvatar: String(row.user_avatar || ''),
    userBadge: row.user_badge
      ? String(row.user_badge)
      : 'Dhoti Resident',
    isVerified: Boolean(row.is_verified),
    isAdmin: Boolean(row.is_admin),
    lastActive: new Date(row.last_active).getTime(),
  };
}

async function getActiveUsers(client: any): Promise<PresenceUser[]> {
  const cutoff = new Date(
    Date.now() - INACTIVITY_TIMEOUT_MS
  ).toISOString();

  const { data, error } = await client
    .from('presence_users')
    .select(
      'user_id,user_name,user_avatar,user_badge,is_verified,is_admin,last_active'
    )
    .gte('last_active', cutoff)
    .order('is_admin', {
      ascending: false,
    })
    .order('last_active', {
      ascending: false,
    });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map(mapPresenceRow)
    .filter(
      (user) =>
        user.userId !== 'dhoti_aale_ai_official' &&
        !user.userId.startsWith('guest_')
    );
}

async function authenticate(req: NextRequest) {
  const token = getBearerToken(req);

  if (!token) {
    return {
      client: null,
      user: null,
    };
  }

  const client = createUserClient(token);

  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    return {
      client: null,
      user: null,
    };
  }

  return {
    client,
    user,
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
| Anyone can read currently active users.
*/
let cachedPresenceUsers: PresenceUser[] = [];
let lastPresenceFetch = 0;
const PRESENCE_CACHE_TTL_MS = 6000;

export async function GET() {
  try {
    if (Date.now() - lastPresenceFetch < PRESENCE_CACHE_TTL_MS && cachedPresenceUsers.length > 0) {
      return response({
        success: true,
        count: cachedPresenceUsers.length,
        users: cachedPresenceUsers,
        timeoutMs: INACTIVITY_TIMEOUT_MS,
      });
    }

    const client = createPublicClient();
    const users = await getActiveUsers(client);

    cachedPresenceUsers = users;
    lastPresenceFetch = Date.now();

    return response({
      success: true,
      count: users.length,
      users,
      timeoutMs: INACTIVITY_TIMEOUT_MS,
    });
  } catch (error: any) {
    return response(
      {
        success: false,
        error: error?.message || 'Failed to load presence.',
        users: [],
        count: 0,
      },
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
| Only a real authenticated Supabase user can create/update presence.
| User identity is taken from Supabase Auth, NOT from request body.
*/
export async function POST(req: NextRequest) {
  try {
    const { client, user } = await authenticate(req);

    if (!client || !user) {
      return response(
        {
          success: false,
          error: 'Authentication required.',
        },
        401
      );
    }

    const body = await req.json().catch(() => ({}));

    const email = String(user.email || '')
      .trim()
      .toLowerCase();

    const isAdmin = isSiteAdmin(email);

    /*
     * Read the actual profile from public.users.
     * Do NOT trust the name/avatar sent by browser.
     */
    const { data: profile } = await client
      .from('users')
      .select('name,avatar,badge,is_verified')
      .eq('id', user.id)
      .maybeSingle();

    const metadata = user.user_metadata || {};

    const userName = String(
      profile?.name ||
        metadata.full_name ||
        metadata.name ||
        email.split('@')[0] ||
        'Dhoti Resident'
    ).trim();

    const userAvatar = String(
      profile?.avatar ||
        metadata.avatar_url ||
        metadata.picture ||
        ''
    ).trim();

    const userBadge = isAdmin
      ? 'Site Owner & Admin 👑'
      : String(
          profile?.badge ||
            'Dhoti Resident'
        ).trim();

    const isVerified =
      Boolean(profile?.is_verified) ||
      isAdmin;

    const { error: upsertError } = await client
      .from('presence_users')
      .upsert(
        {
          user_id: user.id,
          user_name: userName,
          user_avatar: userAvatar,
          user_badge: userBadge,
          is_verified: isVerified,
          is_admin: isAdmin,
          last_active: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (upsertError) {
      return response(
        {
          success: false,
          error: upsertError.message,
        },
        500
      );
    }

    const users = await getActiveUsers(client);
    cachedPresenceUsers = users;
    lastPresenceFetch = Date.now();

    return response({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    return response(
      {
        success: false,
        error:
          error?.message ||
          'Failed to update presence.',
      },
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
| Removes the currently authenticated user's presence.
*/
export async function DELETE(req: NextRequest) {
  try {
    const { client, user } = await authenticate(req);

    if (!client || !user) {
      return response(
        {
          success: false,
          error: 'Authentication required.',
        },
        401
      );
    }

    const { error } = await client
      .from('presence_users')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return response(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }

    lastPresenceFetch = 0;

    return response({
      success: true,
    });
  } catch (error: any) {
    return response(
      {
        success: false,
        error:
          error?.message ||
          'Failed to remove presence.',
      },
      500
    );
  }
}