import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export function createClient() {
  return createBrowserClient<any, "pga">(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "pga" },
  });
}
