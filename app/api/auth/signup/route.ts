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

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function createAppUser(
  id: string,
  cleanEmail: string,
  cleanName: string,
  cleanPhone: string | null,
  cleanAvatar: string,
  adminUser: boolean
): User {
  return {
    id,
    name: cleanName,
    email: cleanEmail,
    avatar: cleanAvatar,
    phone: cleanPhone || undefined,
    badge: adminUser
      ? 'Site Owner & Admin 👑'
      : 'Dhoti Resident',
    coins: 50,
    wins: 0,
    battles: 0,
    rank: adminUser
      ? 'Super Admin 👑'
      : 'Resident',
    isGoogle: false,
    role: adminUser ? 'admin' : 'resident',
    isAdmin: adminUser,
    createdAt: Date.now(),
  };
}

/**
 * Save user profile.
 *
 * `any` is intentionally used here because this project
 * does not currently provide generated Supabase Database
 * types for the public.users table.
 */
async function savePublicUser(
  client: any,
  appUser: User
): Promise<boolean> {
  try {
    const { error } = await client
      .from('users')
      .upsert(
        {
          id: appUser.id,
          email: appUser.email,
          name: appUser.name,
          avatar: appUser.avatar,
          badge: appUser.badge,
          coins: appUser.coins ?? 50,
          wins: appUser.wins ?? 0,
          battles: appUser.battles ?? 0,
          rank: appUser.rank || 'Resident',
          role: appUser.role || 'resident',
          is_admin: Boolean(appUser.isAdmin),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      );

    if (error) {
      console.warn(
        'Could not save public.users profile:',
        error.message
      );

      return false;
    }

    return true;
  } catch (error) {
    console.warn(
      'Could not save public.users profile:',
      error
    );

    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      name,
      phone,
      avatarUrl,
    } = body;

    const cleanEmail = String(email || '')
      .trim()
      .toLowerCase();

    const cleanName = String(name || '').trim();

    const cleanPhone =
      String(phone || '').trim() || null;

    const cleanAvatar =
      String(avatarUrl || '').trim() ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
        cleanEmail
      )}`;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'वैध ईमेल दर्ज करें (Valid email is required).',
        },
        { status: 400 }
      );
    }

    if (
      typeof password !== 'string' ||
      password.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Min 6 characters).',
        },
        { status: 400 }
      );
    }

    if (!cleanName) {
      return NextResponse.json(
        {
          success: false,
          error:
            'नाम दर्ज करना आवश्यक है (Name is required).',
        },
        { status: 400 }
      );
    }

    const adminUser = isSiteAdmin(cleanEmail);

    // -----------------------------------------
    // METHOD 1
    // SUPABASE ADMIN CREATE USER
    // -----------------------------------------

    if (serviceRoleKey.length > 20) {
      try {
        const adminSupabase = createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        const {
          data,
          error,
        } =
          await adminSupabase.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              name: cleanName,
              phone: cleanPhone,
              avatar_url: cleanAvatar,
            },
          });

        if (!error && data?.user) {
          const appUser = createAppUser(
            data.user.id,
            cleanEmail,
            cleanName,
            cleanPhone,
            cleanAvatar,
            adminUser
          );

          await savePublicUser(
            adminSupabase,
            appUser
          );

          // -------------------------------------
          // IMMEDIATE LOGIN
          // -------------------------------------

          const loginClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            {
              auth: {
                persistSession: false,
              },
            }
          );

          const {
            data: loginData,
            error: loginError,
          } =
            await loginClient.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

          if (loginError) {
            return NextResponse.json({
              success: true,
              user: appUser,
              isConfirmed: true,
              rateLimitBypassed: false,
              session: null,
              message:
                'खाता बन गया है। अब लॉगिन करें।',
            });
          }

          return NextResponse.json({
            success: true,
            user: appUser,
            isConfirmed: true,
            rateLimitBypassed: false,
            accessToken:
              loginData.session?.access_token ||
              null,
            refreshToken:
              loginData.session?.refresh_token ||
              null,
            expiresAt:
              loginData.session?.expires_at ||
              null,
          });
        }

        // -------------------------------------
        // EXISTING ACCOUNT
        // -------------------------------------

        if (
          error &&
          (
            error.message
              ?.toLowerCase()
              .includes('already registered') ||
            error.message
              ?.toLowerCase()
              .includes('already exists') ||
            error.code === 'email_exists'
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।',
            },
            { status: 409 }
          );
        }
      } catch (adminError) {
        console.warn(
          'Supabase admin signup unavailable:',
          adminError
        );
      }
    }

    // -----------------------------------------
    // METHOD 2
    // NORMAL SUPABASE AUTH SIGNUP
    // -----------------------------------------

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const {
      data,
      error,
    } = await supabase.auth.signUp({
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

    // -----------------------------------------
    // SUPABASE SIGNUP ERROR
    // -----------------------------------------

    if (error) {
      const errorMessage =
        error.message || '';

      const lowerError =
        errorMessage.toLowerCase();

      // Already registered
      if (
        lowerError.includes('already registered') ||
        lowerError.includes('already exists') ||
        lowerError.includes(
          'user already registered'
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।',
          },
          { status: 409 }
        );
      }

      // Email rate limit
      if (
        lowerError.includes('rate limit') ||
        lowerError.includes(
          'over_email_send_rate_limit'
        ) ||
        error.status === 429
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'अभी Supabase email rate limit आ गई है। कृपया थोड़ी देर बाद फिर प्रयास करें।',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            errorMessage ||
            'साइन-अप करने में समस्या आई।',
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // USER CHECK
    // -----------------------------------------

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'अकाउंट बनाया नहीं जा सका। कृपया पुनः प्रयास करें।',
        },
        { status: 500 }
      );
    }

    const sbUser = data.user;

    const appUser = createAppUser(
      sbUser.id,
      cleanEmail,
      cleanName,
      cleanPhone,
      cleanAvatar,
      adminUser
    );

    // -----------------------------------------
    // SAVE PROFILE
    // -----------------------------------------

    await savePublicUser(
      supabase,
      appUser
    );

    // -----------------------------------------
    // SESSION / CONFIRMATION
    // -----------------------------------------

    const isConfirmed =
      Boolean(sbUser.confirmed_at);

    const session = data.session;

    return NextResponse.json({
      success: true,
      user: appUser,
      isConfirmed,
      rateLimitBypassed: false,
      accessToken:
        session?.access_token || null,
      refreshToken:
        session?.refresh_token || null,
      expiresAt:
        session?.expires_at || null,
      requiresEmailConfirmation:
        !isConfirmed && !session,
      message: session
        ? 'खाता सफलतापूर्वक बन गया है और आप लॉगिन हो चुके हैं।'
        : 'खाता सफलतापूर्वक बन गया है। कृपया ईमेल सत्यापन पूरा करके लॉगिन करें।',
    });
  } catch (err: any) {
    console.error(
      'Signup API error:',
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          'साइन-अप करने में समस्या आई। पुनः प्रयास करें।',
      },
      { status: 500 }
    );
  }
}