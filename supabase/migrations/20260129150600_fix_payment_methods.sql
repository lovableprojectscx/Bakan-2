-- Make numero_cuenta_o_celular optional
ALTER TABLE public.cuentas_bancarias_bakan 
ALTER COLUMN numero_cuenta_o_celular DROP NOT NULL;

-- Ensure qr-pagos bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-pagos', 'qr-pagos', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure policies exist (drop and recreate to be safe and ensure correct permissions)
DROP POLICY IF EXISTS "Anyone can view QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete QR codes" ON storage.objects;

-- Policy to allow public viewing of QR codes
CREATE POLICY "Anyone can view QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-pagos');

-- Policy to allow admins to upload QR codes
-- Using direct check on user_roles table to avoid dependencies on helper functions
CREATE POLICY "Only admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-pagos' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);

-- Policy for updating
CREATE POLICY "Only admins can update QR codes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'qr-pagos' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);

-- Policy for deleting
CREATE POLICY "Only admins can delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'qr-pagos' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);
