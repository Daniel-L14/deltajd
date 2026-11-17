-- DELTA v2. Probar primero en una copia de Supabase. Sin DROP TABLE, TRUNCATE ni DELETE de datos.
-- Una incompatibilidad aborta TODA la transacción. No forzar ni eliminar datos para continuar.
BEGIN;
SET LOCAL lock_timeout='5s';
-- La aplicación utiliza UUID. Un esquema antiguo incompatible requiere adaptación explícita.
DO $$ DECLARE r record; BEGIN
 FOR r IN select table_name,data_type from information_schema.columns where table_schema='public' and column_name='id' and table_name in ('profiles','productos','pedidos','pedido_items','pedido_historial') LOOP
  IF r.data_type<>'uuid' THEN RAISE EXCEPTION 'Migración detenida: %.id no es UUID. Adaptar con el diagnóstico; datos intactos.',r.table_name; END IF;
 END LOOP;
 IF EXISTS(
  SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN ('productos','pedidos','pedido_items','pedido_historial') AND NOT t.tgisinternal
  AND NOT (c.relname='pedidos' AND (
    (t.tgname='trg_pedidos_codigo' AND t.tgtype=7 AND t.tgfoid=coalesce(to_regprocedure('public.set_codigo_pedido()')::oid,0::oid))
    OR (t.tgname='trg_pedidos_updated' AND t.tgtype=19 AND t.tgfoid=coalesce(to_regprocedure('public.set_updated_at()')::oid,0::oid))
  ))
 ) THEN
 RAISE EXCEPTION 'Migración detenida: hay triggers distintos de los automatismos de código y fecha de DELTA.';
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pedidos' AND column_name='estado' AND data_type NOT IN ('text','character varying')) THEN
 RAISE EXCEPTION 'Migración detenida: el estado del pedido requiere adaptación previa.';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id),role text NOT NULL DEFAULT 'CLIENTE');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'CLIENTE';
CREATE TABLE IF NOT EXISTS public.productos(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.pedidos(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.pedido_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.pedido_historial(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS family text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS price numeric(14,2) NOT NULL DEFAULT 0;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS presentation_ml integer;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS concentration text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS budget_category text NOT NULL DEFAULT 'SIN_CLASIFICAR';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS occasion text NOT NULL DEFAULT 'Sin clasificar';
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS climate_preference text NOT NULL DEFAULT 'SIN_CLASIFICAR';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_nombre text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_email text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_telefono text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS total numeric(14,2);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'nuevo';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS idempotency_key uuid;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS request_payload jsonb;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS stock_reserved boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS notas_admin text;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmado boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS whatsapp_confirmado_at timestamptz;
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id);
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS producto_id uuid REFERENCES public.productos(id);
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS nombre text;
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS precio numeric(14,2);
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS cantidad integer;
ALTER TABLE public.pedido_items ADD COLUMN IF NOT EXISTS subtotal numeric(14,2);
ALTER TABLE public.pedido_historial ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id);
ALTER TABLE public.pedido_historial ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE public.pedido_historial ADD COLUMN IF NOT EXISTS nota text;
ALTER TABLE public.pedido_historial ADD COLUMN IF NOT EXISTS creado_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.pedido_historial ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id);

-- No se asignan pedidos históricos a usuarios por correo sin verificar la titularidad.
-- No se inventan fechas de pago de pedidos históricos.
DO $$ BEGIN
 IF to_regclass('public.pedidos_codigo_uidx') IS NULL THEN
  CREATE UNIQUE INDEX IF NOT EXISTS delta_order_code_idx ON public.pedidos(codigo);
 END IF;
 IF to_regclass('public.idx_pedido_items_pedido') IS NULL THEN
  CREATE INDEX IF NOT EXISTS delta_order_items_idx ON public.pedido_items(pedido_id);
 END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS delta_order_idempotency_idx ON public.pedidos(user_id,idempotency_key);
