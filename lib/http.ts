import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "./validation";
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function failure(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error(
    "DELTA: operación no completada",
    e instanceof Error ? e.message : "Error interno",
  );
  return json(
    {
      error:
        "No se pudo completar la operación. Intenta de nuevo o contacta a la tienda.",
    },
    500,
  );
}
export async function body(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const target = new URL(request.url);
  // Next.js puede usar el host interno en request.url detrás de un proxy.
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    target.host;
  if (
    fetchSite === "cross-site" ||
    fetchSite === "same-site" ||
    (origin && origin !== `${target.protocol}//${host}`)
  )
    throw new ApiError(403, "Origen no permitido.");
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Se requiere JSON.");
  // Límite aplicado al stream, incluso sin Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Faltan datos.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32768) {
      await reader.cancel();
      throw new ApiError(413, "Solicitud demasiado grande.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(all)) as unknown;
  } catch {
    throw new ApiError(400, "JSON inválido.");
  }
}
