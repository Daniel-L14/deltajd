-- Conservar la fotografía al guardar datos sin el campo image_url.
CREATE OR REPLACE FUNCTION public.delta_guardar_producto_v2(p_id uuid,p_payload jsonb,p_actor uuid,p_reason text,p_expected_stock integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE prod public.productos%ROWTYPE; v_id uuid=coalesce(p_id,gen_random_uuid()); old_stock integer=0; new_stock integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role::text='ADMIN') THEN RAISE EXCEPTION 'No autorizado'; END IF;
 new_stock=(p_payload->>'stock')::integer;
 IF new_stock<0 OR (p_payload->>'price')::numeric<=0 OR length(trim(p_reason))<3 THEN RAISE EXCEPTION 'Precio, stock o motivo inválido'; END IF;
 IF p_id IS NOT NULL THEN
  SELECT * INTO prod FROM public.productos WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
  old_stock=prod.stock;
  IF p_expected_stock IS NULL OR old_stock IS DISTINCT FROM p_expected_stock THEN RAISE EXCEPTION 'El stock cambió. Recarga antes de guardar para no sobrescribir una venta.'; END IF;
 END IF;
 INSERT INTO public.productos(id,name,brand,family,description,price,stock,image_url,presentation_ml,concentration,notes,budget_category,occasion,climate_preference)
 VALUES(v_id,p_payload->>'name',p_payload->>'brand',p_payload->>'family',p_payload->>'description',(p_payload->>'price')::numeric,new_stock,nullif(p_payload->>'image_url',''),(p_payload->>'presentation_ml')::integer,p_payload->>'concentration',p_payload->>'notes',p_payload->>'budget_category',p_payload->>'occasion',p_payload->>'climate_preference')
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,brand=excluded.brand,family=excluded.family,description=excluded.description,price=excluded.price,stock=excluded.stock,image_url=CASE WHEN p_payload ? 'image_url' THEN excluded.image_url ELSE productos.image_url END,presentation_ml=excluded.presentation_ml,concentration=excluded.concentration,notes=excluded.notes,budget_category=excluded.budget_category,occasion=excluded.occasion,climate_preference=excluded.climate_preference RETURNING * INTO prod;
 IF old_stock<>new_stock OR p_id IS NULL THEN INSERT INTO public.delta_stock_movements(producto_id,actor_id,delta,before_stock,after_stock,reason) VALUES(v_id,p_actor,new_stock-old_stock,old_stock,new_stock,p_reason); END IF;
 RETURN to_jsonb(prod);
END $$;
