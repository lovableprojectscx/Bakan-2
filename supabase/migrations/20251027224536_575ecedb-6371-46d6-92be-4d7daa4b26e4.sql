-- Create bucket for identity documents (DNI uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-identidad', 'documentos-identidad', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for identity documents bucket
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documentos-identidad' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own identity documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documentos-identidad' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users can update their own identity documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documentos-identidad' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own identity documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documentos-identidad' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add UPDATE and DELETE policies for vouchers (allow users to replace/remove vouchers)
CREATE POLICY "Users can update their vouchers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vouchers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their vouchers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vouchers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add UPDATE and DELETE policies for shipping proofs
CREATE POLICY "Users can update their shipping proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pruebas-envio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their shipping proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pruebas-envio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);