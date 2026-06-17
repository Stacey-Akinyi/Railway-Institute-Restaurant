
-- 1) Hide internal inventory columns from anonymous (public) menu readers
REVOKE SELECT ON public.menu_items FROM anon;
GRANT SELECT (id, name, description, price, meal_time, is_available, category_id, image_url, created_at, updated_at) ON public.menu_items TO anon;

-- 2) Lock down has_role(): only authenticated users (needed for RLS policies). Revoke from anon/public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 3) Restrict Realtime so only staff can subscribe to order channels.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can receive realtime messages" ON realtime.messages;
CREATE POLICY "Staff can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'kitchen')
  OR public.has_role(auth.uid(), 'receptionist')
);
