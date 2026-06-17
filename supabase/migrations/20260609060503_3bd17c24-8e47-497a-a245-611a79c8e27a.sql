
CREATE POLICY "Authenticated can read restaurant images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Admins can upload restaurant images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'restaurant-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update restaurant images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'restaurant-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete restaurant images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'restaurant-images' AND public.has_role(auth.uid(), 'admin'));
