import { supabase, isSupabaseConfigured } from './supabase';

export const SITE_OWNER_EMAIL = 'rohitdhakaddhoti132@gmail.com';
export const SITE_OWNER_EMAILS = [
  SITE_OWNER_EMAIL.toLowerCase(),
  'rohitdhakaddhoti143@gmail.com',
  'rohitdhakaddhoti@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []),
];

/**
 * Validates if the given email belongs strictly to the verified site owner/admin.
 */
export function isSiteAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return SITE_OWNER_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Strict server-side verification of admin requests using authenticated Supabase session JWT.
 * NEVER trusts client-side headers or client-claimed identities.
 */
export async function verifyAdminRequestAsync(req: Request): Promise<boolean> {
  let token = '';
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    // Check cookie fallback
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
      } catch {}
    }
  }

  if (!token || !isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user || !user.email) return false;
    if (isSiteAdmin(user.email)) return true;

    // Also check database user role/is_admin
    const { createServerClient } = await import('./supabase');
    const sb = createServerClient();
    const { data: dbUser } = await sb
      .from('users')
      .select('is_admin, role')
      .eq('id', user.id)
      .maybeSingle();

    return dbUser?.is_admin === true || dbUser?.role === 'admin' || dbUser?.role === 'owner';
  } catch (e) {
    console.warn('Error verifying Supabase admin token:', e);
    return false;
  }
}

/**
 * Extracts and verifies the authenticated user from a Bearer token in the request.
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Legacy synchronous check - deprecated to prevent header spoofing.
 */
export function verifyAdminRequest(_req: Request): boolean {
  return false;
}
