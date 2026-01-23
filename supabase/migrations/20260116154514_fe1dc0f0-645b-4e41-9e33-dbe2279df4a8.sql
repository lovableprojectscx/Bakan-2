-- Create a function to search users by email (only for admins)
CREATE OR REPLACE FUNCTION public.search_user_by_email(_email text)
RETURNS TABLE (
  user_id uuid,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id as user_id, au.email::text
  FROM auth.users au
  WHERE au.email ILIKE '%' || _email || '%'
  AND public.has_role(auth.uid(), 'admin'::app_role)
  LIMIT 20;
$$;