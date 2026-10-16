"use client";
import { useMemo, useState, useTransition } from "react";
import { addPick, removePick } from "./actions";
import { fmtPar, fmtRound, parClass } from "@/lib/format";
import { isLocked, type Golfer, type GolferRound, type Pick, type Round, type Tournament } from "@/lib/types";

function lockText(iso: string | null) {
  if (!iso) return "Lock time not set yet";
  return (
    "Locks " +
    new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" }) +
    " ET"
  );
}

export default function RosterClient({
  tournament,
  rounds,
  golfers,
  scores,
  picks,
  displayName,
  isCut,
}: {
  tournament: Tournament;
  rounds: Round[];
  golfers: Golfer[];
  scores: GolferRound[];
  picks: Pick[];
  displayName: string;
  isCut: boolean;
}) {
  const firstOpen = rounds.find((r) => !isLocked(r))?.round_no ?? rounds[rounds.length - 1]?.round_no ?? 1;
  const [rn, setRn] = useState(firstOpen);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const round = rounds.find((r) => r.round_no === rn);
  const locked = isLocked(round);
  const limit = tournament.picks_per_round[rn - 1] ?? 0;
  const myRound = picks.filter((p) => p.round_no === rn);
  const full = myRound.length >= limit;
  const afterCut = rn > tournament.cut_after_round;
  const eliminated = isCut && afterCut;
  const score = (gid: string, r: number) => scores.find((x) => x.golfer_id === gid && x.round_no === r);
  const gById = useMemo(() => new Map(golfers.map((g) => [g.id, g])), [golfers]);
  const usedIn = useMemo(() => new Map(picks.map((p) => [p.golfer_id, p.round_no])), [picks]);

  const shown = golfers.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()));

  function run(fn: () => Promise<{ error?: string }>) {
    setMsg("");
    start(async () => {
      const r = await fn();
      if (r.error) setMsg(r.error);
    });
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-pine">{tournament.name}</h1>
      <p className="text-sm text-ink/70 mb-4">
        {displayName}: each golfer can be used once all week. Picks per round: {tournament.picks_per_round.join(" / ")}.
      </p>

      <div className="flex gap-2 mb-4" role="tablist">
        {rounds.map((r) => {
          const n = (picks.filter((p) => p.round_no === r.round_no).length);
          const l = tournament.picks_per_round[r.round_no - 1];
          return (
            <button
              key={r.round_no}
              role="tab"
              aria-selected={rn === r.round_no}
              onClick={() => { setRn(r.round_no); setMsg(""); }}
              className={`flex-1 rounded px-2 py-2 text-sm font-semibold border ${
                rn === r.round_no ? "bg-fairway text-white border-fairway" : "bg-white border-pine/20 hover:bg-sand"
              }`}
            >
              R{r.round_no}
              <span className="block text-xs font-normal opacity-80">{n}/{l}{isLocked(r) ? " · locked" : ""}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-pine/15 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="font-semibold">Round {rn} lineup ({myRound.length}/{limit})</h2>
          <span className="text-xs text-ink/60">{locked ? "Locked" : lockText(round?.lock_at ?? null)}</span>
        </div>
        {myRound.length === 0 ? (
          <p className="text-sm text-ink/60">No golfers picked for this round yet.</p>
        ) : (
          <ul className="divide-y divide-pine/10">
            {myRound.map((p) => {
              const g = gById.get(p.golfer_id);
              return (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>{g?.name ?? "Unknown"}</span>
                  <span className={`font-mono text-sm ${parClass(score(p.golfer_id, rn)?.to_par)}`}>
                    {fmtRound(score(p.golfer_id, rn))}
                  </span>
                  {!locked && (
                    <button
                      disabled={pending}
                      onClick={() => run(() => removePick(p.id))}
                      className="text-sm text-azalea font-semibold hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {msg && <p className="text-sm text-azalea mt-2" role="alert">{msg}</p>}
      </div>

      {eliminated && (
        <p className="mb-4 rounded bg-azalea/10 border border-azalea/30 text-azalea px-3 py-2 text-sm font-semibold">
          You didn&apos;t make the cut after Round {tournament.cut_after_round}, so you&apos;re out of picks for this round. Your score is final.
        </p>
      )}

      {!locked && !eliminated && (
        <div className="bg-white border border-pine/15 rounded-lg">
          <div className="p-3 border-b border-pine/10">
            <label htmlFor="q" className="sr-only">Search golfers</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search golfers"
              className="w-full border border-pine/30 rounded px-3 py-2"
            />
            <p className="text-xs text-ink/60 mt-2">Scores shown are each golfer&apos;s score in that round. You earn the score from the round you pick them for.</p>
          </div>
          <ul className="max-h-[28rem] overflow-y-auto divide-y divide-pine/10">
            {shown.map((g) => {
              const used = usedIn.get(g.id);
              const notPlaying = afterCut && g.status !== "active";
              const disabled = pending || full || used !== undefined || notPlaying;
              return (
                <li key={g.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className={`min-w-0 truncate ${used !== undefined || notPlaying ? "text-ink/40" : ""}`}>
                    {g.name}
                    {g.country && <span className="ml-1 text-xs text-ink/40">{g.country}</span>}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs flex gap-2">
                      {[1, 2, 3, 4].map((r) => {
                        const sr = score(g.id, r);
                        return sr && sr.to_par !== null ? (
                          <span key={r} className={parClass(sr.to_par)} title={`Round ${r}`}>
                            <span className="text-ink/40">R{r}</span> {fmtPar(sr.to_par)}
                          </span>
                        ) : null;
                      })}
                    </span>
                    {used !== undefined ? (
                      <span className="text-xs text-ink/50 w-16 text-right">Used R{used}</span>
                    ) : notPlaying ? (
                      <span className="text-xs text-ink/50 w-16 text-right">Not playing</span>
                    ) : (
                      <button
                        disabled={disabled}
                        onClick={() => run(() => addPick(tournament.id, rn, g.id))}
                        className="w-16 rounded bg-fairway text-white text-xs font-semibold py-1 hover:bg-pine disabled:opacity-30"
                      >
                        Add
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-4 text-sm text-ink/60">No golfers match.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
