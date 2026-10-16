import { createClient, getUser } from "@/lib/supabase/server";
import AccountForms from "./AccountForms";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function Account() {
  const db = createClient();
  const user = await getUser();
  if (!user) return null; // middleware redirects to /login
  const { data: profile } = await db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  return (
    <div className="max-w-md mx-auto space-y-5">
      <h1 className="font-display text-3xl text-pine">Account</h1>
      <p className="text-sm text-ink/70">Signed in as {user.email}</p>
      <AccountForms displayName={profile?.display_name ?? ""} hasProfile={!!profile} />
      <form action={signOut}>
        <button className="w-full min-h-[44px] rounded border border-pine/30 bg-white font-semibold text-pine hover:bg-sand">
          Sign out
        </button>
      </form>
    </div>
  );
}
