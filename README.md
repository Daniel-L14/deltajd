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
