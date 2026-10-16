// ESPN's public (unofficial) scoreboard feed. Free and updates hole-by-hole during play,
// but undocumented, so every field is read defensively.
const BASE = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const DEFAULT_PAR = 72;

export type SyncRound = { round_no: number; to_par: number | null; strokes: number | null; thru: number };
export type SyncGolfer = {
  espn_id: string;
  name: string;
  country: string | null;
  status: "active" | "cut" | "wd" | "dq";
  order: number | null;
  rounds: SyncRound[];
};
export type EspnEvent = { eventId: string; name: string; startDate: string | null; golfers: SyncGolfer[] };

function parToNum(s: unknown): number | null {
  if (typeof s === "number") return s;
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (t === "E") return 0;
  const m = /^([+-])(\d+)$/.exec(t);
  return m ? (m[1] === "-" ? -1 : 1) * parseInt(m[2], 10) : null;
}

function statusOf(c: any): SyncGolfer["status"] {
  const hay = [c?.status?.type?.name, c?.status?.displayValue, c?.status?.type?.description, c?.status?.type?.shortDetail]
    .filter(Boolean)
    .join(" ");
  if (/\bdq\b|disqual/i.test(hay)) return "dq";
  if (/\bwd\b|withdr/i.test(hay)) return "wd";
  if (/\bcut\b|missed cut|STATUS_CUT/i.test(hay)) return "cut";
  return "active";
}

function parseCompetitor(c: any, par: number): SyncGolfer | null {
  const name = c?.athlete?.displayName || c?.athlete?.fullName;
  const id = c?.id ?? c?.athlete?.id;
  if (!name || !id) return null;
  const rounds: SyncRound[] = [];
  for (const ls of c?.linescores ?? []) {
    const round_no = Number(ls?.period);
    if (!round_no || round_no < 1 || round_no > 4) continue;
    const holes: any[] = Array.isArray(ls?.linescores) ? ls.linescores.filter((h: any) => h?.value != null) : [];
    const strokes = typeof ls?.value === "number" && ls.value > 0 ? ls.value : null;
    if (strokes === null && holes.length === 0) continue; // round not started
    let to_par = parToNum(ls?.displayValue);
    if (to_par === null && strokes !== null && (holes.length === 18 || holes.length === 0)) to_par = strokes - par;
    const thru = holes.length > 0 ? holes.length : strokes !== null ? 18 : 0;
    rounds.push({ round_no, to_par, strokes, thru });
  }
  return {
    espn_id: String(id),
    name: String(name),
    country: c?.athlete?.flag?.alt ?? null,
    status: statusOf(c),
    order: Number.isFinite(Number(c?.order)) && c?.order != null ? Number(c.order) : null,
    rounds,
  };
}

export async function fetchEvent(eventId?: string, par = DEFAULT_PAR): Promise<EspnEvent> {
  const res = await fetch(eventId ? `${BASE}?event=${encodeURIComponent(eventId)}` : BASE, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN responded ${res.status}`);
  const json: any = await res.json();
  const ev = (json?.events ?? []).find((e: any) => !eventId || String(e?.id) === String(eventId)) ?? json?.events?.[0];
  if (!ev) throw new Error("Event not found in ESPN feed");
  const comp = ev?.competitions?.[0];
  const golfers = ((comp?.competitors ?? []) as any[])
    .map((c) => parseCompetitor(c, par))
    .filter((g): g is SyncGolfer => g !== null);
  return { eventId: String(ev.id), name: String(ev.name ?? ev.shortName ?? "Tournament"), startDate: ev.date ?? null, golfers };
}
