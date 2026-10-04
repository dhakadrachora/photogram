import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  NewsItem,
  PersonProfile,
  BusinessItem,
  GalleryItem,
  VideoItem,
  CommunityUpdate,
  BattleEvent,
  ChatMessage,
  SiteSettings,
} from '@/types';
import { isSiteAdmin } from './admin-auth';

/* ============================================================
   CONFIG
   ============================================================ */

const FALLBACK_SUPABASE_URL = 'https://zlngcbefvdtbihndaeun.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbmdjYmVmdmR0YmlobmRhZXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3OTkzNDEsImV4cCI6MjEwNTM3NTM0MX0.1yCJ7K0wI3mw79oyPP2lnBvq_R7Q6huq2uH7qC0jQOE';
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbmdjYmVmdmR0YmlobmRhZXVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc5OTM0MSwiZXhwIjoyMTA1Mzc1MzQxfQ.z2cOrURJGJr8JcGow7gTCON1sEsHa-J8gDvk4d-F4Nc';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  FALLBACK_SUPABASE_SERVICE_ROLE_KEY;

export const CHAT_MESSAGE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('http')
  );
};

/* ============================================================
   CLIENTS
   ============================================================ */

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function createServerClient(): SupabaseClient {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

/* ============================================================
   AUTH — CURRENT USER
   ============================================================ */

export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentSupabaseSession() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}

/* ============================================================
   MAP USER
   ============================================================ */

