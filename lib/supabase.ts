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

const DEFAULT_SUPABASE_URL =
  'https://zlngcbefvdtbihndaeun.supabase.co';

const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_JxGddMQ5KqRFTANuZG2TGg_I05TTskS';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

/**
 * World Chat messages expire after 10 minutes.
 */
export const CHAT_MESSAGE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Check Supabase configuration.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('placeholder')
  );
};

/**
 * Main Supabase client.
 *
 * IMPORTANT:
 * Never put a Supabase service-role key in this file.
 * This file uses the publishable/anon key only.
 */
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
 * Get currently authenticated Supabase user.
 */
export async function getCurrentSupabaseUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Get current Supabase session.
 */
export async function getCurrentSupabaseSession() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Maps Supabase Auth user to DHOTI AALE User model.
 *
 * IMPORTANT:
 * This function does NOT give the client permission to change
 * admin fields. It only creates the application's read model.
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
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      sbUser.id
    )}`;

  const phone = metadata.phone || undefined;

  return {
    id: sbUser.id,
    name,
    email,
    avatar,
    phone,

    badge: admin
      ? 'Site Owner & Admin 👑'
      : 'Dhoti Resident',

    coins: 50,
    wins: 0,
    battles: 0,

    rank: admin
      ? 'Super Admin 👑'
      : 'Resident',

    isGoogle: false,

    role: admin
      ? 'admin'
      : 'resident',

    isAdmin: admin,

    createdAt: sbUser.created_at || Date.now(),
  };
}

/**
 * Sign up with Supabase Email + Password.
 *
 * SECURITY:
 * - No fake/random fallback account.
 * - No local password storage.
 * - No password in public.users.
 * - Supabase Auth is the only authentication source.
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
}): Promise<{
  user: User | null;
  session: any | null;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      session: null,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone?.trim() || null;

  const cleanAvatar =
    avatarUrl?.trim() ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      cleanEmail
    )}`;

  if (!cleanEmail) {
    return {
      user: null,
      session: null,
      error: 'Email is required.',
    };
  }

  if (!cleanName) {
    return {
      user: null,
      session: null,
      error: 'Name is required.',
    };
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
      return {
        user: null,
        session: null,
        error: error.message,
      };
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

    /**
     * Only basic profile information is synced here.
     *
     * DO NOT write:
     * - role
     * - is_admin
     * - coins
     * - rank
     * - badge
     * - wins
     * - battles
     *
     * Those are protected server/admin fields.
     */
    try {
      await supabase.from('users').upsert(
        {
          id: data.user.id,
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          avatar: cleanAvatar,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      );
    } catch (err) {
      console.warn(
        'Could not create public.users profile:',
        err
      );
    }

    return {
      user: appUser,
      session: data.session || null,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error:
        err?.message ||
        'Signup failed. Please try again.',
    };
  }
}

/**
 * Sign in existing user with Supabase Email + Password.
 *
 * IMPORTANT:
 * There is NO fallback authentication route here.
 *
 * If Supabase Auth rejects the password,
 * login must fail.
 */
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
    return {
      user: null,
      session: null,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
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
    const { data, error } =
      await supabase.auth.signInWithPassword({
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

    let appUser =
      mapSupabaseUserToAppUser(data.user);

    try {
      const { data: dbUser, error: dbError } =
        await supabase
          .from('users')
          .select(
            'id,name,email,phone,avatar,badge,coins,wins,battles,rank,role,is_admin,is_verified,is_blocked,chat_blocked,created_at'
          )
          .eq('id', data.user.id)
          .maybeSingle();

      if (!dbError && dbUser) {
        const isAdmin =
          isSiteAdmin(cleanEmail) ||
          Boolean(dbUser.is_admin);

        appUser = {
          ...appUser,

          name:
            dbUser.name ||
            appUser.name,

          avatar:
            dbUser.avatar ||
            appUser.avatar,

          phone:
            dbUser.phone ||
            appUser.phone,

          badge:
            dbUser.badge ||
            appUser.badge,

          coins:
            dbUser.coins ??
            appUser.coins,

          wins:
            dbUser.wins ??
            appUser.wins,

          battles:
            dbUser.battles ??
            appUser.battles,

          rank:
            dbUser.rank ||
            appUser.rank,

          role:
            dbUser.role ||
            appUser.role,

          isAdmin,

          createdAt:
            dbUser.created_at ||
            appUser.createdAt,
        };
      } else {
        await syncUserProfile(appUser);
      }
    } catch (err) {
      console.warn(
        'Error fetching database user profile:',
        err
      );
    }

    return {
      user: appUser,
      session: data.session || null,
    };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      error:
        err?.message ||
        'लॉगिन विफल रहा।',
    };
  }
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(
  email: string,
  redirectToUrl?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  const cleanEmail =
    email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      error: 'Email is required.',
    };
  }

  const redirectTarget =
    redirectToUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/#reset-password`
      : '');

  try {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: redirectTarget,
        }
      );

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Password reset failed.',
    };
  }
}

