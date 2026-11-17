# Archivos de DELTA que cambian

Abre `DELTA_mejorado` como una carpeta nueva. Para aplicar los cambios a una rama de tu repositorio, copia completos los archivos nuevos y reemplazados y retira los archivos listados al final. `proxy.ts` reemplaza a `middleware.ts` en la raíz. El ayudante `lib/supabase/middleware.ts` sí se conserva.

Consulta `LEEME_PRIMERO.md` antes de aplicar SQL. Guarda tu `.env.local` en privado y utiliza las variables de tu proyecto de pruebas.

## Archivos nuevos (36)

- `.env.example`
- `CAMBIOS_ARCHIVOS.md`
- `LEEME_PRIMERO.md`
- `VALIDACION.md`
- `app/admin/movimientos/page.tsx`
- `app/api/admin/movimientos/route.ts`
- `app/api/admin/pedidos/[codigo]/route.ts`
- `app/api/cuenta/favoritos/importar/route.ts`
- `app/api/cuenta/favoritos/route.ts`
- `app/api/cuenta/pedido-pendiente/route.ts`
- `app/api/cuenta/pedidos/[codigo]/route.ts`
- `app/api/cuenta/pedidos/route.ts`
- `app/api/cuenta/route.ts`
- `app/api/pedidos/[id]/nota/route.ts`
- `app/api/productos/[id]/route.ts`
- `app/api/recomendaciones/route.ts`
- `app/auth/auth-code-error/page.tsx`
- `app/components/admin/AdminShell.tsx`
- `app/recuperar/page.tsx`
- `app/restablecer/page.tsx`
- `app/tienda/producto/[id]/page.tsx`
- `docs/historico/PROJECT_CONTEXT.md`
- `docs/historico/PROYECTO_CONTEXTO.md`
- `lib/auth.ts`
- `lib/client-api.ts`
- `lib/http.ts`
- `lib/products.ts`
- `lib/supabase/config.ts`
- `lib/validation.ts`
- `migrations/000_diagnostico_solo_lectura.sql`
- `migrations/002_delta_seguro.sql`
- `migrations/003_importar_perfumes_opcional.sql`
- `proxy.ts`
- `tests/core.test.mjs`
- `tests/database.test.mjs`
- `tests/http-smoke.mjs`

## Archivos reemplazados (74)

- `.gitignore`
- `PROJECT_CONTEXT.md`
- `PROYECTO_CONTEXTO.md`
- `README.md`
- `app/(auth)/login/page.tsx`
- `app/(auth)/registro/page.tsx`
- `app/admin/AdminClientPage.tsx`
- `app/admin/inventario/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/pedidos/[codigo]/page.tsx`
- `app/admin/pedidos/page.tsx`
- `app/admin/productos/page.tsx`
- `app/api/auth/[...supabase]/route.ts`
- `app/api/auth/confirm/route.ts`
- `app/api/configuracion/route.ts`
- `app/api/dashboard/resumen/route.ts`
- `app/api/inventario/route.ts`
- `app/api/pedidos/[id]/estado/route.ts`
- `app/api/pedidos/[id]/whatsapp/route.ts`
- `app/api/pedidos/route.ts`
- `app/api/productos/route.ts`
- `app/api/productos/status/route.ts`
- `app/api/recetas/route.ts`
- `app/api/stats/resumen/route.ts`
- `app/api/usuarios/verificar/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/catalogo/page.tsx`
- `app/components/CartDrawer.tsx`
- `app/components/admin/ConfiguracionView.tsx`
- `app/components/admin/DashboardView.tsx`
- `app/components/admin/InventarioView.tsx`
- `app/components/admin/ProductosView.tsx`
- `app/components/admin/ReportesView.tsx`
- `app/components/admin/UsuariosView.tsx`
- `app/components/admin/VentasView.tsx`
- `app/components/admin/dashboard/CanalesYPagos.tsx`
- `app/components/admin/dashboard/GraficosVentas.tsx`
- `app/components/admin/dashboard/MetaDiaria.tsx`
- `app/components/admin/dashboard/MetricasOperacion.tsx`
- `app/components/admin/dashboard/ResumenFinanciero.tsx`
- `app/components/admin/dashboard/VentanaModularFinanciera.tsx`
- `app/components/admin/layout/AdminSidebar.tsx`
- `app/components/auth/AuthShell.tsx`
- `app/components/auth/LoginForm.tsx`
- `app/components/auth/RegistroForm.tsx`
- `app/components/catalog/CatalogView.tsx`
- `app/components/home/HeroBottle.tsx`
- `app/components/home/MemberPanel.tsx`
- `app/components/layout/Navbar.tsx`
- `app/components/recommendation/RecommendationWizard.tsx`
- `app/context/CartContext.tsx`
- `app/cuenta/pedidos/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/nosotros/page.tsx`
- `app/page.tsx`
- `app/test/page.tsx`
- `app/tienda/carrito/page.tsx`
- `app/tienda/checkout/page.tsx`
- `app/tienda/page.tsx`
- `app/tienda/pedido/[codigo]/page.tsx`
- `lib/club.ts`
- `lib/db.ts`
- `lib/firebase.ts`
- `lib/format.ts`
- `lib/pedidos/types.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/server.ts`
- `lib/useMember.ts`
- `package-lock.json`
- `package.json`

## Archivos retirados (3)

- `deltajd@0.1.0`
- `middleware.ts`
- `next`
