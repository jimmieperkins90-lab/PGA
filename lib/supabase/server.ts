import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export const createClient = cache(function createClient() {
  const cookieStore = cookies();
  return createServerClient<any, "pga">(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "pga" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: middleware refreshes the session instead.
        }
      },
    },
  });
});

// Reads the signed-in user from the session cookie (no network call; middleware keeps it fresh and the
// database still verifies the token on every query). Cached for the request.
export const getUser = cache(async () => {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  return session?.user ?? null;
});
