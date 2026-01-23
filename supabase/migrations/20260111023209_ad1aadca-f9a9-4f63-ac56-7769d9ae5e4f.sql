-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow service role to manage password resets" ON public.password_resets;

-- Disable RLS on password_resets since this table should only be accessed by service role
-- Edge functions using service role bypass RLS anyway
ALTER TABLE public.password_resets DISABLE ROW LEVEL SECURITY;