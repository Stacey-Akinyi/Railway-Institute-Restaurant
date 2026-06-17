-- Replace blanket "SELECT all columns" RLS with column-restricted GRANTs.
DROP POLICY IF EXISTS "Authenticated reads safe menu cols" ON public.menu_items;
DROP POLICY IF EXISTS "Anon reads available menu" ON public.menu_items;

-- Recreate a single read policy; column visibility is enforced by GRANTs below.
CREATE POLICY "Public reads available menu"
ON public.menu_items FOR SELECT
TO anon, authenticated
USING (is_available = true);

-- Revoke broad table SELECT (was granted to anon/authenticated) and grant only safe columns.
REVOKE SELECT ON public.menu_items FROM anon, authenticated;

GRANT SELECT
  (id, category_id, name, description, price, image_url,
   day_of_week, meal_time, is_available, created_at, updated_at)
ON public.menu_items TO anon, authenticated;

-- Staff continue to read everything through the SECURITY DEFINER RPC get_staff_menu_items().
-- Admins keep full table access via the existing "Admins manage menu" policy + service_role grant.
GRANT ALL ON public.menu_items TO service_role;