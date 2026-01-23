-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Everyone can view active Bakan bank accounts" ON public.cuentas_bancarias_bakan;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view active Bakan bank accounts"
ON public.cuentas_bancarias_bakan
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND esta_activa = true) 
  OR has_role(auth.uid(), 'admin'::app_role)
);