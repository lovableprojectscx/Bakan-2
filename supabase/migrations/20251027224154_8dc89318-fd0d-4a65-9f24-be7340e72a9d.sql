-- Fix RLS on password_resets table (security critical)
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- No policies needed for password_resets - this table should only be managed server-side
-- Users should NEVER have direct access to password reset tokens

-- Fix the has_role function to set search_path properly (fixes security warning)
-- Using CREATE OR REPLACE to update without dropping dependencies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;