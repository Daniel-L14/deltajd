-- Registro de envíos para impedir avisos repetidos al reintentar un pedido.
CREATE TABLE IF NOT EXISTS public.delta_order_whatsapp (
    pedido_id uuid PRIMARY KEY REFERENCES public.pedidos(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown')),
    message_id text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delta_order_whatsapp ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.delta_order_whatsapp FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.delta_order_whatsapp TO service_role;
