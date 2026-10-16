import { createClient } from "@/lib/supabase/server";
import { getActive, getField } from "@/lib/data";
import type { Pick } from "@/lib/types";
import RosterClient from "./RosterClient";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null; // middleware redirects to /login
  const active = await getActive(db);
  if (!active) return <p className="text-ink/70">No tournament is active yet. Check back soon.</p>;
  const { t, rounds } = active;

  const { data: profile } = await db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!profile) return <ProfileForm tournamentId={t.id} tournamentName={t.name} paymentNote={t.payment_note} />;

  const [{ data: picks }, { data: entry }, { data: pay }, field] = await Promise.all([
    db.from("picks").select("*").eq("tournament_id", t.id).eq("user_id", user.id),
    db.from("entries").select("is_cut").eq("tournament_id", t.id).eq("user_id", user.id).maybeSingle(),
    db.from("payments").select("paid").eq("tournament_id", t.id).eq("user_id", user.id).maybeSingle(),
    getField(db, t.id),
  ]);

  return (
    <RosterClient
      tournament={t}
      rounds={rounds}
      golfers={field.golfers}
      scores={field.scores}
      picks={(picks ?? []) as Pick[]}
      displayName={profile.display_name}
      isCut={!!entry?.is_cut}
      unpaid={pay ? !pay.paid : false}
      paymentNote={t.payment_note}
    />
  );
}
