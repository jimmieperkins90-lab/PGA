import { createClient } from "@/lib/supabase/server";
import { isoToEtLocal } from "@/lib/time";
import { setActive } from "./actions";
import { CreateForm, LockForm, StatusForm, SyncForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const db = createClient();
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) return <p className="text-ink/70">This page is for pool admins.</p>;

  const { data: tournaments } = await db.from("tournaments").select("*").order("created_at", { ascending: false });
  const active = (tournaments ?? []).find((t: any) => t.is_active);
  const { data: rounds } = active
    ? await db.from("rounds").select("*").eq("tournament_id", active.id).order("round_no")
    : { data: [] as any[] };
  const { data: golfers } = active
    ? await db.from("golfers").select("id,name,status").eq("tournament_id", active.id).order("name")
    : { data: [] as any[] };

  const card = "bg-white border border-pine/15 rounded-lg p-4 space-y-3";
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-pine">Admin</h1>

      <section className={card}>
        <h2 className="font-semibold">Add a tournament</h2>
        <p className="text-sm text-ink/70">Paste the ESPN event id (the number in the tournament&apos;s ESPN leaderboard URL). The field is imported automatically.</p>
        <CreateForm />
      </section>

      <section className={card}>
        <h2 className="font-semibold">Tournaments</h2>
        <ul className="divide-y divide-pine/10">
          {(tournaments ?? []).map((t: any) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <span>{t.name} {t.is_active && <span className="ml-2 text-xs bg-azalea text-white rounded px-2 py-0.5">ACTIVE</span>}</span>
              {!t.is_active && (
                <form action={setActive.bind(null, t.id)}>
                  <button className="text-sm text-fairway font-semibold hover:underline">Make active</button>
                </form>
              )}
            </li>
          ))}
          {(tournaments ?? []).length === 0 && <li className="py-2 text-sm text-ink/60">None yet.</li>}
        </ul>
      </section>

      {active && (
        <>
          <section className={card}>
            <h2 className="font-semibold">Pick lock times: {active.name}</h2>
            <p className="text-sm text-ink/70">Set each round to its first tee time. Picks for that round lock then.</p>
            <LockForm tournamentId={active.id} values={[1, 2, 3, 4].map((n) => isoToEtLocal((rounds ?? []).find((r: any) => r.round_no === n)?.lock_at ?? null))} />
          </section>
          <section className={card}>
            <h2 className="font-semibold">Scores</h2>
            <p className="text-sm text-ink/70">Scores sync automatically about once a minute while play is on.</p>
            <SyncForm />
          </section>
          <section className={card}>
            <h2 className="font-semibold">Golfer status (cut / WD / DQ)</h2>
            <p className="text-sm text-ink/70">Use this after Round 2 if the cut isn&apos;t picked up automatically.</p>
            <StatusForm golfers={(golfers ?? []) as any} />
          </section>
        </>
      )}
    </div>
  );
}