/**
 * Update password for currently authenticated user.
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error:
        'Password must be at least 6 characters.',
    };
  }

  try {
    const currentUser =
      await getCurrentSupabaseUser();

    if (!currentUser) {
      return {
        success: false,
        error: 'User is not logged in.',
      };
    }

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Could not update password.',
    };
  }
}

/**
 * Sign out.
 */
export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn(
      'Supabase signOut error:',
      err
    );
  }
}

/**
 * Sync basic user profile.
 *
 * SECURITY:
 * This function deliberately does NOT write protected fields.
 */
export async function syncUserProfile(
  user: User
): Promise<void> {
  if (
    !isSupabaseConfigured() ||
    !user?.id
  ) {
    return;
  }

  try {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email:
          user.email
            ?.toLowerCase()
            .trim() || null,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone || null,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );
  } catch (err) {
    console.warn(
      'Could not sync user profile:',
      err
    );
  }
}

/**
 * Update editable user profile details.
 *
 * Editable:
 * - name
 * - phone
 * - avatar
 *
 * NOT editable here:
 * - role
 * - is_admin
 * - coins
 * - rank
 * - badge
 * - wins
 * - battles
 */
export async function updateUserProfileDetails(
  userId: string,
  updates: {
    name?: string;
    phone?: string | null;
    avatar?: string;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  try {
    const currentUser =
      await getCurrentSupabaseUser();

    if (!currentUser) {
      return {
        success: false,
        error: 'User is not authenticated.',
      };
    }

    /**
     * User can only update their own profile.
     */
    if (currentUser.id !== userId) {
      return {
        success: false,
        error: 'Unauthorized profile update.',
      };
    }

    const cleanName =
      updates.name !== undefined
        ? updates.name.trim()
        : undefined;

    const cleanPhone =
      updates.phone !== undefined
        ? updates.phone?.trim() || null
        : undefined;

    const cleanAvatar =
      updates.avatar !== undefined
        ? updates.avatar.trim()
        : undefined;

    /**
     * Update Supabase Auth metadata.
     */
    const authMetadata: Record<string, any> = {};

    if (cleanName !== undefined) {
      authMetadata.full_name = cleanName;
      authMetadata.name = cleanName;
    }

    if (cleanPhone !== undefined) {
      authMetadata.phone = cleanPhone;
    }

    if (cleanAvatar !== undefined) {
      authMetadata.avatar_url = cleanAvatar;
    }

    if (Object.keys(authMetadata).length > 0) {
      const { error: authError } =
        await supabase.auth.updateUser({
          data: authMetadata,
        });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }
    }

    /**
     * Update only editable database columns.
     */
    const dbPayload: Record<string, any> = {
      updated_at:
        new Date().toISOString(),
    };

    if (cleanName !== undefined) {
      dbPayload.name = cleanName;
    }

    if (cleanPhone !== undefined) {
      dbPayload.phone = cleanPhone;
    }

    if (cleanAvatar !== undefined) {
      dbPayload.avatar = cleanAvatar;
    }

    const { error: dbError } =
      await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', userId);

    if (dbError) {
      return {
        success: false,
        error: dbError.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Failed to update profile.',
    };
  }
}

/**
 * Fetch registered users for admin view.
 *
 * NOTE:
 * This function should only be called from trusted admin UI/API.
 * RLS/server authorization must still enforce admin access.
 */
export async function fetchSupabaseRegisteredUsers(): Promise<
  any[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('users')
        .select(
          'id,name,email,phone,avatar,badge,rank,role,is_admin,coins,wins,battles,is_verified,is_blocked,chat_blocked,created_at'
        )
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * NEWS
 */
export async function fetchSupabaseNews(): Promise<
  NewsItem[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('news')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.image_url,
      author: item.author,
      published:
        item.published ?? true,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
      views: item.views || 0,
    }));
  } catch {
    return null;
  }
}

