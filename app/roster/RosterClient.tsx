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
  unpaid,
  paymentNote,
}: {
  tournament: Tournament;
  rounds: Round[];
  golfers: Golfer[];
  scores: GolferRound[];
  picks: Pick[];
  displayName: string;
  isCut: boolean;
  unpaid: boolean;
  paymentNote: string | null;
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
  const openSlots = eliminated ? 0 : Math.max(limit - myRound.length, 0);
  const incomplete = !locked && openSlots > 0;
  const tabIncomplete = (r: Round) =>
    !isLocked(r) &&
    !(isCut && r.round_no > tournament.cut_after_round) &&
    picks.filter((p) => p.round_no === r.round_no).length < (tournament.picks_per_round[r.round_no - 1] ?? 0);
  const score = (gid: string, r: number) => scores.find((x) => x.golfer_id === gid && x.round_no === r);
  const gById = useMemo(() => new Map(golfers.map((g) => [g.id, g])), [golfers]);
  const usedIn = useMemo(() => new Map(picks.map((p) => [p.golfer_id, p.round_no])), [picks]);
  // Golfers who missed the real cut (or withdrew) but are still in an upcoming lineup of an active entry.
  const outPicks = (r: Round) =>
    isCut || isLocked(r)
      ? []
      : picks.filter((p) => p.round_no === r.round_no && gById.get(p.golfer_id)?.status !== "active" && gById.has(p.golfer_id));

  // Round 1: ESPN's pre-tournament order. Rounds 2-4: current leaderboard order (total to par so far).
  const ordered = useMemo(() => {
    const byOrder = (a: Golfer, b: Golfer) =>
      (a.sort_order ?? 9999) - (b.sort_order ?? 9999) || a.name.localeCompare(b.name);
    if (rn === 1) return { list: [...golfers].sort(byOrder), pos: new Map<string, string>() };
    const total = (g: Golfer) => {
      const mine = scores.filter((x) => x.golfer_id === g.id && x.round_no < rn && x.to_par !== null);
      return mine.length ? mine.reduce((a, x) => a + (x.to_par as number), 0) : null;
    };
    const playing = (g: Golfer) => !(g.status === "wd" || g.status === "dq" || (rn > tournament.cut_after_round && g.status !== "active"));
    const rows = golfers.map((g) => ({ g, t: total(g), p: playing(g) }));
    rows.sort(
      (a, b) =>
        Number(b.p) - Number(a.p) ||
        (a.t ?? 9999) - (b.t ?? 9999) ||
        byOrder(a.g, b.g)
    );
    const pos = new Map<string, string>();
    const scored = rows.filter((r) => r.p && r.t !== null);
    scored.forEach((r) => {
      const first = scored.findIndex((x) => x.t === r.t);
      const tied = scored.filter((x) => x.t === r.t).length > 1;
      pos.set(r.g.id, `${tied ? "T" : ""}${first + 1}`);
    });
    return { list: rows.map((r) => r.g), pos };
  }, [golfers, scores, rn, tournament.cut_after_round]);

  const shown = ordered.list.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()));

  // Each player's own view of the field: still available, already used by them, or out (missed the real cut / withdrew).
  const isOut = (g: Golfer) => g.status === "wd" || g.status === "dq" || (afterCut && g.status !== "active");
  const availList = shown.filter((g) => usedIn.get(g.id) === undefined && !isOut(g));
  const usedList = shown.filter((g) => usedIn.get(g.id) !== undefined);
  const outList = shown.filter((g) => usedIn.get(g.id) === undefined && isOut(g));
  const flaggedAll = rounds.flatMap((r) => outPicks(r).map((p) => ({ p, r })));
  const flaggedIds = new Set(flaggedAll.map((f) => f.p.id));
  const searching = q.trim() !== "";

  const renderRow = (g: Golfer) => {
    const used = usedIn.get(g.id);
    const notPlaying = isOut(g);
    const disabled = pending || full || used !== undefined || notPlaying;
    const anyScore = [1, 2, 3, 4].some((r) => score(g.id, r)?.to_par != null);
    return (
      <li
        key={g.id}
        className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_repeat(4,2.25rem)_5rem] items-center gap-x-1 gap-y-1 px-3 py-2.5 text-sm"
      >
        <span className={`order-1 sm:order-none min-w-0 truncate ${used !== undefined || notPlaying ? "text-ink/50" : ""}`}>
          <span className="inline-block w-8 font-mono text-xs text-ink/40">
            {rn === 1 ? (g.sort_order ?? "") : (ordered.pos.get(g.id) ?? "")}
          </span>
          {g.name}
          {g.country && <span className="ml-1 text-xs text-ink/40">{g.country}</span>}
        </span>
        <span
          className={`order-3 sm:order-none col-span-2 sm:col-span-1 grid-cols-4 gap-1 pl-8 sm:pl-0 sm:contents ${
            anyScore ? "grid" : "hidden sm:contents"
          }`}
        >
          {[1, 2, 3, 4].map((r) => {
            const sr = score(g.id, r);
            const has = sr && sr.to_par !== null;
            return (
              <span key={r} className={`font-mono text-xs sm:text-right ${has ? parClass(sr!.to_par) : "text-ink/20"}`}>
                <span className="sm:hidden text-ink/40">R{r} </span>
                {has ? fmtPar(sr!.to_par) : "·"}
              </span>
            );
          })}
        </span>
        <span className="order-2 sm:order-none flex justify-end">
          {used !== undefined ? (
            <span className="text-xs text-ink/50 px-2">Used R{used}</span>
          ) : notPlaying ? (
            <span className="text-xs text-ink/50 px-2">Out</span>
          ) : (
            <button
              disabled={disabled}
              onClick={() => run(() => addPick(tournament.id, rn, g.id))}
              className="min-h-[40px] w-20 rounded bg-fairway text-white text-sm font-semibold hover:bg-pine disabled:opacity-30"
            >
              Add
            </button>
          )}
        </span>
      </li>
    );
  };

  const fold = (title: string, items: Golfer[], open: boolean | undefined, empty?: string) => (
    <details open={open} className="group border-t border-pine/10 first:border-t-0">
      <summary className="list-none flex min-h-[48px] cursor-pointer items-center justify-between bg-sand/40 px-3 font-semibold text-pine [&::-webkit-details-marker]:hidden">
        <span>
          {title} <span className="font-normal text-ink/50">({items.length})</span>
        </span>
        <span aria-hidden className="text-lg leading-none text-ink/40 transition-transform group-open:rotate-90">&rsaquo;</span>
      </summary>
      <ul className="divide-y divide-pine/10">
        {items.map(renderRow)}
        {items.length === 0 && empty && <li className="px-3 py-4 text-sm text-ink/60">{empty}</li>}
      </ul>
    </details>
  );

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
      {unpaid && (
        <p className="mt-2 rounded bg-gold/15 border border-gold/40 px-3 py-2 text-sm" role="status">
          <span className="font-semibold">Payment reminder:</span> your entry isn&apos;t marked paid yet.
          {paymentNote ? ` ${paymentNote}` : ""}
        </p>
      )}
      <p className="text-sm text-ink/70 mb-4 mt-2">
        {displayName}: each golfer can be used once all week.
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
              className={`flex-1 min-h-[48px] rounded px-2 py-2 text-sm font-semibold border ${
                rn === r.round_no ? "bg-fairway text-white border-fairway" : "bg-white border-pine/20 hover:bg-sand"
              }`}
            >
              R{r.round_no}
              {outPicks(r).length > 0 && (
                <span aria-label="Golfer out of tournament" className="ml-1 inline-block h-2 w-2 rounded-full bg-azalea align-middle ring-1 ring-black/20" />
              )}
              {tabIncomplete(r) && (
                <span aria-label="Lineup incomplete" className="ml-1 inline-block h-2 w-2 rounded-full bg-gold align-middle ring-1 ring-black/20" />
              )}
              <span className="block text-xs font-normal opacity-80">{n}/{l}{isLocked(r) ? " · locked" : ""}</span>
            </button>
          );
        })}
      </div>

      {flaggedAll.length > 0 && (
        <div className="mb-3 rounded border border-azalea/40 bg-azalea/10 px-3 py-2 text-sm text-ink" role="alert">
          <p className="font-semibold text-azalea">
            {flaggedAll.length === 1 ? "A golfer in your lineup" : `${flaggedAll.length} golfers in your lineups`} missed the cut or withdrew:
          </p>
          <ul className="mt-1 space-y-0.5">
            {flaggedAll.map(({ p, r }) => (
              <li key={p.id}>
                <button onClick={() => { setRn(r.round_no); setMsg(""); }} className="text-left underline">
                  {gById.get(p.golfer_id)?.name} (Round {r.round_no})
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1">Swap them out before the round locks or that slot scores nothing.</p>
        </div>
      )}
      {incomplete && (
        <p className="mb-3 rounded border border-gold/60 bg-gold/15 px-3 py-2 text-sm font-semibold text-ink" role="status">
          Round {rn} lineup incomplete: {openSlots} open {openSlots === 1 ? "spot" : "spots"}. {lockText(round?.lock_at ?? null)}.
        </p>
      )}
      <div className="bg-white border border-pine/15 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-semibold">Round {rn} lineup ({myRound.length}/{limit})</h2>
          {locked ? (
            <span className="text-xs font-semibold text-ink/60">Locked</span>
          ) : eliminated ? null : incomplete ? (
            <span className="rounded-full bg-gold/25 px-2 py-0.5 text-xs font-semibold text-ink">{openSlots} open</span>
          ) : (
            <span className="rounded-full bg-fairway/15 px-2 py-0.5 text-xs font-semibold text-fairway">Lineup set</span>
          )}
        </div>
        <ul className="space-y-1.5">
          {myRound.map((p) => {
            const g = gById.get(p.golfer_id);
            return (
              <li key={p.id} className={`flex min-h-[44px] items-center justify-between gap-2 rounded border px-3 ${flaggedIds.has(p.id) ? "border-azalea bg-azalea/10" : "border-pine/10 bg-paper"}`}>
                <span className="min-w-0 flex-1 truncate">
                  {g?.name ?? "Unknown"}
                  {flaggedIds.has(p.id) && (
                    <span className="ml-2 rounded-full bg-azalea px-2 py-0.5 text-[11px] font-semibold text-white">
                      {g?.status === "cut" ? "Cut" : g?.status === "dq" ? "DQ" : "WD"}
                    </span>
                  )}
                </span>
                <span className={`font-mono text-sm ${parClass(score(p.golfer_id, rn)?.to_par)}`}>
                  {fmtRound(score(p.golfer_id, rn))}
                </span>
                {!locked && (
                  <button
                    disabled={pending}
                    onClick={() => run(() => removePick(p.id))}
                    className="min-h-[40px] px-2 text-sm text-azalea font-semibold hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </li>
            );
          })}
          {Array.from({ length: openSlots }).map((_, i) => (
            <li
              key={`open-${i}`}
              className={`flex min-h-[44px] items-center justify-between gap-2 rounded border border-dashed px-3 text-sm ${
                locked ? "border-pine/20 text-ink/40" : "border-gold bg-gold/10 text-ink/70"
              }`}
            >
              <span className="italic">{locked ? "Empty slot (locked)" : `Open slot ${myRound.length + i + 1} of ${limit}`}</span>
              {!locked && <span className="text-xs font-semibold text-fairway">Pick below</span>}
            </li>
          ))}
          {myRound.length === 0 && openSlots === 0 && (
            <li className="text-sm text-ink/60">No picks this round.</li>
          )}
        </ul>
        {msg && <p className="text-sm text-azalea mt-2" role="alert">{msg}</p>}
      </div>

      {eliminated && (
        <p className="mb-4 rounded bg-azalea/10 border border-azalea/30 text-azalea px-3 py-2 text-sm font-semibold">
          You didn&apos;t make the cut after Round {tournament.cut_after_round}, so you&apos;re out of picks for this round. Your score is final.
        </p>
      )}

      {!locked && !eliminated && (
        <div className="bg-white border border-pine/15 rounded-lg">
          <div className="sticky top-0 z-20 flex items-center gap-3 rounded-t-lg border-b border-pine/10 bg-white p-2">
            <label htmlFor="q" className="sr-only">Search golfers</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search golfers"
              autoComplete="off"
              className="min-w-0 flex-1 border border-pine/30 rounded px-3 py-2.5"
            />
            <span className="shrink-0 text-xs font-semibold text-pine whitespace-nowrap">
              {myRound.length}/{limit} picked
            </span>
          </div>
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_repeat(4,2.25rem)_5rem] items-center gap-x-1 px-3 py-1.5 text-[11px] font-semibold uppercase text-ink/50 bg-sand/50 border-b border-pine/10">
            <span>Golfer</span>
            {[1, 2, 3, 4].map((r) => (
              <span key={r} className="text-right">R{r}</span>
            ))}
            <span />
          </div>
          {fold("Available golfers", availList, true, searching ? "No available golfers match." : "No golfers available.")}
          {usedList.length > 0 && fold("Used golfers", usedList, searching ? true : undefined)}
          {outList.length > 0 && fold("Cut golfers", outList, searching ? true : undefined)}
        </div>
      )}
    </div>
  );
}
