# DELTA — instalación de la versión corregida

Este paquete contiene **archivos completos**, no fragmentos para añadir al final de los originales. Trabaja primero en una carpeta nueva y con una copia de Supabase. El ZIP original permanece como respaldo del código.

## 1. Qué está corregido y qué debes saber

- Un solo catálogo: `productos` para tienda, recomendador e inventario.
- Servidor comprueba sesión, rol y propiedad de los pedidos. Las operaciones privilegiadas no aceptan un rol enviado por el navegador.
- Precio y stock se consultan en SQL; el navegador envía IDs y cantidades.
- Reserva transaccional de stock e idempotencia por usuario para reintentos. Si cambia el subtotal mientras el cliente revisa el carrito, debe revisar y confirmar el precio actualizado.
- Flujo de estados: nuevo → pagado → entregado; nuevo → cancelado. Cancelar libera una reserva una sola vez. Los pagos confirmados no se cancelan con ese botón.
- Compras asociadas al ID autenticado. **Ahora es necesario iniciar sesión para confirmar un pedido**. La navegación y el catálogo siguen siendo públicos. El carrito se conserva al iniciar sesión.
- Confirmaciones recuperadas desde servidor, sin depender de `delta_ultimo_pedido`.
- Test por presupuesto, familia, ocasión y clima; resultados ordenados y enlace a ficha individual.
- Favoritos en Supabase. Se intenta importar sin borrar los favoritos locales antiguos cuyos productos siguen disponibles.
- Puntos concedidos una sola vez al confirmar el pago. 1 punto por cada $1.000 COP completos de cada pedido. Los niveles son informativos; no aplican descuentos automáticos.
- Ventas por `paid_at`, con horario America/Bogota. Las entregas conservan el pago en estadísticas.
- Inventario con movimientos y comprobación de stock anterior para evitar sobrescribir una venta.
- Productos archivados, no borrados físicamente.
- Registro, confirmación de correo, recuperación de contraseña, rutas de error y redirecciones internas.
- Los módulos no implementados responden 501, nunca éxito ficticio.
- No se muestran productos de demostración como si fueran existencias reales.

**No se ha conectado ni modificado tu Supabase real.** La compatibilidad con sus triggers, restricciones, tipos y columnas reales debe verificarse con el paso 4. El script no elimina filas ni tablas; sí cambia permisos y políticas para cerrar accesos inseguros, y deshabilita el acceso público a las RPC antiguas.

## 2. Copia de seguridad antes de empezar

1. Conserva tu ZIP original y la carpeta que usas actualmente.
2. Conserva tu `.env.local` en privado. No lo subas a GitHub ni lo envíes por el chat.
3. Respalda la base de datos con el procedimiento de Supabase y verifica que puedes restaurarla en un proyecto de pruebas. Exportar solo CSV no guarda funciones, políticas, relaciones ni toda la configuración.
4. Si usas Supabase Storage, conserva también los archivos: un respaldo SQL no es una copia de los objetos de Storage.
5. Guarda las plantillas de correo y las URLs autorizadas actuales.

Documentación oficial:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

No ejecutes la migración en la base usada por la web original mientras esa web sigue atendiendo compras. La versión anterior utiliza rutas y permisos que esta versión cierra.

## 3. Abrir la carpeta nueva

1. Extrae `DELTA_corregido_completo.zip`.
2. Abre la carpeta `DELTA_mejorado` en Visual Studio Code mediante Archivo → Abrir carpeta.
3. Comprueba que ves `package.json`, `app`, `lib` y `migrations`.
4. Abre Terminal → Nueva terminal. Usa PowerShell o CMD en Windows.
5. Ejecuta:

```powershell
node --version
npm --version
npm ci
```

La validación de este paquete se hizo con Node 24. La versión de Node usada por tu hosting debe ser compatible con las dependencias del proyecto. El ZIP no incluye `node_modules` ni `.next`; `npm ci` instala las versiones del lockfile.

## 4. Inspeccionar Supabase sin cambiar datos

En el proyecto de PRUEBAS que contenga una copia de tu base:

1. Abre SQL Editor y crea una consulta.
2. Copia **todo** `migrations/000_diagnostico_solo_lectura.sql`.
3. Ejecútalo y guarda los resultados.

Esto muestra columnas, políticas, restricciones y triggers. No modifica información.

**No continúes si faltan datos del respaldo o no sabes qué hace un trigger existente.** Puedes compartir la estructura, políticas y funciones del diagnóstico para adaptar la migración; no compartas claves ni registros de clientes.

