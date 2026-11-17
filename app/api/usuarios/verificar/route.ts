import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { json, failure } from "@/lib/http";
export async function GET() {
  await connection();
  try {
    await requireAdmin();
    return json({ isAdmin: true });
  } catch (e) {
    return failure(e);
  }
}
