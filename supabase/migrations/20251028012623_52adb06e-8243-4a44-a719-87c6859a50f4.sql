-- Storage policies for vouchers bucket - Admin access
CREATE POLICY "Admins can view all vouchers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage vouchers"
ON storage.objects
FOR ALL
USING (bucket_id = 'vouchers' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow users to view their own vouchers
CREATE POLICY "Users can view their own vouchers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vouchers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);