## 5. Aplicar el esquema seguro en PRUEBAS

1. Abre otra consulta en SQL Editor.
2. Copia **todo** `migrations/002_delta_seguro.sql`.
3. Ejecútalo completo, no por fragmentos.
4. Debe finalizar correctamente. Una incompatibilidad provoca rollback de la transacción. Si la sesión queda en error, ejecuta `ROLLBACK;` antes de otra consulta.

El script comprueba, entre otras cosas, que los IDs existentes sean UUID. Se detiene ante triggers de negocio en tablas afectadas, un estado enum o un subtotal generado que necesitan adaptación. No elimina esos controles automáticamente. Otras restricciones específicas de tu esquema también pueden exigir ajustes: el diagnóstico previo sigue siendo necesario.

El script crea campos/tablas que faltan, funciones `delta_*_v2`, índices y políticas. Guarda definiciones de políticas anteriores en `delta_policy_backup_v2` como apoyo de auditoría, **no como sustituto de un respaldo completo**.

No ejecutes el archivo vacío `001_pedidos_codigo_items_historial.sql`; se conserva únicamente por compatibilidad histórica.

## 6. Unificar perfumes del modelo antiguo, si los utilizabas

Si tus perfumes están en `perfumes` e `inventory`, ejecuta después **todo** `migrations/003_importar_perfumes_opcional.sql` en PRUEBAS.

- Copia los registros faltantes a `productos`, conservando sus IDs.
- Mantiene intactas las tablas antiguas.
- No sobrescribe un producto ya existente con el mismo ID.
- Se detiene si hay nombres duplicados con IDs diferentes, inventario ausente o varias filas de inventario para un mismo perfume.
- Un producto ya existente en ambos modelos debe conciliarse manualmente; no se suman ambos stocks, porque podrían representar las mismas unidades físicas.

Después revisa físicamente stock, precio, familia, presupuesto, ocasión y clima desde el panel. Los productos anteriores de `productos` reciben atributos de recomendación “sin clasificar” cuando faltan. **No se inventan preferencias olfativas**: clasifícalos antes de esperar que aparezcan en el test.

Cada fila vendible representa una presentación. Si vendes 50 ml y 100 ml, usa registros diferenciados en esta versión; una gestión completa de variantes/SKU relacionados queda fuera de este cambio.

## 7. Configurar las variables

En la raíz de la carpeta nueva:

```powershell
Copy-Item .env.example .env.local
```

En CMD puedes usar `copy .env.example .env.local`. Abre `.env.local` y reemplaza los valores de ejemplo por los del proyecto de PRUEBAS:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_SERVICE_ROLE_SOLO_SERVIDOR
```

También se admite `NEXT_PUBLIC_SUPABASE_ANON_KEY` como alternativa a la publishable. No necesitas definir ambas.

La clave service role **nunca** debe llevar prefijo `NEXT_PUBLIC_`, aparecer en componentes cliente ni subirse a GitHub. Reinicia el servidor después de editar variables. Al desplegar, configura las mismas variables en el hosting y vuelve a compilar.

El botón de pedidos usa el número de DELTA, +57 314 235 2488. Se configura en `lib/pedidos/whatsapp.ts`.

## 8. Confirmación y recuperación de correo

En la configuración de autenticación de Supabase:

1. Usa `http://localhost:3000` como Site URL del proyecto de pruebas mientras trabajas localmente.
2. Autoriza `http://localhost:3000/api/auth/confirm` y `http://localhost:3000/api/auth/confirm?next=/restablecer` como destinos de redirección.
3. Mantén habilitada la confirmación de correo para clientes.
4. Configura el proveedor de envío de correo que realmente utilizará la tienda y comprueba la recepción de mensajes.

El callback soporta `code` (PKCE) y `token_hash`. Para enlaces de token hash puedes utilizar estas plantillas mínimas:

**Confirmar registro:**

```html
<h2>Confirma tu cuenta DELTA</h2>
<p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/tienda">Confirmar mi correo</a></p>
```

**Recuperar contraseña:**

```html
<h2>Recupera tu acceso a DELTA</h2>
<p><a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/restablecer">Elegir una nueva contraseña</a></p>
```

En producción cambia Site URL y destinos autorizados por tu dominio HTTPS. Si abres en tu teléfono un enlace con `localhost`, apuntará al teléfono; usa una URL de pruebas accesible para probar desde otro dispositivo.

Referencias oficiales:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- https://supabase.com/docs/guides/auth/redirect-urls

## 9. Habilitar tu cuenta administradora

