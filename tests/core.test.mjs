import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import path from "node:path";
import { PageSizes, PDFDocument, StandardFonts, rgb } from "pdf-lib";
function load(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.resolve(file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = {
    exports: {},
    require: (id) => {
      if (id in imports) return imports[id];
      throw new Error("Import inesperado " + id);
    },
    URL,
    Request,
    Response,
    TextDecoder,
    Uint8Array,
    console,
    ...globals,
  };
  vm.runInNewContext(code, context);
  return context.exports;
}
const validation = load("lib/validation.ts");
const { matchingFamilies, rankProducts } = load("lib/products.ts");
const uuid = "11111111-1111-4111-8111-111111111111";
const order = {
  cliente_nombre: "Cliente Prueba",
  cliente_telefono: "3001234567",
  direccion: "Calle 1 Bogotá",
  items: [{ producto_id: uuid, cantidad: 1, precio: 1 }],
  estado: "pagado",
  total: 1,
};
const formats = load("lib/format.ts");
const whatsapp = load("lib/pedidos/whatsapp.ts", { "../format": formats });
const savedOrder = {
  ...order,
  id: uuid,
  codigo: "DELTA-PRUEBA",
  cliente_nombre: "Lucía Mejía",
  cliente_email: "lucia@example.test",
  direccion: "Calle 42 & Carrera 10\nBogotá",
  total: 220000,
  items: [
    { nombre: "Cedro & Ámbar", cantidad: 2, precio: 90000 },
    { nombre: "Rosa", cantidad: 1, precio: 40000 },
  ],
};

test("El detalle de WhatsApp incluye datos del pedido, cantidades y precios registrados", () => {
  const message = whatsapp.orderWhatsAppMessage(savedOrder);
  for (const detail of [
    "DELTA-PRUEBA", "Lucía Mejía", "lucia@example.test", "3001234567",
    "Calle 42 & Carrera 10 Bogotá", "2 × Cedro & Ámbar", "1 × Rosa",
    formats.formatCOP(90000), formats.formatCOP(180000), formats.formatCOP(220000),
  ]) assert.ok(message.includes(detail), detail);
});

test("El botón de WhatsApp apunta al número de DELTA y conserva el mensaje completo", () => {
  const message = whatsapp.orderWhatsAppMessage(savedOrder);
  const { href, useClipboard } = whatsapp.orderWhatsAppLink(message);
  const url = new URL(href);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/573142352488");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal(useClipboard, false);

  const large = whatsapp.orderWhatsAppLink(message.repeat(50));
  assert.equal(large.href, "https://wa.me/573142352488");
  assert.equal(large.useClipboard, true);
});

test("El aviso adjunta el pedido completo y evita reenviar después de la aceptación de Meta", async () => {
  let status = "pending";
  let messageId;
  let calls = 0;
  const { notifyOrderOnWhatsApp } = load("lib/pedidos/whatsapp-business.ts", {
    "server-only": {},
    "pdf-lib": { PageSizes, PDFDocument, StandardFonts, rgb },
    "../format": formats,
    "./whatsapp": whatsapp,
    "../supabase/admin": {
      createAdminClient: () => ({
        from: (table) => {
          assert.equal(table, "delta_order_whatsapp");
          return {
            upsert: async () => ({}),
            update: (data) => ({
              eq: (_column, id) => {
                assert.equal(id, uuid);
                if (data.status !== "sending") {
                  status = data.status;
                  messageId = data.message_id;
                  return Promise.resolve({});
                }
                return {
                  in: (_field, allowed) => ({
                    select: () => ({
                      maybeSingle: async () => {
                        if (!allowed.includes(status)) return { data: null };
                        status = data.status;
                        return { data: { pedido_id: id } };
                      },
                    }),
                  }),
                };
              },
            }),
          };
        },
      }),
    },
  }, {
    process: { env: {
      WHATSAPP_ACCESS_TOKEN: "test",
      WHATSAPP_PHONE_NUMBER_ID: "123456",
      WHATSAPP_TEMPLATE_NAME: "delta_pedido_recibido",
      WHATSAPP_TEMPLATE_LANGUAGE: "es_CO",
      WHATSAPP_GRAPH_VERSION: "v24.0",
      NEXT_PUBLIC_WHATSAPP_PHONE: "573001234567",
    } },
    Blob, FormData, AbortSignal,
    fetch: async (url, init) => {
      calls += 1;
      assert.equal(init.headers.Authorization, "Bearer test");
      if (url.endsWith("/media")) {
        assert.equal(init.body.get("type"), "application/pdf");
        const file = init.body.get("file");
        assert.equal(file.type, "application/pdf");
        const pdf = await PDFDocument.load(await file.arrayBuffer());
        assert.ok(pdf.getPageCount() > 1);
        return Response.json({ id: "document-id" });
      }
      assert.equal(url, "https://graph.facebook.com/v24.0/123456/messages");
      const payload = JSON.parse(init.body);
      assert.equal(payload.to, "573142352488");
      assert.equal(payload.template.name, "delta_pedido_recibido");
      assert.equal(payload.template.components[0].parameters[0].document.id, "document-id");
      assert.equal(payload.template.components[1].parameters[0].text, savedOrder.codigo);
      return Response.json({ messages: [{ id: "wamid.test" }] });
    },
  });
  const largeOrder = {
    ...savedOrder,
    items: Array.from({ length: 50 }, (_, i) => ({
      ...savedOrder.items[0], nombre: `Perfume número ${i + 1} de la colección DELTA`,
    })),
  };
  const outcomes = await Promise.all([
    notifyOrderOnWhatsApp(largeOrder),
    notifyOrderOnWhatsApp(largeOrder),
  ]);
  assert.deepEqual(outcomes.sort(), ["accepted", "already_attempted"]);
  assert.equal(await notifyOrderOnWhatsApp(largeOrder), "already_attempted");
  assert.equal(calls, 2);
  assert.equal(messageId, "wamid.test");
});
test("El contrato descarta precios y estados enviados por el cliente", () => {
  const parsed = validation.parseOrder(order);
  assert.equal(parsed.estado, undefined);
  assert.equal(parsed.total, undefined);
  assert.equal(parsed.items[0].precio, undefined);
});
test("Rechaza cantidades negativas, fraccionarias, repetidas e identificadores inválidos", () => {
  for (const cantidad of [-1, 0, 1.5, 100, Infinity, "1"])
    assert.throws(() =>
      validation.parseOrder({
        ...order,
        items: [{ producto_id: uuid, cantidad }],
      }),
    );
  assert.throws(() =>
    validation.parseOrder({
      ...order,
      items: [order.items[0], order.items[0]],
    }),
  );
  assert.throws(() =>
    validation.parseOrder({
      ...order,
      items: [{ producto_id: "ficticio", cantidad: 1 }],
    }),
  );
});
test("Las redirecciones solo permiten rutas del sitio", () => {
  for (const s of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "javascript:alert(1)",
    "/\n/evil.test",
    "/a/..//evil.test",
    "/%2e%2e//evil.test",
  ])
    assert.equal(validation.safeNext(s), "/tienda");
  assert.equal(validation.safeNext("/tienda/carrito"), "/tienda/carrito");
  assert.equal(validation.safeNext("/a/../tienda?orden=1"), "/tienda?orden=1");
});
const base = {
  id: uuid,
  name: "Uno",
  brand: "DELTA",
  family: "Amaderada",
  price: 100000,
  stock: 2,
  is_active: true,
  budget_category: "MEDIO",
  occasion: "Diario",
  climate_preference: "FRIO",
};
test("El recomendador utiliza familia, ocasión y clima; excluye agotados y otro presupuesto", () => {
  const products = [
    base,
    {
      ...base,
      id: "b",
      family: "Floral",
      occasion: "Trabajo",
      climate_preference: "CALIDO",
    },
    { ...base, id: "c", stock: 0 },
    { ...base, id: "d", budget_category: "PREMIUM" },
  ];
  const first = rankProducts(products, {
    budget: "MEDIO",
    family: "Amaderada",
    occasion: "Diario",
    climate: "FRIO",
  });
  const second = rankProducts(products, {
    budget: "MEDIO",
    family: "Floral",
    occasion: "Trabajo",
    climate: "CALIDO",
  });
  assert.equal(first[0].product.id, uuid);
  assert.equal(second[0].product.id, "b");
  assert.equal(first.length, 2);
  assert.equal(first[0].score, 100);
});
test("Los filtros de familias incluyen las agrupaciones del catálogo", () => {
  assert.deepEqual(Array.from(matchingFamilies("Amaderada")), [
    "Amaderada",
    "Orientales & Madera",
  ]);
  assert.deepEqual(Array.from(matchingFamilies("Floral")), [
    "Floral",
    "Cítricos & Florales",
  ]);
  assert.deepEqual(Array.from(matchingFamilies("Extractos Concentrados")), [
    "Extractos Concentrados",
  ]);
});
test("El recomendador usa precios de productos sin categoría y sus datos registrados", () => {
  const prefs = {
    budget: "MEDIO",
    family: "Amaderada",
    occasion: "Diario",
    climate: "TODOS",
  };
  const product = {
    ...base,
    budget_category: "SIN_CLASIFICAR",
    price: 50000,
    occasion: "Sin clasificar",
    climate_preference: "SIN_CLASIFICAR",
  };
  const results = rankProducts([product, { ...product, price: 100000 }], prefs);
  assert.equal(results.length, 1);
  assert.equal(results[0].product.price, 50000);
  assert.equal(results[0].score, 65);
  assert.match(results[0].reasons[0], /precio/);
});
const http = load("lib/http.ts", {
  "server-only": {},
  "next/server": {
    NextResponse: {
      json: (data, opts) => new Response(JSON.stringify(data), opts),
    },
  },
  "./validation": validation,
});
test("Valida origen, JSON y tamaño máximo del body", async () => {
  const forwarded = {
    Origin: "https://delta.example.test",
    "X-Forwarded-Host": "delta.example.test",
    "Content-Type": "application/json",
  };
  assert.equal(
    await http.body(
      new Request("https://localhost:3000/api", {
        method: "POST",
        headers: {
          ...forwarded,
          "X-Forwarded-Host": "localhost:3000",
          "Sec-Fetch-Site": "same-origin",
        },
        body: "true",
      }),
    ),
    true,
  );
  assert.equal(
    await http.body(
      new Request("https://localhost:3000/api", {
        method: "POST",
        headers: forwarded,
        body: "true",
      }),
    ),
    true,
  );
  await assert.rejects(
    () =>
      http.body(
        new Request("https://localhost:3000/api", {
          method: "POST",
          headers: { ...forwarded, "Sec-Fetch-Site": "cross-site" },
          body: "{}",
        }),
      ),
    { status: 403 },
  );
  await assert.rejects(() =>
    http.body(
      new Request("http://localhost/api", {
        method: "POST",
        headers: {
          Origin: "https://evil.test",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    ),
  );
  await assert.rejects(() =>
    http.body(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(33000),
      }),
    ),
  );
});
test("No existen las antiguas rutas PUT y DELETE de pedidos", () => {
  const route = load("app/api/pedidos/route.ts", {
    "next/server": { connection: async () => {} },
    "@/lib/auth": {},
    "@/lib/supabase/admin": {},
    "@/lib/http": http,
    "@/lib/validation": validation,
    "@/lib/pedidos/whatsapp-business": {},
  });
  assert.equal(route.PUT, undefined);
  assert.equal(route.DELETE, undefined);
});
test("POST sin sesión devuelve 401 sin tocar base administrativa", async () => {
  let calls = 0;
  const route = load("app/api/pedidos/route.ts", {
    "next/server": { connection: async () => {} },
    "@/lib/auth": {
      requireUser: async () => {
        throw new validation.ApiError(401, "Inicia sesión");
      },
    },
    "@/lib/supabase/admin": {
      createAdminClient: () => {
        calls++;
      },
    },
    "@/lib/http": http,
    "@/lib/validation": validation,
    "@/lib/pedidos/whatsapp-business": {},
  });
  const result = await route.POST(
    new Request("http://localhost/api/pedidos", { method: "POST", body: "{}" }),
  );
  assert.equal(result.status, 401);
  assert.equal(calls, 0);
});
test("POST autenticado envía contrato seguro y clave idempotente a SQL", async () => {
  let params, deferred, notified;
  const route = load("app/api/pedidos/route.ts", {
    "next/server": { after: (callback) => { deferred = callback; } },
    "@/lib/auth": {
      requireUser: async () => ({
        user: { id: uuid, email: "cliente@example.test" },
      }),
    },
    "@/lib/supabase/admin": {
      createAdminClient: () => ({
        rpc: async (_name, args) => {
          params = args;
          return {
            data: { id: uuid, codigo: "demo", estado: "nuevo", total: 100000 },
            error: null,
          };
        },
      }),
    },
    "@/lib/http": http,
    "@/lib/validation": validation,
    "@/lib/pedidos/whatsapp-business": { notifyOrderOnWhatsApp: async (record) => { notified = record; } },
  });
  const result = await route.POST(
    new Request("http://localhost/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": uuid },
      body: JSON.stringify(order),
    }),
  );
  assert.equal(result.status, 201);
  assert.equal(params.p_user_id, uuid);
  assert.equal(params.p_payload.estado, undefined);
  assert.equal(params.p_payload.items[0].precio, undefined);
  assert.equal(notified, undefined);
  await deferred();
  assert.equal(notified.codigo, "demo");
});
