export type Tournament = {
  id: string;
  slug: string;
  name: string;
  espn_event_id: string | null;
  picks_per_round: number[];
  cut_after_round: number;
  cut_mode: "off" | "percent" | "count";
  cut_value: number;
  cut_applied: boolean;
  payment_note: string | null;
  completed_at: string | null;
  theme: "auto" | "classic" | "masters";
  is_active: boolean;
};
export type Round = { tournament_id: string; round_no: number; lock_at: string | null };
export type Golfer = {
  id: string;
  tournament_id: string;
  espn_athlete_id: string | null;
  name: string;
  country: string | null;
  status: "active" | "cut" | "wd" | "dq";
  sort_order: number | null;
};
export type GolferRound = {
  golfer_id: string;
  round_no: number;
  to_par: number | null;
  strokes: number | null;
  thru: number | null;
  updated_at: string;
};
export type Pick = { id: string; tournament_id: string; user_id: string; round_no: number; golfer_id: string };
export type LeaderRow = {
  user_id: string;
  display_name: string;
  is_cut: boolean;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  total: number;
  picks_made: number;
};

export function isLocked(r: Round | undefined, now = Date.now()): boolean {
  return !!r?.lock_at && now >= new Date(r.lock_at).getTime();
}

export type StandRow = {
  user_id: string;
  display_name: string;
  is_cut: boolean;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  total: number;
  under_holes: number;
  over_holes: number;
  best_round: number | null;
  worst_round: number | null;
  place_live: number;
  place_final: number;
  is_complete: boolean;
};