1. Inicia la web con `npm run dev`, regístrate y confirma tu correo.
2. En SQL Editor del proyecto de PRUEBAS identifica tu usuario:

```sql
select id, email from auth.users
where lower(email) = lower('TU_CORREO_REAL');
```

3. Sustituye el correo del siguiente bloque por el mismo correo verificado y ejecútalo:

```sql
insert into public.profiles (id, role)
select id, 'ADMIN' from auth.users
where lower(email) = lower('TU_CORREO_REAL')
on conflict (id) do update set role = 'ADMIN';
```

Debe afectar exactamente una cuenta. Si afecta cero, revisa el correo. Si tu tabla `profiles` antigua tiene otras columnas obligatorias sin valor por defecto, completa ese registro conforme a su esquema: no elimines restricciones para forzar el alta.

4. Cierra sesión y vuelve a entrar. El panel está en `/admin`.
5. No asignes permisos administrativos a través de `user_metadata`.

## 10. Revisar productos reales

En `/admin/inventario`:

1. Revisa nombres, marcas, precios y stock disponible.
2. Completa la familia, categoría de presupuesto, ocasión y clima.
3. Agrega notas, concentración y mililitros cuando dispongas de esa información.
4. Usa una URL HTTPS pública y estable de una fotografía autorizada. No uses enlaces temporales con vencimiento.
5. Guarda indicando el motivo. Si el stock cambió mientras editabas, recarga y repite con los valores actuales.
6. Usa **Archivar** para retirar productos sin borrar sus ventas.
7. Consulta `/admin/movimientos` para revisar entradas, ajustes, reservas y liberaciones.

La aplicación no añade fotografías ni características inventadas. Las categorías de presupuesto son comerciales; define criterios coherentes al clasificar cada producto.

## 11. Ejecutar las verificaciones

Con `.env.local` configurado:

```powershell
npm run lint
npm test
npm run build
npm run test:http
npm run dev
```

No ejecutes `npm run test:http` si otro proceso ya utiliza el puerto 3197. Esa prueba arranca un servidor temporal, verifica respuestas anónimas y lo cierra. `npm test` utiliza PostgreSQL embebido con datos ficticios; no toca Supabase real.

Recorridos manuales obligatorios en PRUEBAS:

1. Visitante: abre `/admin`; debe redirigir al login.
2. Cliente: no puede cambiar estados ni abrir los pedidos de otro usuario.
3. Agrega un producto al carrito y recarga; debe conservarse.
4. Inicia sesión desde el carrito; debe conservarse la compra.
5. Confirma un pedido; verifica precio real, cantidad y reserva en inventario.
6. Abre la confirmación desde otro dispositivo con la misma cuenta.
7. Reintenta tras un fallo de conexión; verifica que no se duplicó el pedido.
8. Cancela un pedido nuevo; el stock vuelve una sola vez.
9. Confirma un pago real de prueba; los puntos se conceden una sola vez.
10. Marca como entregado; la venta permanece en los indicadores.
11. Cambia familia, ocasión y clima en el test con varios productos bien clasificados.
12. Guarda un favorito y abre la cuenta en otro dispositivo.
13. Prueba registro, correo de confirmación, recuperación y cambio de contraseña.
14. Revisa móvil de 360–390 px, teclado, zoom al 200% y mensajes de error.

## 12. Qué archivos reemplazan los anteriores

La forma recomendada es trabajar con **la carpeta nueva completa**. Si necesitas copiar sobre una rama nueva de tu repositorio, copia todos los archivos del paquete excepto tus secretos y dependencias generadas. No copies `node_modules`, `.next` ni `.env.local` entre proyectos distintos.

**Elimina el viejo `middleware.ts` al usar `proxy.ts`. No mantengas los dos.**

