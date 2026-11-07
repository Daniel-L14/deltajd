# Contexto del proyecto DELTA

## Qué es

DELTA es una tienda de perfumería construida con Next.js App Router, React y TypeScript. La interfaz está en español y utiliza Tailwind CSS. Supabase se usa para autenticación, lectura/escritura de productos y pedidos, y actualizaciones en tiempo real.

El proyecto contiene una tienda pública, registro e inicio de sesión, un carrito, pantallas administrativas y rutas API. Hay partes completas y otras que todavía son prototipos o marcadores; las diferencias relevantes están descritas al final.

## Tecnologías y comandos

- **Next.js 16 / React 19**: páginas, layouts y API Routes.
- **TypeScript**: tipos del frontend y backend.
- **Supabase**: Auth y base de datos PostgreSQL.
- **Tailwind CSS 4**: estilos.
- **lucide-react**: iconos.
- `npm run dev`: entorno local.
- `npm run build`: compilación de producción.
- `npm run lint`: ESLint.

Variables de entorno usadas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (operaciones administrativas del servidor; no debe exponerse al navegador)

No hay un archivo `.env.example` en el repositorio. La clave de servicio se valida en `lib/supabase/admin.ts`.

## Estructura completa del repositorio

```text
.
├── .gitignore
├── AGENTS.md
├── PROJECT_CONTEXT.md
├── README.md
├── app/
│   ├── (auth)/                         Grupo de rutas de autenticación; no forma parte de la URL
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── admin/                          Rutas del panel administrativo
│   │   ├── AdminClientPage.tsx         Implementación anterior de productos
│   │   ├── inventario/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pedidos/
│   │   │   ├── [codigo]/page.tsx       Detalle administrativo por código
│   │   │   └── page.tsx
│   │   └── productos/page.tsx
│   ├── api/                            Endpoints HTTP (Route Handlers)
│   │   ├── auth/
│   │   │   ├── [...supabase]/route.ts  Segmento catch-all de callback
│   │   │   └── confirm/route.ts
│   │   ├── configuracion/route.ts
│   │   ├── dashboard/resumen/route.ts
│   │   ├── inventario/route.ts
│   │   ├── pedidos/
│   │   │   ├── [id]/
│   │   │   │   ├── estado/route.ts
│   │   │   │   └── whatsapp/route.ts
│   │   │   └── route.ts
│   │   ├── productos/
│   │   │   ├── status/route.ts
│   │   │   └── route.ts
│   │   ├── recetas/route.ts
│   │   ├── stats/resumen/route.ts
│   │   ├── usuarios/verificar/route.ts
│   │   └── webhooks/stripe/route.ts
│   ├── catalogo/page.tsx
│   ├── components/                     Componentes React reutilizables
│   │   ├── CartDrawer.tsx
│   │   ├── admin/
│   │   │   ├── ConfiguracionView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── InventarioView.tsx
│   │   │   ├── ProductosView.tsx
│   │   │   ├── ReportesView.tsx
│   │   │   ├── UsuariosView.tsx
│   │   │   ├── VentasView.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── CanalesYPagos.tsx
│   │   │   │   ├── GraficosVentas.tsx
│   │   │   │   ├── MetaDiaria.tsx
│   │   │   │   ├── MetricasOperacion.tsx
│   │   │   │   ├── ResumenFinanciero.tsx
│   │   │   │   └── VentanaModularFinanciera.tsx
│   │   │   └── layout/AdminSidebar.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegistroForm.tsx
│   │   ├── catalog/CatalogView.tsx
│   │   ├── layout/Navbar.tsx
│   │   └── recommendation/RecommendationWizard.tsx
│   ├── context/CartContext.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── nosotros/page.tsx
│   ├── page.tsx
│   ├── test/page.tsx
│   └── tienda/
│       ├── carrito/page.tsx
│       ├── checkout/page.tsx
│       ├── page.tsx
│       └── pedido/[codigo]/page.tsx
├── eslint.config.mjs
├── lib/                                Acceso a datos, tipos y utilidades
│   ├── db.ts
│   ├── firebase.ts
│   ├── format.ts
│   ├── pedidos/types.ts
│   └── supabase/
│       ├── admin.ts
│       ├── client.ts
│       ├── middleware.ts
│       └── server.ts
├── middleware.ts
├── migrations/
│   └── 001_pedidos_codigo_items_historial.sql
├── next                                Archivo vacío sin extensión, sin uso conocido
├── next.config.ts
├── deltajd@0.1.0                       Archivo vacío sin extensión, sin uso conocido
├── package-lock.json
├── package.json
├── public/                             Recursos estáticos servidos desde la raíz web
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   └── vercel.svg
└── tsconfig.json
```