/**
 * PEOPLE
 */
export async function fetchSupabasePeople(): Promise<
  PersonProfile[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('people')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      designation: item.designation,
      bio: item.bio,
      photoUrl: item.photo_url,
      achievements: item.achievements,
      category: item.category,
      published:
        item.published ?? true,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

/**
 * BUSINESS
 */
export async function fetchSupabaseBusiness(): Promise<
  BusinessItem[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('business')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      phone: item.phone,
      address: item.address,
      description: item.description,
      logoUrl: item.logo_url,
      verified:
        item.verified ?? true,
      published:
        item.published ?? true,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

/**
 * GALLERY
 */
export async function fetchSupabaseGallery(): Promise<
  GalleryItem[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('gallery')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      imageUrl: item.image_url,
      caption: item.caption,
      published:
        item.published ?? true,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

/**
 * VIDEOS
 */
export async function fetchSupabaseVideos(): Promise<
  VideoItem[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('videos')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      videoUrl: item.video_url,
      thumbnailUrl:
        item.thumbnail_url,
      description:
        item.description,
      published:
        item.published ?? true,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
      views: item.views || 0,
    }));
  } catch {
    return null;
  }
}

/**
 * COMMUNITY UPDATES
 */
export async function fetchSupabaseUpdates(): Promise<
  CommunityUpdate[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('updates')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      tag: item.tag,
      badgeColor:
        item.badge_color || 'amber',
      published:
        item.published ?? true,
      date:
        item.date || 'Recent',
      linkUrl: item.link_url,
      createdAt: item.created_at
        ? new Date(
            item.created_at
          ).getTime()
        : Date.now(),
    }));
  } catch {
    return null;
  }
}

/**
 * BATTLES
 */
export async function fetchSupabaseBattles(): Promise<
  BattleEvent[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } =
      await supabase
        .from('battles')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error || !data) {
      return null;
    }

    return data.map((b: any) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      description: b.description,
      optionA: b.option_a,
      optionB: b.option_b,
      isEnded: Boolean(
        b.is_ended
      ),
      startsAt: b.starts_at
        ? new Date(
            b.starts_at
          ).getTime()
        : Date.now(),
      endsAt: b.ends_at
        ? new Date(
            b.ends_at
          ).getTime()
        : Date.now() +
          86400000 * 3,
      published:
        b.published ?? true,
      status:
        b.status ||
        (b.is_ended
          ? 'closed'
          : 'active'),
      winnerOptionId:
        b.winner_option_id,
    }));
  } catch {
    return null;
  }
}

/**
 * WORLD CHAT
 *
 * ONLY the last 10 minutes are loaded.
 */
export async function fetchSupabaseChatMessages(): Promise<
  ChatMessage[] | null
> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const tenMinutesAgo =
      new Date(
        Date.now() -
          CHAT_MESSAGE_EXPIRATION_MS
      ).toISOString();

    const { data, error } =
      await supabase
        .from('chat_messages')
        .select('*')
        .gte(
          'created_at',
          tenMinutesAgo
        )
        .order('created_at', {
          ascending: true,
        })
        .limit(250);

    if (error || !data) {
      return null;
    }

    return data
      .map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        userName: m.user_name,
        userAvatar: m.user_avatar,
        userBadge: m.user_badge,
        text: m.text,
        timestamp: m.created_at
          ? new Date(
              m.created_at
            ).getTime()
          : Date.now(),
        sticker:
          m.sticker || undefined,
        isAi: Boolean(m.is_ai),
        isVerified:
          Boolean(m.is_verified) ||
          m.user_id ===
            'dhoti_aale_ai_official' ||
          m.user_name ===
            'DHOTI AALE AI',
      }))
      .filter(
        (message) =>
          Date.now() -
            message.timestamp <=
          CHAT_MESSAGE_EXPIRATION_MS
      );
  } catch {
    return null;
  }
}

/**
 * INSERT WORLD CHAT MESSAGE
 */
