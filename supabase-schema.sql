-- =========================================================
-- DHOTI AALE - Complete Supabase PostgreSQL Schema & RLS Policies
-- Execute this script in your Supabase SQL Editor.
-- =========================================================

-- 1. USERS TABLE (Stores profile information only; passwords are encrypted by Supabase Auth and NEVER stored here)
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure phone column exists for existing tables
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  views INTEGER DEFAULT 0
);

-- 3. PEOPLE (HALL OF FAME) TABLE
CREATE TABLE IF NOT EXISTS public.people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT,
  bio TEXT,
  photo_url TEXT,
  achievements TEXT,
  category TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VILLAGE BUSINESS DIRECTORY
CREATE TABLE IF NOT EXISTS public.business (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  description TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  views INTEGER DEFAULT 0
);

-- 7. COMMUNITY UPDATES TABLE
CREATE TABLE IF NOT EXISTS public.updates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  tag TEXT,
  badge_color TEXT DEFAULT 'amber',
  published BOOLEAN DEFAULT true,
  date TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. BATTLES TABLE
CREATE TABLE IF NOT EXISTS public.battles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  option_a JSONB NOT NULL,
  option_b JSONB NOT NULL,
  is_ended BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
  published BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  winner_option_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. BATTLE VOTES TABLE (Strict 1 vote per user per battle)
CREATE TABLE IF NOT EXISTS public.battle_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_id TEXT,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_battle_vote UNIQUE (battle_id, user_email)
);

-- 10. CHAT MESSAGES (World Chat)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_badge TEXT,
  text TEXT NOT NULL,
  sticker TEXT,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  site_title TEXT DEFAULT 'DHOTI AALE',
  site_tagline TEXT DEFAULT 'Chat • Battle • AI Assistant',
  announcement_banner TEXT,
  is_announcement_active BOOLEAN DEFAULT true,
  allow_world_chat BOOLEAN DEFAULT true,
  allow_guest_ai BOOLEAN DEFAULT true,
  hero_badge TEXT DEFAULT 'Pure Desi Vibe • 100% Real Community 👑',
  contact_email TEXT DEFAULT 'rohitdhakaddhoti143@gmail.com',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'rohitdhakaddhoti143@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Public Reads for Content, Battles, Settings, and Chat
CREATE POLICY "Public can view published news" ON public.news FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published people" ON public.people FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published business" ON public.business FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published gallery" ON public.gallery FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published videos" ON public.videos FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published updates" ON public.updates FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view published battles" ON public.battles FOR SELECT USING (published = true OR public.is_admin());
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public can view chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public can view user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public can view votes count" ON public.battle_votes FOR SELECT USING (true);

-- 2. Authenticated Users Actions
CREATE POLICY "Users can upsert own profile" ON public.users FOR ALL USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "Users can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());
CREATE POLICY "Users can cast one vote per battle" ON public.battle_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());

-- 3. Admin Full Management (CRUD) for rohitdhakaddhoti143@gmail.com
CREATE POLICY "Admin can manage news" ON public.news FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage people" ON public.people FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage business" ON public.business FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage gallery" ON public.gallery FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage videos" ON public.videos FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage updates" ON public.updates FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage battles" ON public.battles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage battle votes" ON public.battle_votes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage chat messages" ON public.chat_messages FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- 12. PROBLEM REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'Open', -- 'Open', 'Replied', 'Resolved'
  latest_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. REPORT MESSAGES (THREAD) TABLE
CREATE TABLE IF NOT EXISTS public.report_messages (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;

-- Reports RLS Policies:
-- Users can view only their own reports, Admin can view all reports
CREATE POLICY "Users view own reports or admin views all" ON public.reports
  FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

-- Authenticated users can insert their own reports
CREATE POLICY "Users create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

-- Users or Admin can update reports (e.g. status)
CREATE POLICY "Users or admin update reports" ON public.reports
  FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());

-- Report Messages RLS Policies:
-- Users view messages belonging to their reports; Admin views all
CREATE POLICY "Users view messages in own reports or admin all" ON public.report_messages
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_messages.report_id
      AND r.user_id = auth.uid()::text
    )
  );

-- Users can insert messages in their reports; Admin can insert in any report
CREATE POLICY "Users or admin insert report messages" ON public.report_messages
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_messages.report_id
      AND r.user_id = auth.uid()::text
    )
  );

