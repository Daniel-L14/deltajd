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

## Pedidos por WhatsApp

Después de confirmar, el cliente pulsa **Enviar pedido por WhatsApp**.
Se abre el chat de DELTA en el **+57 314 235 2488** con el mensaje
preparado. El cliente pulsa **Enviar** dentro de WhatsApp. El número
comercial se configura en `lib/pedidos/whatsapp.ts`.

### Aviso automático opcional

Al confirmar un pedido, DELTA puede disparar un aviso automático
desde WhatsApp Business si el entorno tiene configurado el remitente y la
plantilla. El aviso incluye el código, el total y un PDF con los datos del
pedido.

1. Aplica `migrations/005_aviso_pedido_whatsapp.sql` en el Supabase de DELTA.
2. En Meta, registra un número remitente para la API de WhatsApp Business.
   Usa un remitente diferente del número comercial que recibe los pedidos.
3. Crea una plantilla de utilidad con encabezado de documento PDF y dos
   variables posicionales en el cuerpo. Por ejemplo, «DELTA registró el
   pedido {{1}} por {{2}}. Consulta el detalle adjunto para preparar la entrega».
4. Cuando Meta apruebe la plantilla, configura las variables
   `WHATSAPP_*` de `.env.example` en Codespaces o en el alojamiento.
   Usa el ID del teléfono remitente, el nombre e idioma aprobados, la
   versión vigente de Graph API y un token con permiso
   `whatsapp_business_messaging`. Guarda el token como secreto del servidor.
5. Reinicia el servidor para cargar las variables.

**Administración → Pedidos → Detalle → Aviso por WhatsApp** muestra el
resultado del envío. Si Meta aceptó el mensaje, DELTA conserva su identificador
para evitar reenviarlo. Si el resultado queda por verificar, revisa el chat
de la empresa. Cuando el aviso falla de forma explícita, puedes reintentarlo
desde el detalle del pedido.
