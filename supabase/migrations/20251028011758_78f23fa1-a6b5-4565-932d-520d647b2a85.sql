-- Add QR image field to payment accounts
ALTER TABLE public.cuentas_bancarias_bakan
ADD COLUMN qr_image_url text;

-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-pagos', 'qr-pagos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for QR codes
CREATE POLICY "Anyone can view QR codes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'qr-pagos');

CREATE POLICY "Only admins can upload QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'qr-pagos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update QR codes"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'qr-pagos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete QR codes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'qr-pagos' AND has_role(auth.uid(), 'admin'::app_role));