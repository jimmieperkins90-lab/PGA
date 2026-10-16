import { createClient } from "@/lib/supabase/server";
import { fmtLock, getActive, getField } from "@/lib/data";
import { fmtPar, parClass } from "@/lib/format";
import { isLocked, type LeaderRow, type Pick } from "@/lib/types";
import LiveRefresher from "./LiveRefresher";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const db = createClient();
  const active = await getActive(db);
  if (!active)
    return <p className="text-ink/70">No tournament is active yet. Check back soon.</p>;
  const { t, rounds } = active;

  const [{ data: board }, { data: picks }, field] = await Promise.all([
    db.rpc("get_leaderboard", { p_tournament: t.id }),
    db.from("picks").select("*").eq("tournament_id", t.id),
    getField(db, t.id),
  ]);
  const rows = (board ?? []) as LeaderRow[];
  const allPicks = (picks ?? []) as Pick[];
  const gById = new Map(field.golfers.map((g) => [g.id, g]));
  const sc = (gid: string, rn: number) => field.scores.find((s) => s.golfer_id === gid && s.round_no === rn);

  // competition ranking with ties
  const ranked = rows.map((r, i) => {
    const first = rows.findIndex((x) => x.total === r.total);
    const tied = rows.filter((x) => x.total === r.total).length > 1;
    return { ...r, rank: `${tied ? "T" : ""}${first + 1}` };
  });

  const nextRound = rounds.find((r) => !isLocked(r));
  return (
    <div>
      <LiveRefresher />
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="font-display text-3xl text-pine">{t.name}</h1>
          <p className="text-sm text-ink/70">
            Lowest combined score to par wins. Cut after Round {t.cut_after_round}.
          </p>
        </div>
        {nextRound && (
          <p className="text-sm bg-sand rounded px-3 py-1">
            Round {nextRound.round_no} picks lock {fmtLock(nextRound.lock_at)}
          </p>
        )}
      </div>

      {ranked.length === 0 ? (
        <p className="text-ink/70">No one has joined yet. Head to My Roster to make your picks.</p>
      ) : (
        <div className="bg-white border border-pine/15 rounded-lg overflow-hidden">
          <div className="grid grid-cols-[2.5rem_1fr_repeat(4,2.75rem)_3.5rem] px-3 py-2 bg-pine text-sand text-xs font-semibold uppercase">
            <span>#</span><span>Player</span><span className="text-right">R1</span><span className="text-right">R2</span>
            <span className="text-right">R3</span><span className="text-right">R4</span><span className="text-right">Tot</span>
          </div>
          {ranked.map((r) => {
            const mine = allPicks.filter((p) => p.user_id === r.user_id);
            return (
              <details key={r.user_id} className="border-t border-pine/10 group">
                <summary className="grid grid-cols-[2.5rem_1fr_repeat(4,2.75rem)_3.5rem] px-3 py-2 cursor-pointer items-center hover:bg-sand/50 list-none">
                  <span className="font-mono text-sm">{r.rank}</span>
                  <span className="font-semibold truncate">{r.display_name}</span>
                  {[r.r1, r.r2, r.r3, r.r4].map((v, i) => (
                    <span key={i} className={`text-right font-mono text-sm ${parClass(v)}`}>{fmtPar(v)}</span>
                  ))}
                  <span className={`text-right font-mono font-semibold ${parClass(r.total)}`}>{fmtPar(r.total)}</span>
                </summary>
                <div className="px-3 pb-3 bg-paper text-sm">
                  {mine.length === 0 ? (
                    <p className="text-ink/60 pt-2">Picks appear here once each round locks.</p>
                  ) : (
                    [1, 2, 3, 4].map((rn) => {
                      const rp = mine.filter((p) => p.round_no === rn);
                      if (!rp.length) return null;
                      return (
                        <div key={rn} className="pt-2">
                          <div className="text-xs font-semibold uppercase text-fairway">Round {rn}</div>
                          <ul className="grid sm:grid-cols-2 gap-x-6">
                            {rp.map((p) => {
                              const g = gById.get(p.golfer_id);
                              const s = sc(p.golfer_id, rn);
                              return (
                                <li key={p.id} className="flex justify-between py-0.5">
                                  <span>
                                    {g?.name ?? "?"}
                                    {g && g.status !== "active" && (
                                      <span className="ml-1 text-xs uppercase text-azalea">{g.status}</span>
                                    )}
                                  </span>
                                  <span className={`font-mono ${parClass(s?.to_par)}`}>
                                    {fmtPar(s?.to_par)}
                                    {s && s.thru !== null && s.thru < 18 && <span className="text-ink/50"> ({s.thru})</span>}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}
      <p className="text-xs text-ink/50 mt-3">Scores refresh about once a minute while play is on. Numbers in parentheses are holes completed.</p>
    </div>
  );
}
