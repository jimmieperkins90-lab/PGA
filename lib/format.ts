export function fmtPar(n: number | null | undefined): string {
  if (n === null || n === undefined) return "–";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function parClass(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-ink/40";
  if (n < 0) return "text-azalea font-semibold";
  return "text-ink";
}

// "-2 (70)" for a finished round, "-2 thru 9" while in progress, "–" if not played yet.
export function fmtRound(r: { to_par: number | null; strokes: number | null; thru: number | null } | undefined): string {
  if (!r || r.to_par === null) return "–";
  const par = fmtPar(r.to_par);
  if ((r.thru ?? 0) >= 18) return r.strokes ? `${par} (${r.strokes})` : par;
  return r.thru ? `${par} thru ${r.thru}` : par;
}

// Plain-English description of the admin's cut setting (used on the Rules page).
export function cutRuleText(mode: string, value: number, afterRound: number): string {
  if (mode === "off") return "There is no cut in this pool. Everyone plays all four rounds.";
  const who =
    mode === "percent"
      ? `the bottom ${value}% of entries (rounded down)`
      : `the ${value} worst-scoring ${value === 1 ? "entry" : "entries"}`;
  return `After Round ${afterRound}, ${who} are cut. Anyone tied at the cut line stays in.`;
}
