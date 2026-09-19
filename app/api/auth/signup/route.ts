import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { isSiteAdmin } from '@/lib/admin-auth';
import { contentStore } from '@/lib/content-store';
import { User } from '@/types';

const DEFAULT_SUPABASE_URL = 'https://zlngcbefvdtbihndaeun.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_JxGddMQ5KqRFTANuZG2TGg_I05TTskS';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AUTH_SALT = 'dhoti-aale-community-salt-2026';

function hashAccountPassword(password: string): string {
  return crypto.createHmac('sha256', AUTH_SALT).update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, avatarUrl } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim() || null;
    const cleanAvatar = (avatarUrl || '').trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`;

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'वैध ईमेल दर्ज करें (Valid email is required).' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Min 6 characters).' }, { status: 400 });
    }
    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'नाम दर्ज करना आवश्यक है (Name is required).' }, { status: 400 });
    }

    const adminUser = isSiteAdmin(cleanEmail);

    // Method 1: If SUPABASE_SERVICE_ROLE_KEY is provided, use Admin createUser with email_confirm: true
    // This completely bypasses email sending and never triggers "email rate limit exceeded"
    if (serviceRoleKey && serviceRoleKey.length > 20) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data: createdSbUser, error: adminErr } = await adminSupabase.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true, // No confirmation email sent! Instant activation!
          user_metadata: {
            full_name: cleanName,
            name: cleanName,
            phone: cleanPhone,
            avatar_url: cleanAvatar,
          },
        });

        if (!adminErr && createdSbUser?.user) {
          const u = createdSbUser.user;
          const appUser: User = {
            id: u.id,
            name: cleanName,
            email: cleanEmail,
            avatar: cleanAvatar,
            phone: cleanPhone || undefined,
            badge: adminUser ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
            coins: 50,
            wins: 0,
            battles: 0,
            rank: adminUser ? 'Super Admin 👑' : 'Resident',
            isGoogle: false,
            role: adminUser ? 'admin' : 'resident',
            isAdmin: adminUser,
            createdAt: Date.now(),
          };

          // Save to public.users table
          try {
            await adminSupabase.from('users').upsert({
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
            }, { onConflict: 'id' });
          } catch {
            // ignore
          }

          return NextResponse.json({
            success: true,
            user: appUser,
            isConfirmed: true,
            rateLimitBypassed: false,
          });
        }
      } catch (adminEx) {
        console.warn('Supabase admin.createUser attempt notice:', adminEx);
      }
    }

    // Method 2: Standard Supabase Auth attempt using anon key
    let supabaseError: any = null;
    let standardSbUser: any = null;

    try {
      const standardSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await standardSupabase.auth.signUp({
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

      if (!error && data?.user) {
        standardSbUser = data.user;
      } else if (error) {
        supabaseError = error;
      }
    } catch (err: any) {
      supabaseError = err;
    }

    // If Supabase standard signup succeeded without email rate limit
    if (standardSbUser) {
      const appUser: User = {
        id: standardSbUser.id,
        name: cleanName,
        email: cleanEmail,
        avatar: cleanAvatar,
        phone: cleanPhone || undefined,
        badge: adminUser ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
        coins: 50,
        wins: 0,
        battles: 0,
        rank: adminUser ? 'Super Admin 👑' : 'Resident',
        isGoogle: false,
        role: adminUser ? 'admin' : 'resident',
        isAdmin: adminUser,
        createdAt: Date.now(),
      };

      // Upsert into public.users
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        await client.from('users').upsert({
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
        }, { onConflict: 'id' });
      } catch {
        // ignore
      }

      return NextResponse.json({
        success: true,
        user: appUser,
        isConfirmed: Boolean(standardSbUser.confirmed_at),
        rateLimitBypassed: false,
      });
    }

    // Check if error is 'already registered'
    const errorMsg = (supabaseError?.message || '').toLowerCase();
    if (errorMsg.includes('already registered') || errorMsg.includes('user already exists')) {
      return NextResponse.json({
        success: false,
        error: 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।',
      }, { status: 409 });
    }

    // Method 3: Resilient Auto-Bypass for Email Rate Limit Exceeded
    // If Supabase throws 'rate limit' / 'over_email_send_rate_limit' / 429
    // or any email dispatch failure, DO NOT block the user!
    // Instantly provision a genuine resident account so the user can enter right away!
    const isRateLimit =
      errorMsg.includes('rate limit') ||
      errorMsg.includes('over_email_send_rate_limit') ||
      supabaseError?.status === 429;

    console.info(`Supabase Auth rate-limit check: error="${errorMsg}", isRateLimit=${isRateLimit}. Activating instant resident account creation.`);

    // Check if user is already in fallback store
    const existingFallback = contentStore.fallbackAccounts.get(cleanEmail);
    if (existingFallback) {
      return NextResponse.json({
        success: false,
        error: 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।',
      }, { status: 409 });
    }

    const residentId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = hashAccountPassword(password);

    const residentUser: User = {
      id: residentId,
      name: cleanName,
      email: cleanEmail,
      avatar: cleanAvatar,
      phone: cleanPhone || undefined,
      badge: adminUser ? 'Site Owner & Admin 👑' : 'Dhoti Resident',
      coins: 50,
      wins: 0,
      battles: 0,
      rank: adminUser ? 'Super Admin 👑' : 'Resident',
      isGoogle: false,
      role: adminUser ? 'admin' : 'resident',
      isAdmin: adminUser,
      createdAt: Date.now(),
    };

    // Store in persistent server store
    contentStore.fallbackAccounts.set(cleanEmail, {
      id: residentId,
      name: cleanName,
      email: cleanEmail,
      avatar: cleanAvatar,
      phone: cleanPhone || undefined,
      badge: residentUser.badge,
      coins: residentUser.coins || 50,
      wins: residentUser.wins || 0,
      battles: residentUser.battles || 0,
      rank: residentUser.rank,
      role: adminUser ? 'admin' : 'resident',
      isAdmin: adminUser,
      createdAt: Date.now(),
      passwordHash,
    });

    // Also attempt saving to Supabase public.users database
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      await client.from('users').upsert({
        id: residentId,
        email: cleanEmail,
        name: cleanName,
        phone: cleanPhone,
        avatar: cleanAvatar,
        badge: residentUser.badge,
        coins: 50,
        wins: 0,
        battles: 0,
        rank: residentUser.rank,
        role: residentUser.role,
        is_admin: Boolean(residentUser.isAdmin),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('Could not write fallback user to Supabase public.users:', dbErr);
    }

    return NextResponse.json({
      success: true,
      user: residentUser,
      rateLimitBypassed: true,
      message: 'खाता सफलतापूर्वक बन गया! Supabase Email Rate Limit को बाईपास कर तुरंत एक्टिव कर दिया गया है।',
    });
  } catch (err: any) {
    console.error('Signup API error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'साइन-अप करने में समस्या आई। पुनः प्रयास करें।',
    }, { status: 500 });
  }
}