Las carpetas `node_modules/`, `.next/` y otras salidas generadas no aparecen aquí porque son dependencias o artefactos de build, no archivos fuente versionados. El árbol enumera el estado del repositorio observado al actualizar esta guía; los dos archivos raíz marcados como vacíos son residuos sin un rol conocido y no deben confundirse con código de la aplicación.

En App Router, cada `page.tsx` define una URL según su ubicación; `layout.tsx` envuelve las páginas de su segmento. Las carpetas entre paréntesis, como `(auth)`, agrupan rutas sin formar parte de la URL. Los nombres entre corchetes, como `[codigo]` e `[id]`, son segmentos dinámicos.

## Rutas visibles

| URL | Archivo | Para qué sirve |
|---|---|---|
| `/` | `app/page.tsx` | Inicio y navegación principal de la marca. |
| `/tienda` | `app/tienda/page.tsx` | Catálogo principal; lee `productos`, permite añadir al carrito y abrir el panel del carrito. |
| `/catalogo` | `app/catalogo/page.tsx` | Otra vista de catálogo con filtros por familia. Es independiente de `/tienda`. |
| `/tienda/carrito` | `app/tienda/carrito/page.tsx` | Resumen del carrito y formulario para crear un pedido. |
| `/tienda/checkout` | `app/tienda/checkout/page.tsx` | Redirige a `/carrito`. |
| `/tienda/pedido/[codigo]` | `app/tienda/pedido/[codigo]/page.tsx` | Confirmación/consulta pública de un pedido por código. |
| `/nosotros` | `app/nosotros/page.tsx` | Historia, valores y datos de la boutique. |
| `/test` | `app/test/page.tsx` | Recomendador de fragancias. |
| `/login` | `app/(auth)/login/page.tsx` | Inicio de sesión. |
| `/registro` | `app/(auth)/registro/page.tsx` | Registro de usuario. |
| `/admin` | `app/admin/page.tsx` | Resumen administrativo. |
| `/admin/pedidos` | `app/admin/pedidos/page.tsx` | Lista, filtros y acciones de pedidos. |
| `/admin/pedidos/[codigo]` | `app/admin/pedidos/[codigo]/page.tsx` | Detalle administrativo de un pedido. |
| `/admin/inventario` | `app/admin/inventario/page.tsx` | Alta y edición de productos/inventario. |
| `/admin/productos` | `app/admin/productos/page.tsx` | Gestión basada en el modelo antiguo de perfumes. |

## Archivos de la aplicación

### Base y páginas públicas

| Archivo | Responsabilidad |
|---|---|
| `app/layout.tsx` | Layout raíz: idioma, metadatos, fuente y proveedor global del carrito. |
| `app/globals.css` | Importa Tailwind y define estilos/variables globales. |
| `app/page.tsx` | Landing principal, enlaces a tienda/nosotros y estado de sesión. |
| `app/catalogo/page.tsx` | Catálogo alternativo que consulta `productos` y filtra por familia. |
| `app/nosotros/page.tsx` | Página institucional de DELTA. |
| `app/test/page.tsx` | Enmarca el componente del recomendador y agrega navegación. |
| `app/favicon.ico` | Icono del sitio. |

### Autenticación

| Archivo | Responsabilidad |
|---|---|
| `app/(auth)/login/page.tsx` | Página que monta `LoginForm`. |
| `app/(auth)/registro/page.tsx` | Página que monta `RegistroForm`. |
| `app/components/auth/LoginForm.tsx` | Formulario de login con Supabase Auth y redirección por rol. |
| `app/components/auth/RegistroForm.tsx` | Registro con email, contraseña y nombre. |

### Tienda y carrito

| Archivo | Responsabilidad |
|---|---|
| `app/tienda/page.tsx` | Catálogo principal, búsqueda/filtro, datos de productos y acciones para añadir al carrito. Incluye datos de muestra si la consulta no devuelve productos. |
| `app/tienda/carrito/page.tsx` | Muestra productos, modifica cantidades y envía los datos del cliente a `POST /api/pedidos`. |
| `app/tienda/checkout/page.tsx` | Alias que redirige al carrito. |
| `app/tienda/pedido/[codigo]/page.tsx` | Consulta pedido, líneas e historial para mostrar la confirmación y estado. |
| `app/context/CartContext.tsx` | Estado global del carrito, operaciones de cantidad y persistencia en `localStorage` (`delta_cart`). |
| `app/components/CartDrawer.tsx` | Panel lateral del carrito usado desde la tienda. |
| `app/components/catalog/CatalogView.tsx` | Otra implementación de catálogo/carrito y envío de pedido; no es la vista usada por `/tienda/page.tsx`. |
| `app/components/layout/Navbar.tsx` | Barra de navegación reusable con detección de usuario/rol. La portada define su propia cabecera. |
| `app/components/recommendation/RecommendationWizard.tsx` | Cuestionario de preferencias y búsqueda de fragancias recomendadas. |

