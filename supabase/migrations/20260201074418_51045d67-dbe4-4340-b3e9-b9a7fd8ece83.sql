-- Improve handle_new_user function with duplicate check
-- This prevents creating duplicate profiles if trigger fires multiple times
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Check if profile already exists for this user (idempotency check)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Validate and sanitize full_name: trim whitespace, limit to 100 chars, default to NULL if empty
  safe_name := NULLIF(
    TRIM(
      SUBSTRING(
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
        1, 
        100
      )
    ), 
    ''
  );
  
  -- Insert new profile with validated data
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, safe_name)
  ON CONFLICT (user_id) DO NOTHING; -- Extra safety for race conditions
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comment documenting why SECURITY DEFINER is required
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that creates a profile when a new user signs up. 
Uses SECURITY DEFINER because it runs on auth.users table (Supabase internal) 
and needs elevated privileges to insert into public.profiles.
Includes duplicate check for idempotency and input sanitization for security.';