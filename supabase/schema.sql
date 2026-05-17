-- ViviFresh Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (가족/동거인 그룹)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Fridges (그룹당 여러 냉장고)
CREATE TABLE IF NOT EXISTS public.fridges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '우리 냉장고',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient categories
CREATE TYPE ingredient_category AS ENUM (
  'refrigerated', 'frozen', 'room_temp', 'beverage', 'condiment', 'snack', 'other'
);

-- Ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fridge_id UUID REFERENCES public.fridges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category ingredient_category DEFAULT 'refrigerated',
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '개',
  purchase_date DATE,
  expiry_date DATE NOT NULL,
  barcode TEXT,
  image_url TEXT,
  memo TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe ingredients (재료명 텍스트 기반 매칭)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL
);

-- Notification settings per user
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  notify_d7 BOOLEAN DEFAULT TRUE,
  notify_d3 BOOLEAN DEFAULT TRUE,
  notify_d1 BOOLEAN DEFAULT TRUE,
  notify_d0 BOOLEAN DEFAULT TRUE,
  notify_time TIME DEFAULT '09:00:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'd7', 'd3', 'd1', 'd0', 'expired'
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups: members can view, creator can manage
CREATE POLICY "Group members can view group" ON public.groups FOR SELECT
  USING (id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator can update group" ON public.groups FOR UPDATE
  USING (created_by = auth.uid());

-- Group members
CREATE POLICY "Members can view group membership" ON public.group_members FOR SELECT
  USING (user_id = auth.uid() OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (user_id = auth.uid());

-- Fridges: group members can access
CREATE POLICY "Group members can view fridges" ON public.fridges FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    OR user_id = auth.uid());
CREATE POLICY "Authenticated users can create fridges" ON public.fridges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Fridge owner or group member can update" ON public.fridges FOR UPDATE
  USING (user_id = auth.uid());

-- Ingredients: fridge access
CREATE POLICY "Fridge members can view ingredients" ON public.ingredients FOR SELECT
  USING (fridge_id IN (
    SELECT f.id FROM public.fridges f
    LEFT JOIN public.group_members gm ON f.group_id = gm.group_id
    WHERE gm.user_id = auth.uid() OR f.user_id = auth.uid()
  ));
CREATE POLICY "Fridge members can insert ingredients" ON public.ingredients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Fridge members can update ingredients" ON public.ingredients FOR UPDATE
  USING (fridge_id IN (
    SELECT f.id FROM public.fridges f
    LEFT JOIN public.group_members gm ON f.group_id = gm.group_id
    WHERE gm.user_id = auth.uid() OR f.user_id = auth.uid()
  ));
CREATE POLICY "Fridge members can delete ingredients" ON public.ingredients FOR DELETE
  USING (fridge_id IN (
    SELECT f.id FROM public.fridges f
    LEFT JOIN public.group_members gm ON f.group_id = gm.group_id
    WHERE gm.user_id = auth.uid() OR f.user_id = auth.uid()
  ));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Create default fridge
  INSERT INTO public.fridges (user_id, name) VALUES (NEW.id, '내 냉장고');
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
