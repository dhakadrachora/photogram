import { supabase, isSupabaseConfigured } from './supabase';

export const SITE_OWNER_EMAIL = 'rohitdhakaddhoti143@gmail.com';
export const SITE_OWNER_EMAILS = [SITE_OWNER_EMAIL];

/**
 * Validates if the given email belongs strictly to the verified site owner/admin.
 */
export function isSiteAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().trim() === SITE_OWNER_EMAIL;
}

/**
 * Strict server-side verification of admin requests using authenticated Supabase session JWT.
 * NEVER trusts client-side headers or client-claimed identities.
 */
export async function verifyAdminRequestAsync(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user || !user.email) return false;
    return isSiteAdmin(user.email);
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
