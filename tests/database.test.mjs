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
  await db.exec(fs.readFileSync(new URL("../migrations/004_conservar_foto_producto.sql", import.meta.url), "utf8"));
  const photo = "https://example.test/perfume.webp";
  await db.query("update productos set image_url=$2 where id=$1", [id, photo]);
  const details = { ...product };
  delete details.image_url;
  const updated = await db.query(
    "select delta_guardar_producto_v2($1,$2,$3,$4,$5) as product",
    [id, details, admin, "Editar detalles", 2],
  );
  assert.equal(updated.rows[0].product.image_url, photo);
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
  const noticeMigration = fs.readFileSync(
    new URL("../migrations/005_aviso_pedido_whatsapp.sql", import.meta.url),
    "utf8",
  );
  await db.exec(noticeMigration);
  await db.exec(noticeMigration);
  await db.exec("set role service_role");
  await db.query("insert into delta_order_whatsapp(pedido_id) values ($1)", [order.id]);
  const { rows: [notice] } = await db.query(
    "select status, message_id from delta_order_whatsapp where pedido_id=$1", [order.id],
  );
  assert.equal(notice.status, "pending");
  assert.equal(notice.message_id, null);
  await assert.rejects(
    () => db.query("insert into delta_order_whatsapp(pedido_id) values ($1)", [order.id]),
    /duplicate key/,
  );
  await db.exec("reset role");
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(() => db.query("select status from delta_order_whatsapp"), /permission denied/);
    await db.exec("reset role");
  }
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

test("Editar un pedido aplica total, reserva e historial como una sola operación", async () => {
  const db = new PGlite();
  const admin = "11111111-1111-4111-8111-111111111111";
  const buyer = "22222222-2222-4222-8222-222222222222";
  const first = "33333333-3333-4333-8333-333333333333";
  const second = "44444444-4444-4444-8444-444444444444";
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
    `);
    await db.exec(fs.readFileSync(new URL("../migrations/002_delta_seguro.sql", import.meta.url), "utf8"));
    // El proyecto alojado calcula el subtotal en una columna generada.
    await db.exec(`
      ALTER TABLE public.pedido_items DROP COLUMN subtotal;
      ALTER TABLE public.pedido_items ADD COLUMN subtotal numeric
        GENERATED ALWAYS AS (precio * cantidad) STORED;
    `);
    const migration = fs.readFileSync(new URL("../migrations/006_editar_pedido.sql", import.meta.url), "utf8");
    await db.exec(migration);
    await db.exec(migration);
    await db.query("insert into auth.users(id,email) values ($1,'admin@example.test'),($2,'buyer@example.test')", [admin, buyer]);
    await db.query("insert into profiles(id,role) values ($1,'ADMIN'),($2,'CLIENTE')", [admin, buyer]);
    await db.query(
      "insert into productos(id,name,price,stock,is_active) values ($1,'Cedro',100000,8,true),($2,'Rosa',20000,1,true)",
      [first, second],
    );
    const items = (a, b) => [
      { producto_id: first, cantidad: a },
      ...(b === undefined ? [] : [{ producto_id: second, cantidad: b }]),
    ];
    const create = async (lines) => (await db.query(
      "select delta_crear_pedido_v2($1,'buyer@example.test',gen_random_uuid(),$2) as pedido",
      [buyer, { cliente_nombre: "Prueba", cliente_telefono: "3001234567", direccion: "Calle 1 Bogotá", items: lines }],
    )).rows[0].pedido;
    await db.exec("set role service_role");
    const order = await create(items(5, 1));
    const update = (revision, lines, actor = admin) => db.query(
      "select delta_editar_pedido_v1($1,$2,$3,$4::jsonb)",
      [order.id, actor, revision, JSON.stringify(lines)],
    );
    const current = async () => (await db.query(
      "select codigo,total,items,items_revision from pedidos where id=$1", [order.id],
    )).rows[0];
    const stock = async () => (await db.query(
      "select stock from productos where id in ($1,$2) order by id", [first, second],
    )).rows.map((row) => row.stock);
    const history = async () => (await db.query(
      "select nota,actor_id from pedido_historial where pedido_id=$1 order by creado_at", [order.id],
    )).rows;

    await assert.rejects(() => update(0, items(3, 0), buyer), /No autorizado/);
    await assert.rejects(() => update(0, items(3, 2)), /No hay disponibilidad suficiente para Rosa/);
    assert.deepEqual(await stock(), [3, 0]);
    assert.equal(Number((await current()).total), 520000);
    assert.equal((await history()).length, 1);

    // El catálogo puede cambiar de precio después de la reserva original.
    await db.query("update productos set price=120000 where id=$1", [first]);
    await update(0, items(3, 0));
    const decreased = await current();
    assert.equal(decreased.codigo, order.codigo);
    assert.equal(Number(decreased.total), 300000);
    assert.equal(decreased.items_revision, 1);
    assert.deepEqual(decreased.items.map(({ cantidad, precio }) => [cantidad, precio]), [[3, 100000]]);
    assert.deepEqual(await stock(), [5, 1]);
    assert.equal((await history()).at(-1).actor_id, admin);
    assert.match((await history()).at(-1).nota, /Cedro: 5 → 3/);

    await assert.rejects(() => update(0, items(7)), /El pedido cambió/);
    await assert.rejects(() => update(1, items(0)), /al menos un perfume/);
    await update(1, items(7));
    await update(2, items(7));
    assert.deepEqual(await stock(), [1, 1]);
    assert.equal(Number((await current()).total), 700000);
    assert.equal((await current()).items_revision, 2);
    assert.equal((await history()).length, 3);
    const { rows: [line] } = await db.query(
      "select cantidad,subtotal from pedido_items where pedido_id=$1", [order.id],
    );
    assert.deepEqual([line.cantidad, Number(line.subtotal)], [7, 700000]);

    await assert.rejects(() => db.query(
      "select delta_pagar_pedido_verificado_v1($1,$2,1,null)", [order.id, admin],
    ), /verifica el nuevo total/);
    await db.query("select delta_pagar_pedido_verificado_v1($1,$2,2,null)", [order.id, admin]);
    await assert.rejects(() => update(2, items(3)), /pendientes de pago/);
    const { rows: [ledger] } = await db.query(
      "select points from delta_points_ledger where pedido_id=$1", [order.id],
    );
    assert.equal(ledger.points, 700);

    const canceled = await create(items(1));
    // Verifica la compatibilidad con una base que usa un subtotal ordinario.
    await db.exec("reset role");
    await db.exec(`
      ALTER TABLE public.pedido_items ALTER COLUMN subtotal DROP EXPRESSION;
      SET ROLE service_role;
    `);
    await db.query("update productos set stock=stock+1 where id=$1", [first]);
    await db.query("select delta_editar_pedido_v1($1,$2,0,$3::jsonb)", [
      canceled.id, admin, JSON.stringify(items(2)),
    ]);
    const { rows: [ordinary] } = await db.query(
      "select cantidad,subtotal from pedido_items where pedido_id=$1", [canceled.id],
    );
    assert.deepEqual([ordinary.cantidad, Number(ordinary.subtotal)], [2, 240000]);
    await db.query("select delta_estado_pedido_v2($1,'cancelado',$2,null)", [canceled.id, admin]);
    assert.deepEqual(await stock(), [2, 1]);

    await db.exec("reset role");
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(() => update(2, items(1)), /permission denied/);
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
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
