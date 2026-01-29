-- 1. PRUEBAS-ENVIO (Shipping Proofs)
-- Make public for easy access between buyer/seller
UPDATE storage.buckets SET public = true WHERE id = 'pruebas-envio';

-- Policies
DROP POLICY IF EXISTS "Public view shipping proofs" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload shipping proofs" ON storage.objects;
DROP POLICY IF EXISTS "Owner update shipping proofs" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete shipping proofs" ON storage.objects;

CREATE POLICY "Public view shipping proofs" ON storage.objects FOR SELECT
USING (bucket_id = 'pruebas-envio');

CREATE POLICY "Auth upload shipping proofs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pruebas-envio' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update shipping proofs" ON storage.objects FOR UPDATE
USING (bucket_id = 'pruebas-envio' AND auth.uid() = owner);

CREATE POLICY "Owner delete shipping proofs" ON storage.objects FOR DELETE
USING (bucket_id = 'pruebas-envio' AND auth.uid() = owner);


-- 2. MENSAJES-ARCHIVOS (Chat Attachments)
-- Ensure it is public
UPDATE storage.buckets SET public = true WHERE id = 'mensajes-archivos';

-- Policies
DROP POLICY IF EXISTS "Public view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Owner update chat files" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete chat files" ON storage.objects;

CREATE POLICY "Public view chat files" ON storage.objects FOR SELECT
USING (bucket_id = 'mensajes-archivos');

CREATE POLICY "Auth upload chat files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mensajes-archivos' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update chat files" ON storage.objects FOR UPDATE
USING (bucket_id = 'mensajes-archivos' AND auth.uid() = owner);

CREATE POLICY "Owner delete chat files" ON storage.objects FOR DELETE
USING (bucket_id = 'mensajes-archivos' AND auth.uid() = owner);


-- 3. DOCUMENTOS-IDENTIDAD (Identity Docs - SENSITIVE)
-- Keep PRIVATE. Only Owner and Admin can view.
UPDATE storage.buckets SET public = false WHERE id = 'documentos-identidad';

-- Policies
DROP POLICY IF EXISTS "Admin view all identity docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner view own identity docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload identity docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner update identity docs" ON storage.objects;

CREATE POLICY "Admin view all identity docs" ON storage.objects FOR SELECT
USING (bucket_id = 'documentos-identidad' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Owner view own identity docs" ON storage.objects FOR SELECT
USING (bucket_id = 'documentos-identidad' AND auth.uid() = owner);

CREATE POLICY "Auth upload identity docs" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos-identidad' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update identity docs" ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos-identidad' AND auth.uid() = owner);


-- 4. AVATARS (If exists, ensure public access)
-- Make public
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Policies
DROP POLICY IF EXISTS "Public view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner update avatars" ON storage.objects;

CREATE POLICY "Public view avatars" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Owner update avatars" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);
