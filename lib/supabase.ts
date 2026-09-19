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

const DEFAULT_SUPABASE_URL = 'https://zlngcbefvdtbihndaeun.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JxGddMQ5KqRFTANuZG2TGg_I05TTskS';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Client initialization with provided Supabase project credentials
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

/**
 * Maps Supabase Auth user to DHOTI AALE User model.
 */
export function mapSupabaseUserToAppUser(sbUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
  created_at?: string;
}): User {
  const email = (sbUser.email || '').trim().toLowerCase();
  const metadata = sbUser.user_metadata || {};
  const admin = isSiteAdmin(email);

  const name =
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'Dhoti Resident');

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${sbUser.id}`;

  const phone = metadata.phone || undefined;

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
    isGoogle: false,
    role: admin ? 'admin' : 'resident',
    isAdmin: admin,
    createdAt: sbUser.created_at || Date.now(),
  };
}

/**
 * Sign up a new user using Supabase Email + Password.
 * Saves profile data (name, email, phone, avatar) to public.users table.
 * Passwords are encrypted by Supabase Auth and NEVER stored in public.users.
 */
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
}): Promise<{ user: User | null; session: any | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone?.trim() || null;
  const cleanAvatar = avatarUrl?.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

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
    return { user: null, session: null, error: 'Signup did not return user.' };
  }

  const appUser = mapSupabaseUserToAppUser({
    ...data.user,
    user_metadata: {
      full_name: cleanName,
      name: cleanName,
      phone: cleanPhone,
      avatar_url: cleanAvatar,
    },
  });

  // Save profile to public.users table (passwords are NEVER stored here)
  try {
    await supabase.from('users').upsert(
      {
        id: appUser.id,
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        avatar: cleanAvatar,
        badge: appUser.badge,
        coins: 50,
        wins: 0,
        battles: 0,
        rank: appUser.rank,
        role: appUser.role,
        is_admin: Boolean(appUser.isAdmin),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Could not upsert user to public.users:', err);
  }

  let finalSession = data.session;
  if (!finalSession) {
    try {
      const signInRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInRes.data?.session) {
        finalSession = signInRes.data.session;
      }
    } catch {
      // ignore
    }
  }

  return { user: appUser, session: finalSession };
}

/**
 * Sign in existing user with Supabase Email + Password.
 */
export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: User | null; session: any | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  if (!data.user) {
    return { user: null, session: null, error: 'Sign in failed.' };
  }

  let appUser = mapSupabaseUserToAppUser(data.user);

  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (dbUser) {
      appUser = {
        ...appUser,
        name: dbUser.name || appUser.name,
        avatar: dbUser.avatar || appUser.avatar,
        phone: dbUser.phone || appUser.phone,
        badge: dbUser.badge || appUser.badge,
        coins: dbUser.coins ?? appUser.coins,
        wins: dbUser.wins ?? appUser.wins,
        battles: dbUser.battles ?? appUser.battles,
        rank: dbUser.rank || appUser.rank,
        role: dbUser.role || appUser.role,
        isAdmin: Boolean(dbUser.is_admin) || isSiteAdmin(cleanEmail),
        createdAt: dbUser.created_at || appUser.createdAt,
      };
    } else {
      void syncUserProfile(appUser);
    }
  } catch (err) {
    console.warn('Error fetching db user profile:', err);
  }

  return { user: appUser, session: data.session };
}

/**
 * Send password reset email via Supabase.
 */
export async function sendPasswordResetEmail(
  email: string,
  redirectToUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const redirectTarget =
    redirectToUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : '');

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectTarget,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Set a new password for the current authenticated user (used after reset link).
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Supabase sign-out.
 */
export async function signOutSupabase() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
  }
}

/**
 * Sync user profile to Supabase `users` table.
 * Passwords are encrypted by Supabase Auth and NEVER stored here.
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!isSupabaseConfigured() || !user.email) return;

  try {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email.toLowerCase().trim(),
        name: user.name,
        avatar: user.avatar,
        phone: user.phone || null,
        badge: user.badge,
        coins: user.coins || 0,
        wins: user.wins || 0,
        battles: user.battles || 0,
        rank: user.rank || 'Resident',
        role: user.role || 'resident',
        is_admin: Boolean(user.isAdmin),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Could not sync user profile to Supabase:', err);
  }
}

/**
 * Update user profile details (phone, avatar, name) in Supabase.
 * Updates both Supabase Auth metadata and the public.users record.
 */
export async function updateUserProfileDetails(
  userId: string,
  updates: { name?: string; phone?: string | null; avatar?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }

  try {
    // 1. Update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          ...(updates.name ? { full_name: updates.name, name: updates.name } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone || null } : {}),
          ...(updates.avatar ? { avatar_url: updates.avatar } : {}),
        },
      });
    } catch (e) {
      console.warn('Could not update Supabase Auth user metadata:', e);
    }

    // 2. Update public.users database row
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name) dbPayload.name = updates.name;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone || null;
    if (updates.avatar) dbPayload.avatar = updates.avatar;

    const { error: dbError } = await supabase
      .from('users')
      .update(dbPayload)
      .eq('id', userId);

    if (dbError) {
      console.warn('Could not update users table:', dbError);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update profile' };
  }
}

/**
 * Fetch all registered users for Admin view.
 * Passwords are NEVER queried or exposed.
 */
export async function fetchSupabaseRegisteredUsers() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, avatar, badge, rank, role, is_admin, coins, wins, created_at')
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Database Fetch Helpers
 */
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
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
      startsAt: b.starts_at ? new Date(b.starts_at).getTime() : Date.now(),
      endsAt: b.ends_at ? new Date(b.ends_at).getTime() : Date.now() + 86400000 * 3,
      published: b.published ?? true,
      status: b.status || (b.is_ended ? 'closed' : 'active'),
      winnerOptionId: b.winner_option_id,
    }));
  } catch {
    return null;
  }
}

export async function fetchSupabaseChatMessages(): Promise<ChatMessage[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (error || !data) return null;
    return data.map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      userName: m.user_name,
      userAvatar: m.user_avatar,
      userBadge: m.user_badge,
      text: m.text,
      timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      sticker: m.sticker || undefined,
      isAi: Boolean(m.is_ai),
    }));
  } catch {
    return null;
  }
}

export async function insertSupabaseChatMessage(msg: ChatMessage): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('chat_messages').insert({
      id: msg.id,
      user_id: msg.userId,
      user_name: msg.userName,
      user_avatar: msg.userAvatar,
      user_badge: msg.userBadge,
      text: msg.text,
      sticker: msg.sticker || null,
      is_ai: Boolean(msg.isAi),
      created_at: new Date(msg.timestamp).toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function recordSupabaseVote(
  battleId: string,
  userEmail: string,
  optionId: string,
  userId?: string
): Promise<{ success: boolean; error?: string; alreadyVoted?: boolean }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }
  try {
    // Check if user already voted in this battle
    const { data: existing } = await supabase
      .from('battle_votes')
      .select('id, option_id')
      .eq('battle_id', battleId)
      .eq('user_email', userEmail.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return { success: false, alreadyVoted: true };
    }

    const { error } = await supabase.from('battle_votes').insert({
      battle_id: battleId,
      user_email: userEmail.toLowerCase().trim(),
      user_id: userId || null,
      option_id: optionId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return { success: false, alreadyVoted: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
