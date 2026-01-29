-- Update vouchers bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'vouchers';

-- Ensure policies exist (drop and recreate)
DROP POLICY IF EXISTS "Authenticated users can upload vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own vouchers" ON storage.objects;

-- Policy to allow authenticated users to upload vouchers
CREATE POLICY "Authenticated users can upload vouchers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vouchers' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow public viewing of vouchers (since bucket is public)
CREATE POLICY "Anyone can view vouchers"
ON storage.objects FOR SELECT
USING (bucket_id = 'vouchers');

-- Policy for updating own vouchers
CREATE POLICY "Users can update their own vouchers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vouchers' 
  AND auth.uid() = owner
);

-- Policy for deleting own vouchers
CREATE POLICY "Users can delete their own vouchers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vouchers' 
  AND auth.uid() = owner
);
