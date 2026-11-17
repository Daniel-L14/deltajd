import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams,
    db = await createClient();
  const token = p.get("token_hash"),
    type = p.get("type");
  const code = p.get("code");
  const allowed = [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ];
  let valid = false;
  if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    valid = !error;
  } else if (token && type && allowed.includes(type)) {
    const { error } = await db.auth.verifyOtp({
      token_hash: token,
      type: type as EmailOtpType,
    });
    valid = !error;
  }
  return NextResponse.redirect(
    new URL(
      valid ? safeNext(p.get("next")) : "/auth/auth-code-error",
      request.url,
    ),
  );
}