export function mapSupabaseUserToAppUser(sbUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
}): User {
  const email = (sbUser.email || '').trim().toLowerCase();
  const metadata = sbUser.user_metadata || {};
  const appMetadata = sbUser.app_metadata || {};
  const admin = isSiteAdmin(email);

  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    (email ? email.split('@')[0] : 'Dhoti Resident');

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sbUser.id)}`;

  const phone = metadata.phone || undefined;

  const isGoogle =
    appMetadata.provider === 'google' ||
    Boolean(metadata.iss?.includes('google')) ||
    Boolean(metadata.avatar_url?.includes('googleusercontent')) ||
    Boolean(metadata.picture?.includes('googleusercontent'));

  return {
    id: sbUser.id,
    name,
    email,
    avatar,
    phone,
    badge: admin ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
    coins: 50,
    wins: 0,
    battles: 0,
    rank: admin ? 'Super Admin 👑' : 'Resident',
    isGoogle,
    role: admin ? 'admin' : 'resident',
    isAdmin: admin,
    createdAt: sbUser.created_at || Date.now(),
  };
}

/* ============================================================
   SIGN UP
   ============================================================ */

export async function signUpWithEmail({
  email,
  password,
  name,
  phone,
  avatarUrl,
}: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<{
  user: User | null;
  session: any | null;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, session: null, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone?.trim() || null;
  const cleanAvatar =
    avatarUrl?.trim() ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

  if (!cleanEmail) {
    return { user: null, session: null, error: 'Email is required.' };
  }
  if (!cleanName) {
    return { user: null, session: null, error: 'Name is required.' };
  }
  if (!password || password.length < 6) {
    return {
      user: null,
      session: null,
      error: 'Password must be at least 6 characters.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          phone: cleanPhone,
          avatar_url: cleanAvatar,
        },
      },
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }
    if (!data.user) {
      return {
        user: null,
        session: null,
        error: 'Signup did not return a user.',
      };
    }

    const appUser = mapSupabaseUserToAppUser({
      ...data.user,
      user_metadata: {
        ...data.user.user_metadata,
        full_name: cleanName,
        name: cleanName,
        phone: cleanPhone,
        avatar_url: cleanAvatar,
      },
    });

    try {
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: cleanEmail,
          name: cleanName,
          avatar: cleanAvatar,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('Could not create public.users profile:', err);
    }

    return { user: appUser, session: data.session || null };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err?.message || 'Signup failed. Please try again.',
    };
  }
}

/* ============================================================
   SIGN IN
   ============================================================ */

export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{
  user: User | null;
  session: any | null;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, session: null, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return {
      user: null,
      session: null,
      error: 'Email and password are required.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data?.user) {
      return {
        user: null,
        session: null,
        error:
          error?.message ||
          'लॉगिन विफल रहा। कृपया सही ईमेल और पासवर्ड दर्ज करें।',
      };
    }

    let appUser = mapSupabaseUserToAppUser(data.user);

    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select(
          'id,name,email,avatar,badge,coins,wins,battles,rank,role,is_admin,created_at'
        )
        .eq('id', data.user.id)
        .maybeSingle();

      if (!dbError && dbUser) {
        const isAdmin =
          isSiteAdmin(cleanEmail);

        appUser = {
          ...appUser,
          name: dbUser.name || appUser.name,
          avatar: dbUser.avatar || appUser.avatar,
          phone: appUser.phone,
          badge: isAdmin ? 'Site Owner & Admin 👑' : (dbUser.badge?.includes('Owner') ? 'Dhoti Resident' : (dbUser.badge || appUser.badge)),
          coins: dbUser.coins ?? appUser.coins,
          wins: dbUser.wins ?? appUser.wins,
          battles: dbUser.battles ?? appUser.battles,
          rank: isAdmin ? 'Super Admin 👑' : (dbUser.rank || appUser.rank),
          role: isAdmin ? 'admin' : 'resident',
          isAdmin,
          createdAt: dbUser.created_at || appUser.createdAt,
        };
      }
    } catch (err) {
      console.warn('Error fetching database user profile:', err);
    }

    return { user: appUser, session: data.session || null };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error: err?.message || 'लॉगिन विफल रहा।',
    };
  }
}

/* ============================================================
   GOOGLE OAUTH SIGN IN
   ============================================================ */

export async function signInWithGoogle(
  redirectToUrl?: string
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Supabase कॉन्फ़िगर नहीं है। कृपया Supabase URL और Anon Key सेट करें।',
    };
  }

  try {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTarget = redirectToUrl || origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      const errLower = error.message.toLowerCase();
      if (
        errLower.includes('provider is not enabled') ||
        errLower.includes('unsupported provider')
      ) {
        return {
          error:
            'Google Provider Supabase में सक्रिय (Enable) नहीं है। कृपया Supabase Dashboard -> Authentication -> Providers -> Google को Enable करें।',
        };
      }
      return { error: error.message };
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }

    return {};
  } catch (err: any) {
    return {
      error:
        err?.message ||
        'Google साइन-इन शुरू करने में समस्या आई। पुनः प्रयास करें।',
    };
  }
}

/* ============================================================
   PASSWORD RESET
   ============================================================ */

export async function sendPasswordResetEmail(
  email: string,
  redirectToUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email is required.' };
  }

  const redirectTarget =
    redirectToUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/#reset-password`
      : '');

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      { redirectTo: redirectTarget }
    );
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Password reset failed.',
    };
  }
}

export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters.',
    };
  }

  try {
    const currentUser = await getCurrentSupabaseUser();
    if (!currentUser) {
      return { success: false, error: 'User is not logged in.' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Could not update password.',
    };
  }
}

/* ============================================================
   SIGN OUT
   ============================================================ */

export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

/* ============================================================
   SYNC PROFILE
   ============================================================ */

export async function syncUserProfile(user: User): Promise<void> {
  if (!isSupabaseConfigured() || !user?.id) return;
  try {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email?.toLowerCase().trim() || null,
        name: user.name,
        avatar: user.avatar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Could not sync user profile:', err);
  }
}

