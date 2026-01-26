-- Replace handle_new_user function with validated/sanitized version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_name TEXT;
BEGIN
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
  
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, safe_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;