-- Create storage buckets for transaction files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vouchers', 'vouchers', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('pruebas-envio', 'pruebas-envio', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('mensajes-archivos', 'mensajes-archivos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- RLS policies for vouchers bucket
CREATE POLICY "Users can upload vouchers for their transactions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vouchers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view vouchers from their transactions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vouchers' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- RLS policies for pruebas-envio bucket
CREATE POLICY "Users can upload shipping proofs for their transactions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pruebas-envio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view shipping proofs from their transactions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pruebas-envio' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- RLS policies for mensajes-archivos bucket
CREATE POLICY "Users can upload message attachments for their transactions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mensajes-archivos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view message attachments from their transactions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'mensajes-archivos' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    public.has_role(auth.uid(), 'admin')
  )
);

-- Enable realtime for mensajes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;

-- Enable realtime for pruebas_transaccion table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pruebas_transaccion;