### Administración

| Archivo | Responsabilidad |
|---|---|
| `app/admin/layout.tsx` | Marco del panel: navegación, enlace a la tienda y cierre de sesión. |
| `app/admin/page.tsx` | Dashboard que consulta `/api/stats/resumen` y presenta KPIs, top de productos y stock bajo. |
| `app/admin/pedidos/page.tsx` | Lista pedidos en tiempo real; filtra por estado, texto y fecha; permite cambiar estado y confirmar WhatsApp. |
| `app/admin/pedidos/[codigo]/page.tsx` | Detalle administrativo: datos, artículos, historial, cambio de estado, notas y contacto WhatsApp. |
| `app/admin/inventario/page.tsx` | CRUD básico de productos consultando la tabla `productos`. |
| `app/admin/productos/page.tsx` | Página que monta `ProductosView`, una gestión distinta basada en `perfumes`. |
| `app/admin/AdminClientPage.tsx` | Implementación cliente de administración de productos con catálogo de ejemplo; parece corresponder a una versión anterior. |
| `app/components/admin/DashboardView.tsx` | Vista de dashboard placeholder (indica TODO). |
| `app/components/admin/ConfiguracionView.tsx` | Componente de vista de configuración. |
| `app/components/admin/InventarioView.tsx` | Vista de inventario de la versión antigua; consulta `inventory` y relaciones con `perfumes`. |
| `app/components/admin/ProductosView.tsx` | CRUD de perfumes de la versión antigua; consulta la tabla `perfumes`. |
| `app/components/admin/ReportesView.tsx` | Vista de reportes. |
| `app/components/admin/UsuariosView.tsx` | Vista de usuarios. |
| `app/components/admin/VentasView.tsx` | Vista de ventas. |
| `app/components/admin/layout/AdminSidebar.tsx` | Sidebar reusable para el panel. |
| `app/components/admin/dashboard/CanalesYPagos.tsx` | Bloque visual de canales y medios de pago. |
| `app/components/admin/dashboard/GraficosVentas.tsx` | Bloque de gráficos de ventas. |
| `app/components/admin/dashboard/MetaDiaria.tsx` | Bloque visual de meta diaria. |
| `app/components/admin/dashboard/MetricasOperacion.tsx` | Bloque de métricas operativas. |
| `app/components/admin/dashboard/ResumenFinanciero.tsx` | Bloque de resumen financiero. |
| `app/components/admin/dashboard/VentanaModularFinanciera.tsx` | Ventana/componente financiero modular. |

### API Routes

| Archivo | Método(s) y responsabilidad actual |
|---|---|
| `app/api/pedidos/route.ts` | GET lista pedidos; POST crea uno mediante RPC; PUT cambia estado; DELETE marca cancelado. |
| `app/api/pedidos/[id]/estado/route.ts` | PATCH valida sesión/rol y cambia el estado mediante RPC. |
| `app/api/pedidos/[id]/whatsapp/route.ts` | PATCH marca si el pedido fue confirmado por WhatsApp. |
| `app/api/stats/resumen/route.ts` | GET calcula ventas, pedidos, ticket promedio, productos más vendidos y bajo stock; valida rol de administrador. |
| `app/api/productos/route.ts` | GET/POST/PUT/DELETE: endpoints placeholder, todavía responden `{ ok: true }`. |
| `app/api/productos/status/route.ts` | PUT placeholder. |
| `app/api/inventario/route.ts` | GET/POST/PUT/DELETE placeholder. |
| `app/api/configuracion/route.ts` | GET/POST/PUT/DELETE placeholder. |
| `app/api/dashboard/resumen/route.ts` | GET placeholder. |
| `app/api/recetas/route.ts` | GET/POST/PUT/DELETE placeholder; no confundir con pedidos ni recomendador. |
| `app/api/usuarios/verificar/route.ts` | POST placeholder para verificación/RBAC. |
| `app/api/auth/[...supabase]/route.ts` | Callback placeholder de autenticación; actualmente devuelve `{ ok: true }`. |
| `app/api/auth/confirm/route.ts` | Verifica OTP de email de Supabase y redirige después de la confirmación. |
| `app/api/webhooks/stripe/route.ts` | Webhook de Stripe en construcción; el comentario indica que falta validar firma y actualizar pedido. |

### Tipos, acceso a datos y configuración

