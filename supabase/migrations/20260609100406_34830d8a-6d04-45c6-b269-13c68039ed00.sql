-- Revoke EXECUTE from PUBLIC and anon on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_menu_item(uuid, text, text, numeric, uuid, text, integer, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_cash_payment(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_staff_menu_items() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_low_stock_items(integer) FROM PUBLIC, anon;

-- Re-grant only to authenticated (functions perform their own has_role checks)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_menu_item(uuid, text, text, numeric, uuid, text, integer, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_cash_payment(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_menu_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_items(integer) TO authenticated;
-- handle_new_user runs as a trigger; service_role only
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;