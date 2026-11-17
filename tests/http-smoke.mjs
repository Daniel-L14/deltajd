// Ejecutar después de npm run build, con las variables .env.local configuradas.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const port = 3197;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: ["ignore", "pipe", "pipe"], env: process.env },
);
let output = "";
const start = Date.now();
child.stdout.on("data", (d) => {
  output += d.toString();
});
child.stderr.on("data", (d) => {
  output += d.toString();
});
try {
  while (!output.includes("Ready")) {
    if (child.exitCode !== null || Date.now() - start > 20000)
      throw new Error("No pudo iniciar el servidor: " + output);
    await new Promise((r) => setTimeout(r, 100));
  }
  const cases = [
    ["/admin", 307, "/login"],
    ["/catalogo", 307, "/tienda"],
    ["/tienda/checkout", 307, "/tienda/carrito"],
    ["/api/pedidos", 401, null],
    ["/api/cuenta", 401, null],
    ["/api/stats/resumen", 401, null],
  ];
  for (const [route, status, destination] of cases) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      redirect: "manual",
    });
    assert.equal(response.status, status, route);
    if (destination)
      assert(
        new URL(response.headers.get("location"), `http://127.0.0.1:${port}`)
          .pathname === destination,
        route,
      );
    console.log(`PASS HTTP ${route}: ${status}`);
  }
  const edit = await fetch(`http://127.0.0.1:${port}/api/pedidos/00000000-0000-0000-0000-000000000001/cantidades`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(edit.status, 401, "La edición requiere una sesión administrativa");
  console.log("PASS HTTP editar pedido sin sesión: 401");
} finally {
  child.kill("SIGTERM");
}