CREATE INDEX IF NOT EXISTS delta_order_owner_idx ON public.pedidos(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS delta_order_paid_idx ON public.pedidos(paid_at) WHERE paid_at IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.delta_stock_movements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), producto_id uuid NOT NULL REFERENCES public.productos(id),
 pedido_id uuid REFERENCES public.pedidos(id),actor_id uuid REFERENCES auth.users(id),
 delta integer NOT NULL,before_stock integer NOT NULL,after_stock integer NOT NULL,
 reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.delta_points_ledger(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id),
 pedido_id uuid NOT NULL UNIQUE REFERENCES public.pedidos(id),points integer NOT NULL CHECK(points>=0),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.delta_favorites(
 user_id uuid NOT NULL REFERENCES auth.users(id),producto_id uuid NOT NULL REFERENCES public.productos(id),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,producto_id)
);
CREATE OR REPLACE FUNCTION public.delta_is_admin_v2() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role::text='ADMIN');
$$;
-- Guardar políticas anteriores facilita auditoría/recuperación; no es una copia de los datos.
CREATE TABLE IF NOT EXISTS public.delta_policy_backup_v2(tablename text,policyname text,definition jsonb,saved_at timestamptz DEFAULT now(),PRIMARY KEY(tablename,policyname));
INSERT INTO public.delta_policy_backup_v2(tablename,policyname,definition)
 SELECT tablename,policyname,to_jsonb(p) FROM pg_policies p WHERE schemaname='public' AND tablename IN ('profiles','productos','pedidos','pedido_items','pedido_historial','perfumes','inventory') ON CONFLICT DO NOTHING;
DO $$ DECLARE r record; t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','productos','pedidos','pedido_items','pedido_historial','delta_stock_movements','delta_points_ledger','delta_favorites','delta_policy_backup_v2'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['profiles','delta_stock_movements','delta_points_ledger','delta_favorites','delta_policy_backup_v2'] LOOP
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  FOR r IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=t LOOP
   EXECUTE format('REVOKE ALL (%I) ON public.%I FROM PUBLIC,anon,authenticated',r.column_name,t);
  END LOOP;
 END LOOP;
 FOR r IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('crear_pedido','cambiar_estado_pedido','handle_new_user','sync_catalog_visibility') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.signature);
 END LOOP;
