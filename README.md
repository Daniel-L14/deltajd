# DELTA — tienda y administración corregidas

Empieza por **LEEME_PRIMERO.md**. Contiene el paso a paso completo, las migraciones, las variables y la configuración de acceso.

- Tecnologías: Next.js 16.4.5, React 19.3.0, TypeScript, Tailwind y Supabase.
- Catálogo único en `productos`; pedidos autenticados y RPC privilegiadas solo desde servidor.
- Compra por reserva de stock y coordinación manual de pago.
- SQL transaccional y pruebas automatizadas incluidas.

```bash
npm ci
# Configura .env.local según .env.example y aplica las migraciones en PRUEBAS.
npm run lint
npm test
npm run build
npm run test:http
npm run dev
```

Consulta `VALIDACION.md` para conocer qué se verificó y qué requiere tu entorno real.

## Fotografías de productos

En **Administración → Productos e inventario**, selecciona el perfume y arrastra
una imagen JPG, PNG o WebP de hasta 4 MB. Para un perfume existente, usa
**Guardar solo la foto**. Para uno nuevo, usa **Guardar producto**.

En un proyecto de Supabase nuevo, aplica las migraciones de DELTA en orden y
prepara una vez el bucket de fotos con las variables de Supabase configuradas.

```bash
node --env-file=.env.local scripts/configurar-fotos.mjs
```

El bucket sirve las fotos del catálogo. Las escrituras pasan por la
autorización de administrador de DELTA. Las credenciales se mantienen en el
entorno del servidor.
