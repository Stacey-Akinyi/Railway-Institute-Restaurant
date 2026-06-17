
DROP POLICY IF EXISTS "Authenticated reads menu" ON public.menu_items;
REVOKE SELECT ON public.menu_items FROM authenticated;
GRANT SELECT (id, name, description, price, meal_time, day_of_week, is_available, category_id, image_url, created_at, updated_at)
  ON public.menu_items TO authenticated;

CREATE POLICY "Authenticated reads safe menu cols"
ON public.menu_items
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.get_staff_menu_items()
RETURNS SETOF public.menu_items
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'receptionist') OR has_role(auth.uid(),'kitchen')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.menu_items ORDER BY name;
END; $$;

CREATE OR REPLACE FUNCTION public.get_low_stock_items(_threshold int DEFAULT 10)
RETURNS TABLE(id uuid, name text, stock_quantity int, low_stock_threshold int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'receptionist') OR has_role(auth.uid(),'kitchen')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT m.id, m.name, m.stock_quantity, m.low_stock_threshold
    FROM public.menu_items m
    WHERE m.stock_quantity <= _threshold
    ORDER BY m.stock_quantity;
END; $$;

CREATE OR REPLACE FUNCTION public.upsert_menu_item(
  _id uuid, _name text, _description text, _price numeric, _category_id uuid,
  _meal_time text, _stock_quantity int, _is_available boolean, _image_url text
) RETURNS public.menu_items
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.menu_items;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _id IS NULL THEN
    INSERT INTO public.menu_items(name, description, price, category_id, meal_time, stock_quantity, is_available, image_url)
    VALUES (_name, _description, _price, _category_id, _meal_time, _stock_quantity, _is_available, _image_url)
    RETURNING * INTO r;
  ELSE
    UPDATE public.menu_items SET
      name=_name, description=_description, price=_price, category_id=_category_id,
      meal_time=_meal_time, stock_quantity=_stock_quantity, is_available=_is_available,
      image_url=_image_url, updated_at=now()
    WHERE id=_id RETURNING * INTO r;
  END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_cash_payment(_payment_id uuid, _tendered numeric)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record; it record;
BEGIN
  IF NOT (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'receptionist')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT * INTO p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF p IS NULL THEN RAISE EXCEPTION 'payment not found'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'payment already processed'; END IF;
  IF _tendered < p.amount THEN RAISE EXCEPTION 'tendered less than amount'; END IF;

  UPDATE public.payments
    SET status='paid', amount_tendered=_tendered, change_due=_tendered - p.amount, processed_by=auth.uid()
    WHERE id=_payment_id;

  UPDATE public.orders SET status='preparing' WHERE id=p.order_id;

  FOR it IN SELECT menu_item_id, quantity FROM public.order_items WHERE order_id = p.order_id LOOP
    UPDATE public.menu_items
      SET stock_quantity = GREATEST(0, stock_quantity - it.quantity)
      WHERE id = it.menu_item_id;
  END LOOP;
END; $$;

REVOKE EXECUTE ON FUNCTION public.get_staff_menu_items() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_low_stock_items(int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_menu_item(uuid, text, text, numeric, uuid, text, int, boolean, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_cash_payment(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_menu_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_items(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_menu_item(uuid, text, text, numeric, uuid, text, int, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_cash_payment(uuid, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