END $$;
-- Las políticas antiguas del panel consultan el rol. El acceso anónimo a profiles sigue vacío por RLS.
DROP POLICY IF EXISTS "Perfil propio" ON public.profiles;
DROP POLICY IF EXISTS delta_profile_read ON public.profiles;
GRANT SELECT(id,role) ON public.profiles TO anon,authenticated;
CREATE POLICY delta_profile_read ON public.profiles FOR SELECT TO authenticated USING(id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Lectura publica de productos" ON public.productos;
DROP POLICY IF EXISTS delta_product_read ON public.productos;
GRANT SELECT(id,name,brand,family,price,stock,description,is_active,image_url,presentation_ml,concentration,notes,budget_category,occasion,climate_preference,created_at) ON public.productos TO anon,authenticated;
CREATE POLICY delta_product_read ON public.productos FOR SELECT TO anon,authenticated USING(is_active OR (SELECT public.delta_is_admin_v2()));
-- Solo el RPC nuevo cambia el estado de pedidos que reservan inventario.
REVOKE UPDATE ON public.pedidos FROM PUBLIC,anon,authenticated;
REVOKE UPDATE(estado,idempotency_key,user_id,stock_reserved,paid_at,request_payload) ON public.pedidos FROM PUBLIC,anon,authenticated;
GRANT UPDATE(notas_admin,whatsapp_confirmado,whatsapp_confirmado_at) ON public.pedidos TO authenticated;
DROP POLICY IF EXISTS delta_legacy_order_delete ON public.pedidos;
CREATE POLICY delta_legacy_order_delete ON public.pedidos AS RESTRICTIVE FOR DELETE TO anon,authenticated USING(idempotency_key IS NULL);
-- La RPC de la web anterior conserva su firma y solo administra pedidos de esa versión.
DO $legacy$
BEGIN
 IF to_regprocedure('public.cambiar_estado_pedido(uuid,text,text)') IS NOT NULL THEN
  EXECUTE $definition$
   CREATE OR REPLACE FUNCTION public.cambiar_estado_pedido(p_pedido_id uuid,p_estado text,p_nota text DEFAULT NULL)
   RETURNS public.pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $body$
   DECLARE v_pedido public.pedidos;
   BEGIN
    IF p_estado IS NULL OR p_estado NOT IN ('nuevo','pagado','entregado','cancelado') THEN
     RAISE EXCEPTION 'Estado inválido: %',p_estado;
    END IF;
    UPDATE public.pedidos SET estado=p_estado WHERE id=p_pedido_id AND idempotency_key IS NULL
    RETURNING * INTO v_pedido;
    IF NOT FOUND THEN
     RAISE EXCEPTION 'Pedido no disponible en el flujo anterior: %',p_pedido_id;
    END IF;
    INSERT INTO public.pedido_historial(pedido_id,estado,actor,nota) VALUES(p_pedido_id,p_estado,'admin',p_nota);
    RETURN v_pedido;
   END
   $body$
  $definition$;
 END IF;
END $legacy$;
DROP POLICY IF EXISTS delta_favorites_read ON public.delta_favorites;
DROP POLICY IF EXISTS delta_favorites_add ON public.delta_favorites;
DROP POLICY IF EXISTS delta_favorites_remove ON public.delta_favorites;
GRANT SELECT,INSERT,DELETE ON public.delta_favorites TO authenticated;
CREATE POLICY delta_favorites_read ON public.delta_favorites FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY delta_favorites_add ON public.delta_favorites FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.productos WHERE id=producto_id AND is_active));
CREATE POLICY delta_favorites_remove ON public.delta_favorites FOR DELETE TO authenticated USING(user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.delta_crear_pedido_v2(p_user_id uuid,p_email text,p_key uuid,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_order public.pedidos%ROWTYPE; v_product public.productos%ROWTYPE; it jsonb; qty integer;
 v_total numeric=0; v_items jsonb='[]'::jsonb; v_id uuid=gen_random_uuid();
 v_subtotal_generated boolean;
BEGIN
 IF p_user_id IS NULL OR p_key IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'Usuario o clave inválidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 SELECT * INTO v_order FROM public.pedidos WHERE user_id=p_user_id AND idempotency_key=p_key;
 IF FOUND THEN
  IF v_order.request_payload IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'La clave corresponde a otro pedido. Reinicia la confirmación.'; END IF;
  RETURN to_jsonb(v_order)-'request_payload'-'notas_admin';
 END IF;
 IF (SELECT count(*) FROM public.pedidos WHERE user_id=p_user_id AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'Demasiados pedidos. Espera antes de volver a intentar.'; END IF;
 IF jsonb_typeof(p_payload->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Carrito inválido'; END IF;
 IF jsonb_array_length(p_payload->'items') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Carrito inválido'; END IF;
 IF (SELECT count(*)<>count(DISTINCT x->>'producto_id') FROM jsonb_array_elements(p_payload->'items') x) THEN RAISE EXCEPTION 'Productos repetidos'; END IF;
 -- Orden estable de bloqueo: evita interbloqueos entre carritos con los mismos productos.
 FOR it IN SELECT value FROM jsonb_array_elements(p_payload->'items') ORDER BY value->>'producto_id' LOOP
  IF (it->>'cantidad') !~ '^[1-9][0-9]?$' THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
  qty=(it->>'cantidad')::integer;
  SELECT * INTO v_product FROM public.productos WHERE id=(it->>'producto_id')::uuid FOR UPDATE;
  IF NOT FOUND OR NOT coalesce(v_product.is_active,false) OR v_product.price IS NULL OR v_product.price<=0 OR coalesce(v_product.stock,0)<qty THEN RAISE EXCEPTION 'Un producto no está disponible o no tiene stock suficiente.'; END IF;
  v_total=v_total+v_product.price*qty;
  v_items=v_items||jsonb_build_array(jsonb_build_object('producto_id',v_product.id,'nombre',v_product.name,'precio',v_product.price,'cantidad',qty,'subtotal',v_product.price*qty));
 END LOOP;
 IF p_payload ? 'subtotal_visto_centavos' AND round(v_total*100)<>(p_payload->>'subtotal_visto_centavos')::numeric THEN
  RAISE EXCEPTION 'El precio cambió. Revisa el subtotal actualizado y confirma de nuevo.';
 END IF;
 INSERT INTO public.pedidos(id,codigo,cliente_nombre,cliente_email,cliente_telefono,direccion,total,estado,items,user_id,idempotency_key,request_payload,stock_reserved)
 VALUES(v_id,'DELTA-'||upper(replace(v_id::text,'-','')),p_payload->>'cliente_nombre',p_email,p_payload->>'cliente_telefono',p_payload->>'direccion',v_total,'nuevo',v_items,p_user_id,p_key,p_payload,true) RETURNING * INTO v_order;
 SELECT a.attgenerated<>'' INTO v_subtotal_generated
 FROM pg_catalog.pg_attribute a
 WHERE a.attrelid='public.pedido_items'::regclass AND a.attname='subtotal' AND NOT a.attisdropped;
 FOR it IN SELECT value FROM jsonb_array_elements(v_items) LOOP
  qty=(it->>'cantidad')::integer;
  IF v_subtotal_generated THEN
   INSERT INTO public.pedido_items(id,pedido_id,producto_id,nombre,precio,cantidad)
   VALUES(gen_random_uuid(),v_id,(it->>'producto_id')::uuid,it->>'nombre',(it->>'precio')::numeric,qty);
  ELSE
   INSERT INTO public.pedido_items(id,pedido_id,producto_id,nombre,precio,cantidad,subtotal)
   VALUES(gen_random_uuid(),v_id,(it->>'producto_id')::uuid,it->>'nombre',(it->>'precio')::numeric,qty,(it->>'subtotal')::numeric);
  END IF;
  UPDATE public.productos SET stock=stock-qty WHERE id=(it->>'producto_id')::uuid RETURNING * INTO v_product;
  INSERT INTO public.delta_stock_movements(producto_id,pedido_id,actor_id,delta,before_stock,after_stock,reason) VALUES(v_product.id,v_id,p_user_id,-qty,v_product.stock+qty,v_product.stock,'Reserva de pedido');
 END LOOP;
 INSERT INTO public.pedido_historial(id,pedido_id,estado,nota,actor_id) VALUES(gen_random_uuid(),v_id,'nuevo','Pedido registrado; stock reservado',p_user_id);
 RETURN to_jsonb(v_order)-'request_payload'-'notas_admin';
END $$;

CREATE OR REPLACE FUNCTION public.delta_estado_pedido_v2(p_id uuid,p_estado text,p_actor uuid,p_nota text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o public.pedidos%ROWTYPE; it record; after_qty integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role::text='ADMIN') THEN RAISE EXCEPTION 'No autorizado'; END IF;
 SELECT * INTO o FROM public.pedidos WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado'; END IF;
 IF o.estado=p_estado THEN RETURN jsonb_build_object('id',o.id,'codigo',o.codigo,'estado',o.estado); END IF;
 IF p_estado IS NULL OR NOT coalesce(((lower(o.estado) IN ('nuevo','pendiente') AND p_estado IN ('pagado','cancelado')) OR (o.estado='pagado' AND p_estado='entregado')),false) THEN RAISE EXCEPTION 'Transición no permitida. Un pago confirmado requiere un proceso de devolución, no cancelación.'; END IF;
 IF p_estado='cancelado' AND o.stock_reserved THEN
  FOR it IN SELECT producto_id,sum(cantidad)::integer AS cantidad FROM public.pedido_items WHERE pedido_id=p_id GROUP BY producto_id ORDER BY producto_id LOOP
   UPDATE public.productos SET stock=stock+it.cantidad WHERE id=it.producto_id RETURNING stock INTO after_qty;
   INSERT INTO public.delta_stock_movements(producto_id,pedido_id,actor_id,delta,before_stock,after_stock,reason) VALUES(it.producto_id,p_id,p_actor,it.cantidad,after_qty-it.cantidad,after_qty,'Liberación por cancelación');
  END LOOP;
 END IF;
 UPDATE public.pedidos SET estado=p_estado,updated_at=now(),paid_at=CASE WHEN p_estado='pagado' THEN now() ELSE paid_at END,stock_reserved=CASE WHEN p_estado='cancelado' THEN false ELSE stock_reserved END WHERE id=p_id;
 IF p_estado='pagado' AND o.user_id IS NOT NULL THEN
  INSERT INTO public.delta_points_ledger(user_id,pedido_id,points) VALUES(o.user_id,o.id,floor(o.total/1000)::integer) ON CONFLICT(pedido_id) DO NOTHING;
 END IF;
 INSERT INTO public.pedido_historial(id,pedido_id,estado,nota,actor_id) VALUES(gen_random_uuid(),p_id,p_estado,p_nota,p_actor);
 RETURN jsonb_build_object('id',o.id,'codigo',o.codigo,'estado',p_estado);
END $$;

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
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,brand=excluded.brand,family=excluded.family,description=excluded.description,price=excluded.price,stock=excluded.stock,image_url=excluded.image_url,presentation_ml=excluded.presentation_ml,concentration=excluded.concentration,notes=excluded.notes,budget_category=excluded.budget_category,occasion=excluded.occasion,climate_preference=excluded.climate_preference RETURNING * INTO prod;
 IF old_stock<>new_stock OR p_id IS NULL THEN INSERT INTO public.delta_stock_movements(producto_id,actor_id,delta,before_stock,after_stock,reason) VALUES(v_id,p_actor,new_stock-old_stock,old_stock,new_stock,p_reason); END IF;
 RETURN to_jsonb(prod);
END $$;

CREATE OR REPLACE FUNCTION public.delta_resumen_v2() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH bounds AS (SELECT date_trunc('day',now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota' AS day_start,date_trunc('month',now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota' AS month_start),
 paid AS (SELECT p.* FROM public.pedidos p,bounds b WHERE p.estado IN ('pagado','entregado') AND p.paid_at>=b.month_start),
 top_p AS (SELECT i.producto_id,max(i.nombre) AS nombre,sum(i.cantidad) AS cantidad FROM public.pedido_items i JOIN paid p ON p.id=i.pedido_id GROUP BY i.producto_id ORDER BY sum(i.cantidad) DESC LIMIT 5),
 low AS (SELECT id,name,stock FROM public.productos WHERE is_active AND stock<5 ORDER BY stock LIMIT 10)
 SELECT jsonb_build_object('ventasHoy',coalesce((SELECT sum(total) FROM paid,bounds WHERE paid_at>=day_start),0),'ventasMes',coalesce((SELECT sum(total) FROM paid),0),'ticketPromedio',coalesce((SELECT avg(total) FROM paid),0),'pedidosNuevos',(SELECT count(*) FROM public.pedidos WHERE lower(estado) IN ('nuevo','pendiente')),'pedidosSinConfirmar',(SELECT count(*) FROM public.pedidos WHERE lower(estado) IN ('nuevo','pendiente') AND NOT coalesce(whatsapp_confirmado,false)),'importePendiente',coalesce((SELECT sum(total) FROM public.pedidos WHERE lower(estado) IN ('nuevo','pendiente')),0),'historicosSinFechaPago',(SELECT count(*) FROM public.pedidos WHERE estado IN ('pagado','entregado') AND paid_at IS NULL),'topProductos',coalesce((SELECT jsonb_agg(top_p) FROM top_p),'[]'::jsonb),'stockBajo',coalesce((SELECT jsonb_agg(low) FROM low),'[]'::jsonb));
$$;
CREATE OR REPLACE FUNCTION public.delta_member_v2(p_user_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('points',coalesce((SELECT sum(points) FROM public.delta_points_ledger WHERE user_id=p_user_id),0),'pedidosCount',(SELECT count(*) FROM public.pedidos WHERE user_id=p_user_id),'ultimoPedido',(SELECT jsonb_build_object('codigo',codigo,'estado',estado,'total',total,'created_at',created_at) FROM public.pedidos WHERE user_id=p_user_id ORDER BY created_at DESC LIMIT 1));
$$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('delta_crear_pedido_v2','delta_estado_pedido_v2','delta_guardar_producto_v2','delta_resumen_v2','delta_member_v2','delta_is_admin_v2') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.delta_is_admin_v2() TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
