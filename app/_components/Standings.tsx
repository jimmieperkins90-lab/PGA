import { createClient } from "@/lib/supabase/server";
import { fmtLock, getField } from "@/lib/data";
import { cutRuleText, fmtPar, fmtRound, parClass } from "@/lib/format";
import { isLocked, type Pick, type Round, type StandRow, type Tournament } from "@/lib/types";
import LiveRefresher from "../LiveRefresher";
import InfoPanel from "./InfoPanel";

// Phones show # / player / total; the round-by-round numbers appear in the expanded row. Wider screens show all columns.
const GRID = "grid grid-cols-[2.75rem_minmax(0,1fr)_3.5rem] sm:grid-cols-[3rem_minmax(0,1fr)_repeat(4,2.5rem)_3.25rem]";

export default async function Standings({ t, rounds, live }: { t: Tournament; rounds: Round[]; live: boolean }) {
  const db = createClient();
  const [{ data: board }, { data: picks }, { data: isAdmin }, field] = await Promise.all([
    db.rpc("standings", { p_tournament: t.id }),
    db.from("picks").select("*").eq("tournament_id", t.id),
    db.rpc("is_admin"),
    getField(db, t.id),
  ]);
  const rows = (board ?? []) as StandRow[];
  const allPicks = (picks ?? []) as Pick[];
  const gById = new Map(field.golfers.map((g) => [g.id, g]));
  const sc = (gid: string, rn: number) => field.scores.find((s) => s.golfer_id === gid && s.round_no === rn);

  // Admins see who has not paid yet (row-level security hides this from everyone else).
  const unpaid = new Set<string>();
  if (isAdmin) {
    const { data: pays } = await db.from("payments").select("user_id, paid").eq("tournament_id", t.id);
    (pays ?? []).forEach((p: any) => !p.paid && unpaid.add(p.user_id));
  }

  const done = !!t.completed_at;
  const placeOf = (r: StandRow) => (done ? r.place_final : r.place_live);
  const label = (r: StandRow) => {
    if (r.is_cut) return "CUT";
    const tied = rows.filter((x) => !x.is_cut && placeOf(x) === placeOf(r)).length > 1;
    return `${tied ? "T" : ""}${placeOf(r)}`;
  };

  const nextRound = live ? rounds.find((r) => !isLocked(r)) : undefined;
  return (
    <div>
      {live && !done && <LiveRefresher />}
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h1 className="font-display text-3xl text-pine">{t.name}</h1>
          {done && <p className="inline-block mt-1 text-xs font-semibold uppercase bg-gold/20 text-pine rounded px-2 py-0.5">Final results</p>}
          <div className="mt-2">
            <InfoPanel cutText={cutRuleText(t.cut_mode, t.cut_value, t.cut_after_round)} live={live && !done} />
          </div>
        </div>
        {nextRound && !done && (
          <p className="text-sm bg-sand rounded px-3 py-1">
            Round {nextRound.round_no} picks lock {fmtLock(nextRound.lock_at)}
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-ink/70">No one has joined yet.</p>
      ) : (
        <div className="bg-white border border-pine/15 rounded-lg overflow-hidden">
          <div className={`${GRID} px-3 py-2 bg-pine text-sand text-xs font-semibold uppercase`}>
            <span>#</span><span>Player</span>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="hidden sm:block text-right">R{n}</span>
            ))}
            <span className="text-right">Tot</span>
          </div>
          {rows.map((r) => {
            const mine = allPicks.filter((p) => p.user_id === r.user_id && (!r.is_cut || p.round_no <= t.cut_after_round));
            return (
              <details key={r.user_id} className={`border-t border-pine/10 ${r.is_cut ? "opacity-70" : ""}`}>
                <summary className={`${GRID} px-3 min-h-[52px] py-2 cursor-pointer items-center hover:bg-sand/50 list-none`}>
                  <span className={`font-mono text-sm ${r.is_cut ? "text-azalea font-semibold" : ""}`}>{label(r)}</span>
                  <span className="font-semibold truncate">
                    {r.display_name}
                    {unpaid.has(r.user_id) && (
                      <span className="ml-2 text-[10px] font-semibold uppercase bg-azalea/15 text-azalea rounded px-1.5 py-0.5">Unpaid</span>
                    )}
                  </span>
                  {[r.r1, r.r2, r.r3, r.r4].map((v, i) => (
                    <span key={i} className={`hidden sm:block text-right font-mono text-sm ${parClass(v)}`}>{fmtPar(v)}</span>
                  ))}
                  <span className={`text-right font-mono font-semibold ${parClass(r.total)}`}>{fmtPar(r.total)}</span>
                </summary>
                <div className="px-3 pb-3 bg-paper text-sm">
                  <div className="sm:hidden grid grid-cols-4 gap-1 pt-3 text-center">
                    {[r.r1, r.r2, r.r3, r.r4].map((v, i) => (
                      <div key={i} className="rounded bg-white border border-pine/10 py-1">
                        <div className="text-[10px] font-semibold uppercase text-ink/40">R{i + 1}</div>
                        <div className={`font-mono text-sm ${parClass(v)}`}>{fmtPar(v)}</div>
                      </div>
                    ))}
                  </div>
                  {mine.length === 0 ? (
                    <p className="text-ink/60 pt-2">Picks appear here once each round locks.</p>
                  ) : (
                    [1, 2, 3, 4].map((rn) => {
                      const rp = mine.filter((p) => p.round_no === rn);
                      const rd = rounds.find((x) => x.round_no === rn);
                      if (!rp.length || !isLocked(rd)) return null;
                      return (
                        <div key={rn} className="pt-2">
                          <div className="text-xs font-semibold uppercase text-fairway">Round {rn}</div>
                          <ul className="grid sm:grid-cols-2 gap-x-6">
                            {rp.map((p) => {
                              const g = gById.get(p.golfer_id);
                              const s = sc(p.golfer_id, rn);
                              return (
                                <li key={p.id} className="flex justify-between gap-2 py-1">
                                  <span>{g?.name ?? "?"}</span>
                                  <span className={`font-mono ${parClass(s?.to_par)}`}>{fmtRound(s)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })
                  )}
                  {mine.length > 0 && (
                    <p className="text-xs text-ink/60 pt-3">
                      Tiebreak stats: {r.under_holes} birdies or better · {r.over_holes} bogeys or worse · best round {fmtPar(r.best_round)} · worst round {fmtPar(r.worst_round)}
                    </p>
                  )}
                  {r.is_cut && <p className="text-xs text-azalea pt-1">Cut after Round {t.cut_after_round}. Score is final.</p>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
