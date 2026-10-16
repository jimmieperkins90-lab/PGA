import { cache } from "react";
import type { Golfer, GolferRound, Round, Tournament } from "./types";

// Loads the active tournament plus its rounds. `db` is a Supabase client scoped to the pga schema.
export const getActive = cache(async function getActive(db: any): Promise<{ t: Tournament; rounds: Round[] } | null> {
  const { data } = await db
    .from("tournaments")
    .select("*, rounds(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { rounds, ...t } = data;
  const sorted = ((rounds ?? []) as Round[]).slice().sort((x, y) => x.round_no - y.round_no);
  return { t: t as Tournament, rounds: sorted };
});

export async function getField(db: any, tournamentId: string) {
  const [{ data: golfers }, { data: rows }] = await Promise.all([
    db.from("golfers").select("*").eq("tournament_id", tournamentId).order("name"),
    db.from("golfer_rounds").select("*, golfers!inner(tournament_id)").eq("golfers.tournament_id", tournamentId),
  ]);
  const scores = ((rows ?? []) as any[]).map(({ golfers: _g, ...r }) => r) as GolferRound[];
  return { golfers: (golfers ?? []) as Golfer[], scores };
}

export function totalFor(scores: GolferRound[], golferId: string): number | null {
  const mine = scores.filter((s) => s.golfer_id === golferId && s.to_par !== null);
  return mine.length ? mine.reduce((a, s) => a + (s.to_par as number), 0) : null;
}

export function fmtLock(iso: string | null): string {
  if (!iso) return "time TBD";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }) + " ET";
}