| Archivo | Responsabilidad |
|---|---|
| `lib/pedidos/types.ts` | Estados, etiquetas, colores y tipos TypeScript de pedidos e ítems. |
| `lib/format.ts` | Formateadores de moneda COP y fecha/hora local. |
| `lib/supabase/client.ts` | Cliente Supabase para el navegador, compatible con claves anon/publishable. |
| `lib/supabase/server.ts` | Cliente Supabase para Server Components/Route Handlers, conectado a cookies. |
| `lib/supabase/admin.ts` | Cliente servidor con `SUPABASE_SERVICE_ROLE_KEY`; no usar en código cliente. |
| `lib/supabase/middleware.ts` | Helper `updateSession` que sincroniza sesión y contiene lógica de rol para `/admin`. |
| `lib/db.ts` | Cliente Supabase genérico creado con `@supabase/supabase-js`; su uso debe distinguirse de los clientes SSR. |
| `lib/firebase.ts` | Actualmente exporta un cliente Supabase para navegador pese al nombre histórico del archivo. |
| `middleware.ts` | Middleware Next que sincroniza/renueva sesión Supabase en cookies para las rutas coincidentes. |
| `migrations/001_pedidos_codigo_items_historial.sql` | Archivo destinado a cambios SQL de pedidos; está vacío en el estado inspeccionado. |

### Archivos raíz y recursos

| Archivo | Responsabilidad |
|---|---|
| `package.json` | Dependencias y comandos npm. |
| `package-lock.json` | Versiones exactas resueltas de dependencias npm. |
| `tsconfig.json` | Opciones de TypeScript y alias `@/*` hacia la raíz. |
| `next.config.ts` | Configuración de Next, incluyendo cache components, prefetch parcial y loader de CSS de Tailwind/Turbopack. |
| `eslint.config.mjs` | Reglas ESLint de Next Core Web Vitals y TypeScript. |
| `.gitignore` | Archivos que Git debe ignorar, como `.env*`, dependencias y builds. |
| `README.md` | README generado por Next.js; todavía contiene instrucciones genéricas del starter, no documentación específica del producto. |
| `AGENTS.md` | Instrucción local para agentes que trabajan en el proyecto. |
| `public/file.svg` | Recurso SVG estático. |
| `public/globe.svg` | Recurso SVG estático. |
| `public/next.svg` | Recurso SVG del starter de Next.js. |
| `public/vercel.svg` | Recurso SVG del starter de Vercel. |

## Flujos principales

### Crear un pedido

1. `/tienda` carga productos desde `productos` y los agrega a `CartContext`.
2. El carrito vive en memoria y se guarda en `localStorage`.
3. `/tienda/carrito` envía cliente e ítems a `POST /api/pedidos`.
4. El endpoint normaliza nombres/campos de ítems y llama a la función PostgreSQL `crear_pedido` con el cliente de servicio.
5. Se guarda temporalmente la última compra en el navegador y se navega a `/tienda/pedido/[codigo]`.

El backend espera que existan en Supabase las RPC `crear_pedido` y `cambiar_estado_pedido`, además de tablas como `pedidos`, `pedido_items`, `pedido_historial` y `profiles`. El archivo de migración presente está vacío, por lo que este repositorio no documenta actualmente cómo se crean esas funciones/tablas.

### Administración de pedidos

El listado y los detalles usan Supabase para consultar pedidos; los cambios de estado y confirmación de WhatsApp pasan por las rutas API correspondientes. El dashboard consulta `/api/stats/resumen`.

## Observaciones importantes para orientarse

1. **Hay dos modelos de producto/inventario.** Las páginas operativas actuales usan `productos` con campos como `name`, `price` y `stock`. Varios componentes de `app/components/admin/` y el recomendador usan `perfumes`/`inventory`. Antes de ampliar esas vistas, confirmar qué esquema existe realmente en Supabase.
2. **Hay varias vistas de catálogo.** `/tienda` es la experiencia conectada al carrito global. `/catalogo` es otra página; su botón de añadir al carrito no está conectado al contexto en el código inspeccionado. `CatalogView.tsx` es una tercera implementación.
3. **La navegación administrativa no muestra todas las páginas existentes.** El layout enlaza Dashboard, Pedidos e Inventario; `/admin/productos` existe pero no aparece en ese menú.
4. **No todas las API están implementadas.** Productos, inventario, configuración, dashboard, recetas y verificación de usuarios incluyen respuestas placeholder.
5. **Protección administrativa duplicada.** `lib/supabase/middleware.ts` tiene una función de protección por rol, mientras que `middleware.ts` implementa su propio middleware y no la importa. Algunas API, por ejemplo estado/WhatsApp y estadísticas, sí validan el rol en la propia ruta.
6. **El README no describe DELTA.** Esta guía contiene el contexto específico observado en el código.
7. En el árbol de trabajo inspeccionado aparecían dos archivos raíz vacíos, `next` y `deltajd@0.1.0`; no son código fuente conocido de la aplicación.

## Estado del árbol al crear esta guía

Había cambios locales preexistentes en páginas de pedidos, APIs y utilidades (algunos archivos nuevos y otros modificados). No se alteraron esos cambios para preparar este documento. La descripción refleja el contenido visible en ese momento; conviene actualizarla cuando se consoliden cambios de arquitectura o base de datos.