export async function updateUserProfileDetails(
  userId: string,
  updates: { name?: string; phone?: string | null; avatar?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  try {
    const currentUser = await getCurrentSupabaseUser();
    if (!currentUser) {
      return { success: false, error: 'User is not authenticated.' };
    }
    if (currentUser.id !== userId) {
      return { success: false, error: 'Unauthorized profile update.' };
    }

    const cleanName =
      updates.name !== undefined ? updates.name.trim() : undefined;
    const cleanPhone =
      updates.phone !== undefined ? updates.phone?.trim() || null : undefined;
    const cleanAvatar =
      updates.avatar !== undefined ? updates.avatar.trim() : undefined;

    const authMetadata: Record<string, any> = {};
    if (cleanName !== undefined) {
      authMetadata.full_name = cleanName;
      authMetadata.name = cleanName;
    }
    if (cleanPhone !== undefined) authMetadata.phone = cleanPhone;
    if (cleanAvatar !== undefined) authMetadata.avatar_url = cleanAvatar;

    if (Object.keys(authMetadata).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: authMetadata,
      });
      if (authError) {
        return { success: false, error: authError.message };
      }
    }

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanName !== undefined) dbPayload.name = cleanName;
    if (cleanAvatar !== undefined) dbPayload.avatar = cleanAvatar;

    const { error: dbError } = await supabase
      .from('users')
      .update(dbPayload)
      .eq('id', userId);
    if (dbError) {
      return { success: false, error: dbError.message };
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to update profile.',
    };
  }
}

/* ============================================================
   FETCH USERS (Admin)
   ============================================================ */

export async function fetchSupabaseRegisteredUsers(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id,name,email,avatar,badge,rank,role,is_admin,coins,wins,battles,created_at'
      )
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/* ============================================================
   FETCH CONTENT
   ============================================================ */

export async function fetchSupabaseNews(): Promise<NewsItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.image_url,
      author: item.author,
      published: item.published ?? true,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
      views: item.views || 0,
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabasePeople(): Promise<PersonProfile[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      designation: item.designation,
      bio: item.bio,
      photoUrl: item.photo_url,
      achievements: item.achievements,
      category: item.category,
      published: item.published ?? true,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseBusiness(): Promise<BusinessItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('business')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      phone: item.phone,
      address: item.address,
      description: item.description,
      logoUrl: item.logo_url,
      verified: item.verified ?? true,
      published: item.published ?? true,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseGallery(): Promise<GalleryItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      imageUrl: item.image_url,
      caption: item.caption,
      published: item.published ?? true,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseVideos(): Promise<VideoItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      videoUrl: item.video_url,
      thumbnailUrl: item.thumbnail_url,
      description: item.description,
      published: item.published ?? true,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
      views: item.views || 0,
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseUpdates(): Promise<CommunityUpdate[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      tag: item.tag,
      badgeColor: item.badge_color || 'amber',
      published: item.published ?? true,
      date: item.date || 'Recent',
      linkUrl: item.link_url,
      createdAt: item.created_at
        ? new Date(item.created_at).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseBattles(): Promise<BattleEvent[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('battles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      description: b.description,
      optionA: b.option_a,
      optionB: b.option_b,
      isEnded: Boolean(b.is_ended),
      startsAt: b.starts_at
        ? new Date(b.starts_at).getTime()
        : Date.now(),
      endsAt: b.ends_at
        ? new Date(b.ends_at).getTime()
        : Date.now() + 86400000 * 3,
      published: b.published ?? true,
      status: b.status || (b.is_ended ? 'closed' : 'active'),
      winnerOptionId: b.winner_option_id,
    }));
  } catch {
    return null;
  }
}

/* ============================================================
   CHAT (24-Hour Choupal)
   ============================================================ */

export async function fetchSupabaseChatMessages(): Promise<ChatMessage[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const client = createServerClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - CHAT_MESSAGE_EXPIRATION_MS
    ).toISOString();

    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true })
      .limit(250);

    if (error || !data) return null;

    return data
      .map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        userName: m.user_name,
        userAvatar: m.user_avatar,
        userBadge: m.user_badge,
        text: m.text,
        timestamp: m.created_at
          ? new Date(m.created_at).getTime()
          : Date.now(),
        sticker: m.sticker || undefined,
        isAi: Boolean(m.is_ai),
        isVerified:
          Boolean(m.is_verified) ||
          m.user_id === 'dhoti_aale_ai_official' ||
          m.user_name === 'DHOTI AALE AI',
      }))
      .filter(
        (message) =>
          Date.now() - message.timestamp <= CHAT_MESSAGE_EXPIRATION_MS
      );
  } catch {
    return null;
  }
}

