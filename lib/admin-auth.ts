import { supabase, isSupabaseConfigured } from './supabase';

export const SITE_OWNER_EMAILS = [
  'rohitdhakaddhoti143@gmail.com',
  'rohitkumarnagar50@gmail.com',
];

export const SITE_OWNER_EMAIL = SITE_OWNER_EMAILS[0];

/**
 * Validates if the given email belongs strictly to the site owner/admin.
 */
export function isSiteAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.toLowerCase().trim();
  return SITE_OWNER_EMAILS.some((owner) => owner.toLowerCase() === clean);
}

/**
 * Enforces admin authorization server-side from request headers.
 */
export function verifyAdminRequest(req: Request): boolean {
  const headerEmail = req.headers.get('x-user-email');
  return isSiteAdmin(headerEmail);
}

/**
 * Enforces admin authorization verifying Supabase Auth identity or headers.
 */
export async function verifyAdminRequestAsync(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseConfigured()) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user?.email && isSiteAdmin(user.email)) {
        return true;
      }
    } catch (e) {
      console.warn('Error verifying Supabase admin token:', e);
    }
  }

  const headerEmail = req.headers.get('x-user-email');
  return isSiteAdmin(headerEmail);
}
