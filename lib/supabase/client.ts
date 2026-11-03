import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://kzmxafjlhruldzzntugu.supabase.co';

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_byS9e9dJF68wCAeIxTRYmQ_iQFIQeyh';

  return createBrowserClient(supabaseUrl, supabaseKey);
}