export async function insertSupabaseChatMessage(
  msg: ChatMessage
): Promise<boolean> {
  if (!isSupabaseConfigured() || !msg?.userId || !msg?.id) return false;
  try {
    const client = createServerClient();
    const createdAt = msg.timestamp || Date.now();
    if (Date.now() - createdAt > CHAT_MESSAGE_EXPIRATION_MS) return false;

    const payload: Record<string, any> = {
      id: msg.id,
      user_id: msg.userId,
      user_name: msg.userName,
      user_avatar: msg.userAvatar,
      user_badge: msg.userBadge,
      text: msg.text || '',
      sticker: msg.sticker || null,
      is_ai: Boolean(msg.isAi),
      created_at: new Date(createdAt).toISOString(),
    };

    const { error } = await client
      .from('chat_messages')
      .insert(payload);

    if (error) {
      console.warn('Could not insert chat message:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Chat insert error:', err);
    return false;
  }
}

export async function deleteSupabaseChatMessage(
  messageId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !messageId) return false;
  try {
    const client = createServerClient();
    const { error } = await client
      .from('chat_messages')
      .delete()
      .eq('id', messageId);
    if (error) {
      console.warn('Could not delete chat message:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function cleanupExpiredSupabaseChatMessages(): Promise<{
  success: boolean;
  deleted?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  try {
    const client = createServerClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - CHAT_MESSAGE_EXPIRATION_MS
    ).toISOString();

    const { data: expiredRows } = await client
      .from('chat_messages')
      .select('id')
      .lt('created_at', twentyFourHoursAgo);

    const expiredCount = expiredRows?.length || 0;
    if (expiredCount === 0) {
      return { success: true, deleted: 0 };
    }

    const { error } = await client
      .from('chat_messages')
      .delete()
      .lt('created_at', twentyFourHoursAgo);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, deleted: expiredCount };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Chat cleanup failed.',
    };
  }
}

/* ============================================================
   VOTES (Legacy — Use /api/battles/vote instead)
   ============================================================ */

export async function recordSupabaseVote(
  battleId: string,
  userEmail: string,
  optionId: string,
  userId?: string
): Promise<{
  success: boolean;
  error?: string;
  alreadyVoted?: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  if (!battleId || !optionId) {
    return {
      success: false,
      error: 'Battle ID and option ID are required.',
    };
  }

  try {
    const cleanEmail = userEmail?.trim().toLowerCase() || '';
    const currentUser = await getCurrentSupabaseUser();
    const authenticatedUserId = currentUser?.id || userId || null;

    if (!authenticatedUserId) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const { data: existingByUser } = await supabase
      .from('battle_votes')
      .select('id,option_id')
      .eq('battle_id', battleId)
      .eq('user_id', authenticatedUserId)
      .maybeSingle();

    if (existingByUser) {
      return { success: false, alreadyVoted: true };
    }

    const votePayload: Record<string, any> = {
      battle_id: battleId,
      user_id: authenticatedUserId,
      option_id: optionId,
      created_at: new Date().toISOString(),
    };

    if (cleanEmail) {
      votePayload.user_email = cleanEmail;
    }

    const { error } = await supabase
      .from('battle_votes')
      .insert(votePayload);

    if (error) {
      if (error.code === '23505') {
        return { success: false, alreadyVoted: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Vote failed.',
    };
  }
}

/* ============================================================
   SITE SETTINGS
   ============================================================ */

export async function fetchSupabaseSettings(): Promise<SiteSettings | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return null;

    return {
      siteTitle: data.site_title || 'DHOTI AALE',
      siteTagline: data.site_tagline || 'Chat • Battle • AI Assistant',
      announcementBanner: data.announcement_banner || '',
      isAnnouncementActive: data.is_announcement_active ?? true,
      allowWorldChat: data.allow_world_chat ?? true,
      allowGuestAi: data.allow_guest_ai ?? true,
      heroBadge: data.hero_badge || 'Pure Desi Vibe • 100% Real Community 👑',
      contactEmail: data.contact_email || 'rohitdhakaddhoti143@gmail.com',
    };
  } catch {
    return null;
  }
}