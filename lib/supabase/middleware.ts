import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicConfig } from "./config";
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = publicConfig();
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const {
    data: { user },
  } = await db.auth.getUser();
  let destination: string | null = null;
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user)
      destination =
        "/login?next=" + encodeURIComponent(request.nextUrl.pathname);
    else {
      const { data, error } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error || data?.role !== "ADMIN") destination = "/";
    }
  }
  if (destination) {
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}
