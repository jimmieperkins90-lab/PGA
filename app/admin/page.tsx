import { createClient } from "@/lib/supabase/server";
import { isoToEtLocal } from "@/lib/time";
import { setActive, setPaid } from "./actions";
import { CreateForm, CutForm, LockForm, PaymentNoteForm, StatusForm, SyncForm } from "./forms";

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

  const { data: pays } = active
    ? await db.from("payments").select("user_id, paid").eq("tournament_id", active.id)
    : { data: [] as any[] };
  const { data: names } = (pays ?? []).length
    ? await db.from("profiles").select("user_id, display_name").in("user_id", (pays ?? []).map((p: any) => p.user_id))
    : { data: [] as any[] };
  const nameOf = new Map((names ?? []).map((n: any) => [n.user_id, n.display_name]));
  const payRows = [...(pays ?? [])]
    .map((p: any) => ({ ...p, name: (nameOf.get(p.user_id) as string) ?? "Unknown" }))
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.name.localeCompare(b.name));

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
            <h2 className="font-semibold">Payments</h2>
            <p className="text-sm text-ink/70">
              Players see your message when they join and a reminder on their roster until you mark them paid. Only you can see who is unpaid.
            </p>
            <PaymentNoteForm tournamentId={active.id} note={active.payment_note ?? ""} />
            <ul className="divide-y divide-pine/10">
              {payRows.map((p: any) => (
                <li key={p.user_id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {p.name}
                    {!p.paid && <span className="ml-2 text-[10px] font-semibold uppercase bg-azalea/15 text-azalea rounded px-1.5 py-0.5">Unpaid</span>}
                  </span>
                  <form action={setPaid.bind(null, active.id, p.user_id, !p.paid)}>
                    <button className="text-fairway font-semibold hover:underline">{p.paid ? "Mark unpaid" : "Mark paid"}</button>
                  </form>
                </li>
              ))}
              {payRows.length === 0 && <li className="py-2 text-sm text-ink/60">No players have joined yet.</li>}
            </ul>
          </section>
          <section className={card}>
            <h2 className="font-semibold">Pool cut</h2>
            <p className="text-sm text-ink/70">
              Happens automatically once Round {active.cut_after_round} is final. The top entries advance (a percent of the pool, or a set number), and anyone tied at the line advances too. The rest are cut.
              {active.cut_applied ? " The cut has already been applied; saving a new rule re-applies it." : " Not applied yet."}
            </p>
            <CutForm tournamentId={active.id} mode={active.cut_mode} value={active.cut_value} />
          </section>
          <section className={card}>
            <h2 className="font-semibold">Scores</h2>
            <p className="text-sm text-ink/70">Scores sync automatically about once a minute while play is on.</p>
            <SyncForm />
          </section>
          <section className={card}>
            <h2 className="font-semibold">Golfer availability (WD / DQ / not playing)</h2>
            <p className="text-sm text-ink/70">Only needed if ESPN misses a withdrawal. Golfers marked anything but active can&apos;t be picked after Round {active.cut_after_round}.</p>
            <StatusForm golfers={(golfers ?? []) as any} />
          </section>
        </>
      )}
    </div>
  );
}
