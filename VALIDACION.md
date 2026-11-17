# Validación de DELTA

| Comprobación | Resultado |
|---|---|
| `npm run lint` | Correcto, sin errores ni advertencias de ESLint. |
| `npm test` | 12 pruebas pasaron. Incluye pruebas de API con dependencias simuladas y ejecución de SQL en PostgreSQL embebido. |
| `npm run build` | Correcto con Next.js 16.4.5 y Node.js 24. La compilación incluye comprobación de tipos. |
| `npm run test:http` | 6 solicitudes correctas contra el servidor de producción local. |
| `npm audit --omit=dev` | Cero avisos en las dependencias de producción al momento de la revisión. |

Las pruebas SQL comprobaron precios oficiales, reconfirmación si cambia el subtotal, reintentos sin duplicar la reserva, reposición por cancelación, permisos, puntos, importación de inventario y conservación de registros en un esquema compatible. El servidor local confirmó las redirecciones de catálogo y checkout, el acceso anónimo al panel y los rechazos `401` en API privadas.

Falta la prueba de integración con una copia de tu Supabase y la revisión del recorrido visual en un navegador. `LEEME_PRIMERO.md` contiene los pasos para comprobar registro por correo, permisos, pedidos, catálogo y móvil con tu configuración. Revisa los pedidos históricos y las políticas reales antes de aplicar la migración en producción.

Next.js se actualizó a [16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5), que contiene correcciones de seguridad publicadas por sus mantenedores.
