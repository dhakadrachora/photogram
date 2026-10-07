-- =========================================================
-- DHOTI AALE - Complete Supabase PostgreSQL Schema v2.0
-- Production-Ready Migration & Table Definitions
-- =========================================================

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  badge TEXT DEFAULT 'Dhoti Resident',
  coins INTEGER DEFAULT 50,
  wins INTEGER DEFAULT 0,
  battles INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Resident',
  role TEXT DEFAULT 'resident',
  is_admin BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  chat_blocked BOOLEAN DEFAULT false,
  voting_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_coins ON public.users(coins DESC);

-- 2. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'DHOTI AALE',
  published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_category ON public.news(category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON public.news(created_at DESC);

-- 3. BATTLES & VOTES
CREATE TABLE IF NOT EXISTS public.battles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  option_a JSONB NOT NULL,
  option_b JSONB NOT NULL,
  is_ended BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  winner_option_id TEXT,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.battle_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_battle_vote UNIQUE (battle_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_battle_votes_battle_id ON public.battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_user_email ON public.battle_votes(user_email);

-- 4. 24-HOUR WORLD CHAT TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_badge TEXT,
  text TEXT NOT NULL,
  sticker TEXT,
  is_ai BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Chat Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. REWARDS & COIN TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'daily_checkin', 'battle_vote', 'reels_boost', 'ad_reward'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON public.coin_transactions(user_id);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- 7. CLEANUP TRIGGER FOR 24-HOUR EXPIRED CHAT MESSAGES
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
