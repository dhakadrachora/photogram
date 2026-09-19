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

const AUTH_SALT = 'dhoti-aale-community-salt-2026';

function hashAccountPassword(password: string): string {
  return crypto.createHmac('sha256', AUTH_SALT).update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'ईमेल और पासवर्ड आवश्यक हैं।' },
        { status: 400 }
      );
    }

    // Check in-memory / persistent fallback accounts first
    const fallback = contentStore.fallbackAccounts.get(cleanEmail);
    if (fallback) {
      const incomingHash = hashAccountPassword(password);
      if (incomingHash === fallback.passwordHash) {
        const appUser: User = {
          id: fallback.id,
          name: fallback.name,
          email: fallback.email,
          avatar: fallback.avatar,
          phone: fallback.phone,
          badge: fallback.badge,
          coins: fallback.coins,
          wins: fallback.wins,
          battles: fallback.battles,
          rank: fallback.rank,
          role: fallback.role,
          isAdmin: Boolean(fallback.isAdmin) || isSiteAdmin(cleanEmail),
          createdAt: fallback.createdAt,
        };

        return NextResponse.json({
          success: true,
          user: appUser,
          isFallbackAccount: true,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'पासवर्ड गलत है। कृपया पुनः जांचें।' },
          { status: 401 }
        );
      }
    }

    // Check Supabase public.users for profile
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data: dbUser } = await client
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUser) {
        const adminUser = isSiteAdmin(cleanEmail) || Boolean(dbUser.is_admin);
        const appUser: User = {
          id: dbUser.id,
          name: dbUser.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: dbUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
          phone: dbUser.phone || undefined,
          badge: dbUser.badge || (adminUser ? 'Site Owner & Admin 👑' : 'Dhoti Resident'),
          coins: dbUser.coins ?? 50,
          wins: dbUser.wins ?? 0,
          battles: dbUser.battles ?? 0,
          rank: dbUser.rank || 'Resident',
          role: (dbUser.role === 'admin' ? 'admin' : 'resident') as 'admin' | 'resident',
          isAdmin: adminUser,
          createdAt: dbUser.created_at || Date.now(),
        };

        return NextResponse.json({
          success: true,
          user: appUser,
          isFallbackAccount: true,
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { success: false, error: 'खाता नहीं मिला या विवरण गलत है।' },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'लॉगिन में समस्या आई।' },
      { status: 500 }
    );
  }
}
