-- ========================================================
-- AUTH TRIGGER FOR PROFILES
-- ========================================================
-- This trigger automatically creates a row in public.profiles 
-- when a new user signs up via Supabase Auth (auth.users).

-- 1. Create the function that will insert the profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, currency)
  VALUES (
    NEW.id,
    -- Extract full_name from raw_user_meta_data if it exists, otherwise use the email prefix, otherwise NULL
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'USD' -- Default currency
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER is required so the function has privileges to write to public.profiles
-- even though it's triggered by the auth schema.

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
