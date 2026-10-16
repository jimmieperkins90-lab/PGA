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
// The setting is how many entries ADVANCE: a percent of the pool, or a set number. Ties at the line advance too.
export function cutRuleText(mode: string, value: number, afterRound: number): string {
  if (mode === "off") return "There is no cut in this pool. Everyone plays all four rounds.";
  const who =
    mode === "percent"
      ? `the top ${value}% of entries (rounded up)`
      : `the top ${value} ${value === 1 ? "entry" : "entries"}`;
  const next = afterRound === 2 ? "the weekend" : `Round ${afterRound + 1}`;
  return `After Round ${afterRound}, ${who}, plus anyone tied at the line, advance to ${next}. The remaining entries are cut from the tournament.`;
}

export function fmtMoney(n: number): string {
  return "$" + (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
