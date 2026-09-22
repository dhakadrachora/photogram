import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSiteAdmin } from '@/lib/admin-auth';
import { User } from '@/types';

const DEFAULT_SUPABASE_URL =
  'https://zlngcbefvdtbihndaeun.supabase.co';

const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_JxGddMQ5KqRFTANuZG2TGg_I05TTskS';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(
  req: NextRequest
): Promise<NextResponse> {
  try {
    const body = await req.json();

    const email =
      typeof body?.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body?.password === 'string'
        ? body.password
        : '';

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'ईमेल और पासवर्ड आवश्यक हैं।',
        },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    /*
     * IMPORTANT:
     * Authentication is handled ONLY by Supabase Auth.
     * The old fallbackAccounts/passwordHash system has
     * intentionally been removed.
     */
    const {
      data: authData,
      error: authError,
    } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (
      authError ||
      !authData.user ||
      !authData.session
    ) {
      console.error(
        'Supabase login failed:',
        authError?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ईमेल या पासवर्ड गलत है। कृपया पुनः जांचें।',
        },
        { status: 401 }
      );
    }

    const authUser = authData.user;

    /*
     * Load the user's public profile.
     * Authentication has already been verified by
     * Supabase Auth above.
     */
    let dbUser: any = null;

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn(
          'Could not load user profile:',
          error.message
        );
      } else {
        dbUser = data;
      }
    } catch (error) {
      console.warn(
        'User profile lookup failed:',
        error
      );
    }

    /*
     * If the profile does not exist yet, create a
     * minimal application user from Supabase Auth data.
     */
    const adminUser = isSiteAdmin(email);

    const appUser: User = {
      id: authUser.id,
      name:
        dbUser?.name ||
        authUser.user_metadata?.name ||
        email.split('@')[0],
      email,
      avatar:
        dbUser?.avatar ||
        authUser.user_metadata?.avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          email
        )}`,
      phone:
        authUser.phone ||
        authUser.user_metadata?.phone ||
        undefined,
      badge:
        adminUser
          ? 'Site Owner & Admin 👑'
          : (dbUser?.badge?.includes('Owner') ? 'Dhoti Resident' : (dbUser?.badge || 'Dhoti Resident')),
      coins:
        typeof dbUser?.coins === 'number'
          ? dbUser.coins
          : 50,
      wins:
        typeof dbUser?.wins === 'number'
          ? dbUser.wins
          : 0,
      battles:
        typeof dbUser?.battles === 'number'
          ? dbUser.battles
          : 0,
      rank:
        adminUser
          ? 'Super Admin 👑'
          : (dbUser?.rank || 'Resident'),
      role:
        adminUser
          ? 'admin'
          : 'resident',
      isAdmin: adminUser,
      createdAt:
        dbUser?.created_at ||
        authUser.created_at ||
        Date.now(),
    };

    /*
     * Return the real Supabase session so the client
     * can authenticate subsequent API requests with
     * the Bearer access token.
     */
    return NextResponse.json({
      success: true,
      user: appUser,
      session: {
        access_token:
          authData.session.access_token,
        refresh_token:
          authData.session.refresh_token,
        expires_at:
          authData.session.expires_at,
        expires_in:
          authData.session.expires_in,
        token_type:
          authData.session.token_type,
      },
      isFallbackAccount: false,
    });
  } catch (err: any) {
    console.error(
      'Login route error:',
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          'लॉगिन में समस्या आई।',
      },
      { status: 500 }
    );
  }
}