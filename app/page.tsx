import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { fmtLock, getActive } from "@/lib/data";
import { isLocked } from "@/lib/types";
import Standings from "./_components/Standings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = createClient();
  const active = await getActive(db);
  if (!active)
    return (
      <p className="text-ink/70">
        No tournament is running right now. See <Link href="/tournaments" className="text-fairway font-semibold underline">past tournaments</Link>.
      </p>
    );
  const { t, rounds } = active;

  // Nudge the signed-in player if the next open round isn't fully picked.
  let reminder: string | null = null;
  const user = await getUser();
  const next = rounds.find((r) => !isLocked(r));
  if (user && next && !t.completed_at) {
    const [{ data: entry }, { count }] = await Promise.all([
      db.from("entries").select("is_cut").eq("tournament_id", t.id).eq("user_id", user.id).maybeSingle(),
      db
        .from("picks")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", t.id)
        .eq("user_id", user.id)
        .eq("round_no", next.round_no),
    ]);
    const limit = t.picks_per_round[next.round_no - 1] ?? 0;
    const out = !!entry?.is_cut && next.round_no > t.cut_after_round;
    const open = limit - (count ?? 0);
    if (!out) {
      if (!entry) reminder = `You haven't joined yet. Round ${next.round_no} picks lock ${fmtLock(next.lock_at)}.`;
      else if (open > 0)
        reminder = `Round ${next.round_no} lineup incomplete: ${open} open ${open === 1 ? "spot" : "spots"}. Locks ${fmtLock(next.lock_at)}.`;
    }
  }

  return (
    <div>
      {reminder && (
        <Link
          href="/roster"
          className="mb-4 flex items-center justify-between gap-3 rounded border border-gold/60 bg-gold/15 px-3 py-3 text-sm font-semibold text-ink"
        >
          <span>{reminder}</span>
          <span className="shrink-0 text-fairway underline">My Roster</span>
        </Link>
      )}
      <Standings t={t} rounds={rounds} live />
    </div>
  );
}