export async function insertSupabaseChatMessage(
  msg: ChatMessage
): Promise<boolean> {
  if (
    !isSupabaseConfigured() ||
    !msg?.userId ||
    !msg?.id
  ) {
    return false;
  }

  try {
    const createdAt =
      msg.timestamp || Date.now();

    /**
     * Do not allow insertion of an already-expired message.
     */
    if (
      Date.now() - createdAt >
      CHAT_MESSAGE_EXPIRATION_MS
    ) {
      return false;
    }

    const payload: Record<
      string,
      any
    > = {
      id: msg.id,
      user_id: msg.userId,
      user_name: msg.userName,
      user_avatar: msg.userAvatar,
      user_badge: msg.userBadge,
      text: msg.text || '',
      sticker: msg.sticker || null,
      is_ai: Boolean(msg.isAi),
      is_verified: Boolean(
        msg.isVerified
      ),
      created_at:
        new Date(
          createdAt
        ).toISOString(),
    };

    const { error } =
      await supabase
        .from('chat_messages')
        .insert(payload);

    if (error) {
      console.warn(
        'Could not insert chat message:',
        error.message
      );

      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      'Chat insert error:',
      err
    );

    return false;
  }
}

/**
 * DELETE WORLD CHAT MESSAGE
 */
export async function deleteSupabaseChatMessage(
  messageId: string
): Promise<boolean> {
  if (
    !isSupabaseConfigured() ||
    !messageId
  ) {
    return false;
  }

  try {
    const { error } =
      await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
      console.warn(
        'Could not delete chat message:',
        error.message
      );

      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * DELETE ALL EXPIRED WORLD CHAT MESSAGES.
 *
 * Expiration = 10 minutes.
 *
 * This function can be called by:
 * - /api/chat GET
 * - a scheduled Supabase job
 * - an admin cleanup endpoint
 */
export async function cleanupExpiredSupabaseChatMessages(): Promise<{
  success: boolean;
  deleted?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  try {
    const tenMinutesAgo =
      new Date(
        Date.now() -
          CHAT_MESSAGE_EXPIRATION_MS
      ).toISOString();

    /**
     * First find expired IDs so we can return a useful count.
     */
    const { data: expiredRows } =
      await supabase
        .from('chat_messages')
        .select('id')
        .lt(
          'created_at',
          tenMinutesAgo
        );

    const expiredCount =
      expiredRows?.length || 0;

    if (expiredCount === 0) {
      return {
        success: true,
        deleted: 0,
      };
    }

    const { error } =
      await supabase
        .from('chat_messages')
        .delete()
        .lt(
          'created_at',
          tenMinutesAgo
        );

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      deleted: expiredCount,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Chat cleanup failed.',
    };
  }
}

/**
 * RECORD BATTLE VOTE
 *
 * NOTE:
 * Real authorization must still happen in the API route.
 * The frontend must never be trusted for voter identity.
 */
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
    return {
      success: false,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  if (
    !battleId ||
    !optionId
  ) {
    return {
      success: false,
      error:
        'Battle ID and option ID are required.',
    };
  }

  try {
    const cleanEmail =
      userEmail
        ?.trim()
        .toLowerCase() || '';

    /**
     * Prefer the authenticated Supabase user.
     */
    const currentUser =
      await getCurrentSupabaseUser();

    const authenticatedUserId =
      currentUser?.id ||
      userId ||
      null;

    if (!authenticatedUserId) {
      return {
        success: false,
        error: 'User is not authenticated.',
      };
    }

    /**
     * Check duplicate by authenticated user ID.
     */
    const {
      data: existingByUser,
    } = await supabase
      .from('battle_votes')
      .select(
        'id,option_id'
      )
      .eq(
        'battle_id',
        battleId
      )
      .eq(
        'user_id',
        authenticatedUserId
      )
      .maybeSingle();

    if (existingByUser) {
      return {
        success: false,
        alreadyVoted: true,
      };
    }

    /**
     * Insert vote.
     *
     * user_id is the important identity.
     * user_email is retained only for compatibility
     * with the existing database schema.
     */
    const votePayload: Record<
      string,
      any
    > = {
      battle_id: battleId,
      user_id:
        authenticatedUserId,
      option_id: optionId,
      created_at:
        new Date().toISOString(),
    };

    if (cleanEmail) {
      votePayload.user_email =
        cleanEmail;
    }

    const { error } =
      await supabase
        .from('battle_votes')
        .insert(votePayload);

    if (error) {
      if (
        error.code === '23505'
      ) {
        return {
          success: false,
          alreadyVoted: true,
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Vote failed.',
    };
  }
}