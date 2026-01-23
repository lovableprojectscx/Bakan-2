-- 1. Elimina la política de seguridad incorrecta
DROP POLICY "System can manage password resets" ON public.password_resets;

-- 2. Deshabilita RLS en ESTA tabla específica para permitir operaciones del sistema
ALTER TABLE public.password_resets DISABLE ROW LEVEL SECURITY;