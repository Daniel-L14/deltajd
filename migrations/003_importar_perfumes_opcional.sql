-- OPCIONAL: ejecutar después de 002, solo si se usaban perfumes e inventory.
-- Conserva tablas antiguas y sus IDs. Nunca sobrescribe productos existentes.
-- Detiene toda la importación ante duplicados ambiguos o inventario incompleto.
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$
DECLARE r record; v jsonb; inv jsonb; inv_count integer; qty integer; price_value numeric; v_id uuid;
BEGIN
 IF to_regclass('public.perfumes') IS NULL THEN RAISE NOTICE 'No existe perfumes: no hay nada que importar.';RETURN;END IF;
 IF to_regclass('public.inventory') IS NULL THEN RAISE EXCEPTION 'Falta inventory. Conciliar stock antes de importar.';END IF;
 FOR r IN EXECUTE 'SELECT to_jsonb(p) AS data FROM public.perfumes p' LOOP
  v=r.data;v_id=(v->>'id')::uuid;
  IF EXISTS(SELECT 1 FROM public.productos WHERE id=v_id) THEN
   IF EXISTS(SELECT 1 FROM public.productos WHERE id=v_id AND lower(trim(name))<>lower(trim(v->>'name'))) THEN RAISE EXCEPTION 'El ID % tiene nombres diferentes; revisar manualmente.',v_id;END IF;
   CONTINUE;
  END IF;
  IF EXISTS(SELECT 1 FROM public.productos WHERE lower(trim(name))=lower(trim(v->>'name'))) THEN RAISE EXCEPTION 'Nombre duplicado con otro ID: %. Conciliar antes de importar.',v->>'name';END IF;
  EXECUTE 'SELECT count(*)::int, (jsonb_agg(to_jsonb(i)))->0 FROM public.inventory i WHERE to_jsonb(i)->>''perfume_id''=$1' INTO inv_count,inv USING v_id::text;
  IF inv_count<>1 THEN RAISE EXCEPTION 'El perfume % tiene % registros de inventario; requiere conciliación.',v->>'name',inv_count;END IF;
  qty=(inv->>'stock_quantity')::integer;price_value=coalesce((inv->>'selling_price')::numeric,(v->>'price')::numeric);
  IF qty IS NULL OR qty<0 OR price_value IS NULL OR price_value<=0 THEN RAISE EXCEPTION 'Stock o precio inválido en %',v->>'name';END IF;
  INSERT INTO public.productos(id,name,brand,family,price,stock,description,is_active,budget_category,occasion,climate_preference)
  VALUES(v_id,v->>'name',coalesce(v->>'brand',''),coalesce(v->>'family',''),price_value,qty,coalesce(v->>'description',''),coalesce((v->>'is_active')::boolean,true),coalesce(v->>'budget_category','SIN_CLASIFICAR'),coalesce(v->>'occasion','Sin clasificar'),coalesce(v->>'climate_preference','SIN_CLASIFICAR'));
  INSERT INTO public.delta_stock_movements(producto_id,delta,before_stock,after_stock,reason) VALUES(v_id,qty,0,qty,'Importación auditada de inventario anterior; script 003');
 END LOOP;
END $$;
COMMIT;
