import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzmxafjlhruldzzntugu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bXhhZmpsaHJ1bGR6em50dWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1Mjk4OTUsImV4cCI6MjA1NDEwNTzgOTV9.32a-x9F2a6NqF1k1x2X0Q_x_x_x_x_x_x_x_x_x';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignorado en contextos donde no se pueden modificar cookies (Server Components)
        }
      },
    },
  });
}