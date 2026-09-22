import { supabase } from '@/lib/supabase';
import { ApiResponse } from './types';

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Resolves the active Admin Bearer token using multi-tiered fallback:
 * 1. Active Supabase auth session
 * 2. Session refresh attempt
 * 3. Dedicated dhoti_admin_token in localStorage
 * 4. Automatic scanning of Supabase storage keys in localStorage
 */
export async function getValidAdminToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Try active Supabase session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      try {
        localStorage.setItem('dhoti_admin_token', session.access_token);
      } catch {}
      return session.access_token;
    }
  } catch {}

  // 2. Try session refresh
  try {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session?.access_token) {
      try {
        localStorage.setItem('dhoti_admin_token', refreshed.session.access_token);
      } catch {}
      return refreshed.session.access_token;
    }
  } catch {}

  // 3. Try dedicated admin token in localStorage
  try {
    const stored = localStorage.getItem('dhoti_admin_token');
    if (stored && stored !== 'undefined' && stored !== 'null' && stored.length > 20) {
      return stored;
    }
  } catch {}

  // 4. Scan localStorage for Supabase session keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const t = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
          if (t && typeof t === 'string' && t.length > 20) {
            try {
              localStorage.setItem('dhoti_admin_token', t);
            } catch {}
            return t;
          }
        }
      }
    }
  } catch {}

  return null;
}

export async function adminFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, headers = {}, ...rest } = options;

  const token = await getValidAdminToken();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      headers: reqHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => '');
      data = { message: text };
    }

    if (!res.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        (res.status === 401
          ? 'Session expired. Please log in again.'
          : res.status === 403
          ? 'Access denied. You do not have permission for this action.'
          : res.status === 404
          ? 'Requested resource not found.'
          : res.status === 409
          ? 'A conflict occurred with existing data.'
          : res.status === 429
          ? 'Too many requests. Please slow down.'
          : `Server responded with status ${res.status}`);

      return {
        success: false,
        error: errorMessage,
        details: data?.details || data,
      };
    }

    return {
      success: true,
      ...(typeof data === 'object' && data !== null ? data : {}),
      data: data?.data !== undefined ? data.data : data,
      pagination: data?.pagination,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. Please check your internet connection.',
      };
    }
    return {
      success: false,
      error: err?.message || 'Network request failed.',
    };
  }
}

/**
 * Uploads a file to Supabase storage via the authenticated /api/admin/upload route.
 * Automatically injects the Supabase session Bearer token and lets the browser
 * compute the multipart/form-data boundary.
 */
export async function adminUploadFile(
  file: File,
  folder: string = 'uploads'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const token = await getValidAdminToken();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && data?.publicUrl) {
      return { success: true, publicUrl: data.publicUrl };
    }

    return {
      success: false,
      error: data?.error || `Upload failed with status ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Upload network error occurred',
    };
  }
}
