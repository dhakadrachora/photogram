import { supabase, createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { AdminUserSession } from './types';

export const PRIMARY_OWNER_EMAIL = 'rohitdhakaddhoti143@gmail.com';

export const OWNER_EMAILS = [
  PRIMARY_OWNER_EMAIL.toLowerCase(),
  'rohitdhakaddhoti@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []),
];

/**
 * Checks if an email is in the owner/admin allowlist.
 */
export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Server-side: verifies request Bearer token and checks if user is an admin.
 * Checks both allowlisted emails AND public.users is_admin / role.
 */
export async function verifyAdminRequest(req: Request): Promise<{
  isAdmin: boolean;
  user: { id: string; email: string; name?: string; role?: string } | null;
  error?: string;
}> {
  let token = '';
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    // Cookie fallback for browser clients
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/sb-[^;]+-auth-token=([^;]+)/) || cookieHeader.match(/sb-access-token=([^;]+)/);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith('[') || decoded.startsWith('{')) {
          const parsed = JSON.parse(decoded);
          token = Array.isArray(parsed) ? parsed[0] : (parsed.access_token || parsed.token || '');
        } else {
          token = decoded;
        }
      } catch {
        // ignore cookie parse error
      }
    }
  }

  if (!token || !isSupabaseConfigured()) {
    return { isAdmin: false, user: null, error: 'Missing or malformed Authorization token' };
  }

  try {
    const sb = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user || !user.email) {
      return { isAdmin: false, user: null, error: 'Unauthorized token' };
    }

    const email = user.email.toLowerCase().trim();

    // 1. Check Allowlist
    if (isEmailInAdminAllowlist(email)) {
      return {
        isAdmin: true,
        user: {
          id: user.id,
          email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          role: 'owner',
        },
      };
    }

    // 2. Check Database users table
    const { data: dbUser, error: dbErr } = await sb
      .from('users')
      .select('id, email, name, role, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!dbErr && dbUser) {
      if (dbUser.is_admin === true || dbUser.role === 'admin' || dbUser.role === 'owner') {
        return {
          isAdmin: true,
          user: {
            id: user.id,
            email,
            name: dbUser.name || email.split('@')[0],
            role: dbUser.role || 'admin',
          },
        };
      }
    }

    return { isAdmin: false, user: null, error: 'Forbidden: Insufficient privileges' };
  } catch (err: any) {
    console.error('[Admin Auth Verification Error]:', err);
    return { isAdmin: false, user: null, error: 'Internal auth verification error' };
  }
}

/**
 * Client-side: retrieves current admin session details.
 */
export async function getClientAdminSession(): Promise<AdminUserSession | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user || !session.user.email) {
      return null;
    }

    const email = session.user.email.toLowerCase().trim();
    const isOwner = isEmailInAdminAllowlist(email);

    // If owner email, instant grant
    if (isOwner) {
      return {
        id: session.user.id,
        email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0],
        avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        role: 'owner',
        isOwner: true,
        token: session.access_token,
      };
    }

    // Check DB
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, name, avatar, role, is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    if (dbUser && (dbUser.is_admin === true || dbUser.role === 'admin' || dbUser.role === 'owner')) {
      return {
        id: session.user.id,
        email,
        name: dbUser.name || email.split('@')[0],
        avatar: dbUser.avatar || session.user.user_metadata?.avatar_url,
        role: dbUser.role === 'owner' ? 'owner' : 'admin',
        isOwner: false,
        token: session.access_token,
      };
    }

    return null;
  } catch {
    return null;
  }
}
