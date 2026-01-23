-- Re-enable RLS on password_resets
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies - no one can access this table via the API
-- Edge functions with service role can still access it (they bypass RLS)
-- This prevents any client-side access to password reset tokens

-- No SELECT policy for regular users - tokens are validated server-side
-- No INSERT policy for regular users - tokens are created by edge functions
-- No UPDATE policy - tokens are not updated
-- No DELETE policy - cleanup is done by edge functions or automatically

-- The table is effectively "locked" from client access but edge functions 
-- using the service role can still manage tokens