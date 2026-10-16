import { createClient } from "@/lib/supabase/server";
import AccountForms from "./AccountForms";

export const dynamic = "force-dynamic";

export default async function Account() {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null; // middleware redirects to /login
  const { data: profile } = await db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="font-display text-3xl text-pine">Account</h1>
      <p className="text-sm text-ink/70">Signed in as {user.email}</p>
      <AccountForms displayName={profile?.display_name ?? ""} hasProfile={!!profile} />
    </div>
  );
}
