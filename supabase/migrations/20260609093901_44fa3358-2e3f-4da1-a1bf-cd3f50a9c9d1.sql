
DROP POLICY IF EXISTS "Anyone reads menu" ON public.menu_items;

CREATE POLICY "Authenticated reads menu" ON public.menu_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon reads available menu" ON public.menu_items
  FOR SELECT TO anon USING (is_available = true);

REVOKE SELECT ON public.menu_items FROM anon;
GRANT SELECT (id, name, description, price, meal_time, day_of_week,
              is_available, category_id, image_url, created_at, updated_at)
  ON public.menu_items TO anon;

CREATE POLICY "Anon reads restaurant images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'restaurant-images');
