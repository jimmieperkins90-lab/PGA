import { cache } from "react";
import type { Golfer, GolferRound, Round, Tournament } from "./types";

// Loads the active tournament plus its rounds. `db` is a Supabase client scoped to the pga schema.
export const getActive = cache(async function getActive(db: any): Promise<{ t: Tournament; rounds: Round[] } | null> {
  const { data: t } = await db
    .from("tournaments")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!t) return null;
  const { data: rounds } = await db.from("rounds").select("*").eq("tournament_id", t.id).order("round_no");
  return { t: t as Tournament, rounds: (rounds ?? []) as Round[] };
});

export async function getField(db: any, tournamentId: string) {
  const { data: golfers } = await db.from("golfers").select("*").eq("tournament_id", tournamentId).order("name");
  const ids = (golfers ?? []).map((g: Golfer) => g.id);
  let scores: GolferRound[] = [];
  if (ids.length) {
    const { data } = await db.from("golfer_rounds").select("*").in("golfer_id", ids);
    scores = (data ?? []) as GolferRound[];
  }
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
