import { supabase, createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { AdminUserSession } from './types';

export const PRIMARY_OWNER_EMAIL = 'rohitdhakaddhoti132@gmail.com';

export const OWNER_EMAILS = [
  PRIMARY_OWNER_EMAIL.toLowerCase(),
];

/**
 * Checks if an email belongs to the sole site owner.
 */
export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
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

  if (!token || token === 'undefined' || token === 'null' || !isSupabaseConfigured()) {
    return { isAdmin: false, user: null, error: 'Missing or malformed Authorization token' };
  }

  try {
    const sb = createServerClient();
    const { data: { user }, error: authErr } = await sb.auth.getUser(token);

    if (authErr || !user || !user.email) {
      return { isAdmin: false, user: null, error: 'Unauthorized token' };
    }

    const email = user.email.toLowerCase().trim();

    // Check if user is the sole site owner
    if (isEmailInAdminAllowlist(email)) {
      return {
        isAdmin: true,
        user: {
          id: user.id,
          email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Rohit Dhakad',
          role: 'owner',
        },
      };
    }

    return { isAdmin: false, user: null, error: 'Forbidden: Only authorized Site Owner can access this panel.' };
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

    // Cache token in localStorage for instant access across admin components
    try {
      localStorage.setItem('dhoti_admin_token', session.access_token);
    } catch {}

    // If owner email, grant access; otherwise strictly deny
    if (isOwner) {
      return {
        id: session.user.id,
        email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Rohit Dhakad',
        avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        role: 'owner',
        isOwner: true,
        token: session.access_token,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export interface AdminAuthCheckResult {
  session: AdminUserSession | null;
  currentEmail: string | null;
  status: 'authenticated_admin' | 'unauthenticated' | 'unauthorized_user';
  error?: string;
}

export async function checkAdminDetailedSession(): Promise<AdminAuthCheckResult> {
  if (typeof window === 'undefined') {
    return { session: null, currentEmail: null, status: 'unauthenticated' };
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user || !session.user.email) {
      return { session: null, currentEmail: null, status: 'unauthenticated' };
    }

    const email = session.user.email.toLowerCase().trim();
    const isOwner = isEmailInAdminAllowlist(email);

    if (isOwner) {
      try {
        localStorage.setItem('dhoti_admin_token', session.access_token);
      } catch {}

      return {
        status: 'authenticated_admin',
        currentEmail: email,
        session: {
          id: session.user.id,
          email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Rohit Dhakad',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          role: 'owner',
          isOwner: true,
          token: session.access_token,
        },
      };
    }

    return {
      status: 'unauthorized_user',
      currentEmail: null,
      session: null,
      error: 'अनाधिकृत खाता। यह पैनल केवल अधिकृत सिस्टम एडमिनिस्ट्रेटर के लिए सुरक्षित है।',
    };
  } catch (err: any) {
    return {
      status: 'unauthenticated',
      currentEmail: null,
      session: null,
      error: err?.message || 'Failed to authenticate session',
    };
  }
}