| Área | Archivos principales completos |
|---|---|
| Sesión y permisos | `proxy.ts`, `lib/auth.ts`, `lib/supabase/config.ts`, `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` |
| Validación | `lib/validation.ts`, `lib/http.ts`, `lib/client-api.ts` |
| Pedidos | `app/api/pedidos/route.ts`, rutas de estado, WhatsApp y nota |
| Cuenta y privacidad | `app/api/cuenta/**`, `app/api/admin/**`, `lib/useMember.ts` |
| Datos de catálogo | `lib/products.ts`, `app/api/productos/**`, `app/api/recomendaciones/route.ts` |
| Tienda | `app/tienda/page.tsx`, `app/catalogo/page.tsx`, `app/tienda/producto/[id]/page.tsx` |
| Compra | `app/context/CartContext.tsx`, `app/components/CartDrawer.tsx`, carrito, checkout y confirmación |
| Administración | `app/admin/**`, `app/components/admin/AdminShell.tsx` |
| Test | `app/components/recommendation/RecommendationWizard.tsx` |
| Registro y acceso | `app/components/auth/**`, callback de confirmación, `/recuperar`, `/restablecer` y página de error |
| Presentación | `app/page.tsx`, `app/nosotros/page.tsx`, `app/layout.tsx`, `app/globals.css`, Navbar |
| Métricas y club | `app/api/stats/resumen/route.ts`, `lib/club.ts`, `lib/format.ts`, MemberPanel |
| Instalación y pruebas | `.env.example`, `package.json`, `package-lock.json`, `tests/**`, `migrations/**` |

`CAMBIOS_ARCHIVOS.md` contiene la lista exacta de añadidos, modificados y retirados respecto al ZIP original.

## 13. Pasar a producción sin mezclar versiones

1. Completa las pruebas de integración sobre la copia de tu base.
2. Revisa tus datos comerciales reales: teléfono, entrega, imágenes, atención al cliente y beneficios del club.
3. Obtén un respaldo final de código, datos y configuración.
4. Pausa temporalmente la recepción de pedidos en la versión anterior.
5. Aplica los scripts ya probados en producción y configura las cuentas administrativas.
6. Publica el código nuevo y sus variables en un hosting que ejecute el servidor Next.js. GitHub Pages por sí solo no ejecuta estas API.
7. Ejecuta los recorridos esenciales con cuentas de prueba y consulta logs.
8. Reactiva las ventas.

Si falla una migración, no la fuerces ni borres tablas. Si falla el despliegue después de migrar, mantén la tienda sin recibir pedidos mientras corriges o restauras de forma coordinada. **Volver solo al código viejo no es suficiente**, porque los permisos antiguos se han cerrado.

## 14. Datos históricos y límites honestos

- Los pedidos antiguos conservan sus datos. No se vinculan automáticamente por correo, ni se inventan fechas de pago. Verifica titularidad y pagos antes de completar `user_id`/`paid_at` en registros históricos.
- Los puntos comienzan en el nuevo ledger. No se inventa ni concede retroactivamente un saldo antiguo sin conciliación.
- Revisa las reservas/stock de pedidos antiguos que sigan abiertos: no es posible deducir si la función anterior descontó stock sin revisar esa función y los datos.
- WhatsApp coordina el pago; no cobra automáticamente. Stripe continúa deshabilitado. No se considera una integración de pagos terminada.
- No se implementa una devolución de un pago ya confirmado. Requiere conciliación de dinero, stock y puntos en un flujo específico; no se simula con “cancelado”.
- No se incluye APK, PWA, notificaciones automáticas, descuentos reales, variantes enlazadas, contabilidad, analítica de conversión ni entrenamiento de IA. Son ampliaciones, no requisitos para corregir los fallos auditados.
- Las búsquedas se aplican al catálogo, inventario y pedidos antes de paginar. El recomendador recorre todos los candidatos del presupuesto seleccionado.
- Las imágenes usan `next/image` sin optimización remota para admitir URLs HTTPS administradas por la tienda. No se ha configurado una CDN de imágenes.
- Las pruebas automáticas y la compilación no reemplazan la prueba contra tu Supabase ni la revisión visual en dispositivos reales.

## 15. Si aparece un error

| Mensaje | Acción |
|---|---|
| Configura variables públicas | Revisar `.env.local` y reiniciar `npm run dev`. |
| Falta service role | Configurar únicamente en servidor; nunca hacerla pública. |
| Función `delta_*_v2` no encontrada | Verificar que 002 terminó en el mismo proyecto al que apunta `.env.local`. |
| Migración detenida por trigger/tipo | Guardar diagnóstico y adaptar. No quitar el guard ni borrar información. |
| El stock cambió | Recargar producto y revisar stock antes de guardar. |
| Sin recomendaciones | Completar presupuesto, familia, ocasión, clima y existencias del catálogo. |
| Pedido antiguo no aparece en cuenta | Conciliar su titularidad; administración conserva el registro. |
| No tengo acceso admin | Revisar `profiles.role = 'ADMIN'` para el UUID correcto. |
| Error de correo | Revisar Site URL, Redirect URLs, plantilla y proveedor de envío. |
| Pedido pudo crearse pese al fallo de red | Consultar Mis pedidos antes de cambiar el carrito y reintentar. |
