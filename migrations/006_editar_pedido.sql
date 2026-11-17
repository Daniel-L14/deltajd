BEGIN;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS items_revision integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.delta_editar_pedido_v1(
  p_id uuid, p_actor uuid, p_revision integer, p_items jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  orden public.pedidos%ROWTYPE;
  producto public.productos%ROWTYPE;
  linea record;
  lineas integer;
  nuevos_items jsonb := '[]'::jsonb;
  nuevo_total numeric := 0;
  diferencia integer;
  subtotal_generado boolean;
  cambios text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role::text = 'ADMIN') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'No autorizado.';
  END IF;

  SELECT * INTO orden FROM public.pedidos WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado.'; END IF;
  IF coalesce(lower(orden.estado), '') NOT IN ('nuevo', 'pendiente') OR orden.paid_at IS NOT NULL THEN
    RAISE EXCEPTION 'Solo se pueden editar pedidos pendientes de pago.';
  END IF;
  IF orden.stock_reserved IS NOT TRUE THEN
    RAISE EXCEPTION 'Este pedido no tiene una reserva de inventario que se pueda ajustar.';
  END IF;
  IF p_revision IS DISTINCT FROM orden.items_revision THEN
    RAISE EXCEPTION 'El pedido cambió. Recárgalo y revisa las cantidades antes de guardar.';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Cantidades del pedido inválidas.';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_items) AS item
    WHERE jsonb_typeof(item->'producto_id') IS DISTINCT FROM 'string'
       OR coalesce(item->>'producto_id', '') !~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
       OR jsonb_typeof(item->'cantidad') IS DISTINCT FROM 'number'
       OR coalesce(item->>'cantidad', '') !~ '^(0|[1-9][0-9]?)$'
  ) THEN RAISE EXCEPTION 'Cantidades del pedido inválidas.'; END IF;

  SELECT count(*) INTO lineas FROM public.pedido_items WHERE pedido_id = p_id;
  IF lineas <> jsonb_array_length(p_items) OR lineas <> (
    SELECT count(DISTINCT x.producto_id)
    FROM jsonb_to_recordset(p_items) AS x(producto_id uuid, cantidad integer)
  ) OR lineas <> (
    SELECT count(DISTINCT i.producto_id) FROM public.pedido_items AS i
    JOIN jsonb_to_recordset(p_items) AS x(producto_id uuid, cantidad integer)
      ON x.producto_id = i.producto_id
    WHERE i.pedido_id = p_id AND i.cantidad BETWEEN 1 AND 99 AND i.precio > 0
  ) THEN RAISE EXCEPTION 'Recarga el pedido y ajusta los perfumes que aparecen en su detalle.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_to_recordset(p_items) AS x(cantidad integer) WHERE x.cantidad > 0) THEN
    RAISE EXCEPTION 'Conserva al menos un perfume o cancela el pedido.';
  END IF;

  SELECT attgenerated <> '' INTO subtotal_generado
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.pedido_items'::regclass AND attname = 'subtotal' AND NOT attisdropped;

  -- Bloquear los productos en el mismo orden que al crear o cancelar pedidos.
  FOR linea IN
    SELECT i.*, x.cantidad AS nueva_cantidad FROM public.pedido_items AS i
    JOIN jsonb_to_recordset(p_items) AS x(producto_id uuid, cantidad integer)
      ON x.producto_id = i.producto_id
    WHERE i.pedido_id = p_id ORDER BY i.producto_id
  LOOP
    diferencia := linea.nueva_cantidad - linea.cantidad;
    IF diferencia <> 0 THEN
      SELECT * INTO producto FROM public.productos WHERE id = linea.producto_id FOR UPDATE;
      IF NOT FOUND OR producto.stock IS NULL OR (
        diferencia > 0 AND (producto.is_active IS NOT TRUE OR producto.stock < diferencia)
      ) THEN RAISE EXCEPTION 'No hay disponibilidad suficiente para %.', linea.nombre; END IF;

      UPDATE public.productos SET stock = producto.stock - diferencia WHERE id = producto.id;
      INSERT INTO public.delta_stock_movements
        (producto_id, pedido_id, actor_id, delta, before_stock, after_stock, reason)
      VALUES (producto.id, p_id, p_actor, -diferencia, producto.stock, producto.stock - diferencia, 'Ajuste de pedido');

      IF linea.nueva_cantidad = 0 THEN
        DELETE FROM public.pedido_items WHERE id = linea.id;
      ELSIF subtotal_generado THEN
        UPDATE public.pedido_items SET cantidad = linea.nueva_cantidad WHERE id = linea.id;
      ELSE
        UPDATE public.pedido_items SET cantidad = linea.nueva_cantidad,
          subtotal = linea.precio * linea.nueva_cantidad WHERE id = linea.id;
      END IF;
      cambios := array_append(cambios, format('%s: %s → %s', linea.nombre, linea.cantidad, linea.nueva_cantidad));
    END IF;
    IF linea.nueva_cantidad > 0 THEN
      nuevo_total := nuevo_total + linea.precio * linea.nueva_cantidad;
      nuevos_items := nuevos_items || jsonb_build_array(jsonb_build_object(
        'producto_id', linea.producto_id, 'nombre', linea.nombre, 'precio', linea.precio,
        'cantidad', linea.nueva_cantidad, 'subtotal', linea.precio * linea.nueva_cantidad
      ));
    END IF;
  END LOOP;

  IF cardinality(cambios) > 0 THEN
    UPDATE public.pedidos SET items = nuevos_items, total = nuevo_total, updated_at = now(),
      items_revision = items_revision + 1 WHERE id = p_id;
    INSERT INTO public.pedido_historial (id, pedido_id, estado, nota, actor_id)
    VALUES (gen_random_uuid(), p_id, orden.estado,
      format('Pedido editado. Total: %s → %s COP. %s', orden.total, nuevo_total, array_to_string(cambios, ', ')), p_actor);
  END IF;
  RETURN jsonb_build_object('id', orden.id, 'codigo', orden.codigo);
END $$;

CREATE OR REPLACE FUNCTION public.delta_pagar_pedido_verificado_v1(
  p_id uuid, p_actor uuid, p_revision integer, p_nota text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  revision integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role::text = 'ADMIN') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'No autorizado.';
  END IF;
  SELECT items_revision INTO revision FROM public.pedidos WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado.'; END IF;
  IF p_revision IS DISTINCT FROM revision THEN
    RAISE EXCEPTION 'El pedido cambió. Recárgalo y verifica el nuevo total antes de registrar el pago.';
  END IF;
  RETURN public.delta_estado_pedido_v2(p_id, 'pagado', p_actor, p_nota);
END $$;

REVOKE ALL ON FUNCTION public.delta_editar_pedido_v1(uuid, uuid, integer, jsonb),
  public.delta_pagar_pedido_verificado_v1(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delta_editar_pedido_v1(uuid, uuid, integer, jsonb),
  public.delta_pagar_pedido_verificado_v1(uuid, uuid, integer, text) TO service_role;

COMMIT;
