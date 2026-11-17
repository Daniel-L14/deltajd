import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
test("Migración, integridad de pedidos, puntos, stock y permisos RLS", async () => {
  const db = new PGlite();
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`,
  );
  const sql = fs.readFileSync(
    new URL("../migrations/002_delta_seguro.sql", import.meta.url),
    "utf8",
  );
  await db.exec(sql);
  console.log("PASS migration fresh");
  await db.exec(sql);
  console.log("PASS migration rerun");
  const admin = "11111111-1111-4111-8111-111111111111",
    user = "22222222-2222-4222-8222-222222222222",
    user2 = "33333333-3333-4333-8333-333333333333";
  await db.query(
    "insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)",
    [
      admin,
      "admin@example.test",
      user,
      "buyer@example.test",
      user2,
      "buyer2@example.test",
    ],
  );
  await db.query(
    "insert into profiles(id,role) values ($1,'ADMIN'),($2,'CLIENTE')",
    [admin, user],
  );
  const product = {
    name: "Perfume QA",
    brand: "DELTA",
    family: "Amaderada",
    price: 100000,
    stock: 2,
    description: "Prueba",
    image_url: null,
    presentation_ml: 100,
    concentration: "EDP",
    notes: "Madera",
    budget_category: "MEDIO",
    occasion: "Diario",
    climate_preference: "FRIO",
  };
  const {
    rows: [r],
  } = await db.query(
    "select delta_guardar_producto_v2(null,$1,$2,$3,null) as product",
    [product, admin, "Stock inicial"],
  );
  const id = r.product.id;
  const payload = {
    cliente_nombre: "Prueba",
    cliente_telefono: "3001234567",
    direccion: "Calle 1 Bogotá",
    items: [{ producto_id: id, cantidad: 1, precio: 1 }],
  };
  const key = "44444444-4444-4444-8444-444444444444";
  await assert.rejects(
    () =>
      db.query("select delta_crear_pedido_v2($1,$2,$3,$4)", [
        user,
        "buyer@example.test",
        key,
        { ...payload, subtotal_visto_centavos: 100 },
      ]),
    /El precio cambió/,
  );
  assert.equal(
    (await db.query("select stock from productos where id=$1", [id])).rows[0]
      .stock,
    2,
  );
  console.log(
    "PASS changed subtotal requires reconfirmation without reserving stock",
  );
  payload.subtotal_visto_centavos = 10000000;

  const {
    rows: [result],
  } = await db.query("select delta_crear_pedido_v2($1,$2,$3,$4) as pedido", [
    user,
    "buyer@example.test",
    key,
    payload,
  ]);
  const order = result.pedido;
  assert.equal(order.total, 100000);
  assert.equal(order.estado, "nuevo");
  console.log("PASS authoritative price and initial state");
  await db.query("select delta_crear_pedido_v2($1,$2,$3,$4)", [
    user,
    "buyer@example.test",
    key,
    payload,
  ]);
  assert.equal(
    (await db.query("select stock from productos where id=$1", [id])).rows[0]
      .stock,
    1,
  );
  console.log("PASS idempotency reserves once");
  await assert.rejects(() =>
    db.query("select delta_crear_pedido_v2($1,$2,$3,$4)", [
      user,
      "buyer@example.test",
      key,
      { ...payload, direccion: "Otro sitio" },
    ]),
  );
  console.log("PASS idempotency rejects changed payload");
  await assert.rejects(() =>
    db.query("select delta_crear_pedido_v2($1,$2,gen_random_uuid(),$3)", [
      user,
      "buyer@example.test",
      { ...payload, items: [{ producto_id: id, cantidad: 3 }] },
    ]),
  );
  assert.equal(
    (await db.query("select count(*)::int as n from pedidos")).rows[0].n,
    1,
  );
  console.log("PASS insufficient stock rolls back");
  await assert.rejects(() =>
    db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
      order.id,
      "pagado",
      user,
    ]),
  );
  console.log("PASS nonadmin state denied");
  await db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
    order.id,
    "pagado",
    admin,
  ]);
  await db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
    order.id,
    "pagado",
    admin,
  ]);
  assert.equal(
    (await db.query("select sum(points)::int as n from delta_points_ledger"))
      .rows[0].n,
    100,
  );
  console.log("PASS paid points awarded once");
  await db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
    order.id,
    "entregado",
    admin,
  ]);
  const summary = (await db.query("select delta_resumen_v2() as s")).rows[0].s;
  assert.equal(summary.ventasMes, 100000);
  assert.equal(summary.ticketPromedio, 100000);
  console.log("PASS delivered sale remains in statistics");
  await assert.rejects(() =>
    db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
      order.id,
      "cancelado",
      admin,
    ]),
  );
  console.log("PASS cannot cancel delivered payment");
  const order2 = (
    await db.query(
      "select delta_crear_pedido_v2($1,$2,gen_random_uuid(),$3) as o",
      [user2, "buyer2@example.test", payload],
    )
  ).rows[0].o;
  await db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
    order2.id,
    "cancelado",
    admin,
  ]);
  await db.query("select delta_estado_pedido_v2($1,$2,$3,null)", [
    order2.id,
    "cancelado",
    admin,
  ]);
  assert.equal(
    (await db.query("select stock from productos where id=$1", [id])).rows[0]
      .stock,
    1,
  );
  console.log("PASS cancellation restocks once");
  await assert.rejects(() =>
    db.query("select delta_guardar_producto_v2($1,$2,$3,$4,$5)", [
      id,
      { ...product, stock: 10 },
      admin,
      "Recuento",
      2,
    ]),
  );
  console.log("PASS stale stock edit denied");
  await db.exec(`SET ROLE anon;`);
  await assert.rejects(() => db.query("select * from pedidos"));
  await assert.rejects(() => db.query("select delta_resumen_v2()"));
  await assert.rejects(() =>
    db.query("select delta_crear_pedido_v2($1,$2,$3,$4)", [
      user,
      "x",
      key,
      payload,
    ]),
  );
  console.log("PASS anon cannot read orders or invoke privileged RPCs");
  await db.exec("RESET ROLE;");
  await db.exec(
    `SET ROLE authenticated;SET "request.jwt.claim.sub"='${user}';`,
  );
  await assert.rejects(() =>
    db.query("update profiles set role='ADMIN' where id=$1", [user]),
  );
  await assert.rejects(() => db.query("select * from pedidos"));
  await assert.rejects(() =>
    db.query("insert into delta_favorites(user_id,producto_id) values($1,$2)", [
      user2,
      id,
    ]),
  );
  await db.query(
    "insert into delta_favorites(user_id,producto_id) values($1,$2)",
    [user, id],
  );
  console.log("PASS RLS ownership and no privilege escalation");
  await db.exec("RESET ROLE;");
  await db.close();
});

test("La migración conserva pedidos y productos existentes compatibles", async () => {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT null::uuid$$;
 CREATE TABLE public.productos(id uuid PRIMARY KEY,name text,price numeric,stock integer);INSERT INTO productos VALUES('11111111-1111-4111-8111-111111111111','Histórico',50000,7);
 CREATE TABLE public.pedidos(id uuid PRIMARY KEY,codigo text,estado text,total numeric);INSERT INTO pedidos VALUES('22222222-2222-4222-8222-222222222222','ANTIGUO','pagado',50000);`);
  await db.exec(
    fs.readFileSync(
      new URL("../migrations/002_delta_seguro.sql", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    (await db.query("select stock from productos")).rows[0].stock,
    7,
  );
  const old = (await db.query("select * from pedidos")).rows[0];
  assert.equal(old.codigo, "ANTIGUO");
  assert.equal(Number(old.total), 50000);
  assert.equal(old.user_id, null);
  assert.equal(old.paid_at, null);
  await db.close();
});
test("Un esquema incompatible aborta sin cambiar sus datos", async () => {
  const db = new PGlite();
  await db.exec(
    `CREATE TABLE productos(id bigint PRIMARY KEY,name text);INSERT INTO productos VALUES(1,'Conservar');`,
  );
  await assert.rejects(() =>
    db.exec(
      fs.readFileSync(
        new URL("../migrations/002_delta_seguro.sql", import.meta.url),
        "utf8",
      ),
    ),
  );
  await db.exec("ROLLBACK");
  assert.equal(
    (await db.query("select name from productos")).rows[0].name,
    "Conservar",
  );
  await db.close();
});

test("Importación opcional conserva IDs, stock y tablas originales y es repetible", async () => {
  const db = new PGlite();
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT null::uuid$$;`,
  );
  await db.exec(
    fs.readFileSync(
      new URL("../migrations/002_delta_seguro.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    `CREATE TABLE perfumes(id uuid PRIMARY KEY,name text,price numeric,is_active boolean);CREATE TABLE inventory(perfume_id uuid,stock_quantity integer,selling_price numeric);INSERT INTO perfumes VALUES('55555555-5555-4555-8555-555555555555','Anterior',99000,true);INSERT INTO inventory VALUES('55555555-5555-4555-8555-555555555555',3,99000);`,
  );
  const sql = fs.readFileSync(
    new URL(
      "../migrations/003_importar_perfumes_opcional.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(sql);
  await db.exec(sql);
  assert.equal(
    (await db.query("select stock from productos")).rows[0].stock,
    3,
  );
  assert.equal(
    (await db.query("select count(*)::int as n from perfumes")).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query("select count(*)::int as n from delta_stock_movements"))
      .rows[0].n,
    1,
  );
  await db.close();
});
