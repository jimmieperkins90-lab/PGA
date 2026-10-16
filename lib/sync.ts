import { createClient } from "@supabase/supabase-js";
import { fetchEvent } from "./espn";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase/env";

const MIN_INTERVAL_MS = 60_000;

function anon() {
  return createClient<any, "pga">(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "pga" },
    auth: { persistSession: false },
  });
}

export type SyncResult = { synced: boolean; reason?: string; golfers?: number };

// Pulls scores from ESPN into the database. Throttled so many visitors cause one fetch per minute.
export async function syncActiveTournament(force = false): Promise<SyncResult> {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return { synced: false, reason: "INGEST_SECRET not configured" };

  const db = anon();
  const { data: t } = await db.from("tournaments").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!t?.espn_event_id) return { synced: false, reason: "no active tournament with an ESPN event id" };

  const { data: rounds } = await db.from("rounds").select("round_no, lock_at").eq("tournament_id", t.id).order("round_no");
  const r1 = rounds?.find((r: any) => r.round_no === 1)?.lock_at;
  const r4 = rounds?.find((r: any) => r.round_no === 4)?.lock_at;
  const now = Date.now();
  if (!force) {
    if (r1 && now < new Date(r1).getTime() - 30 * 60_000) return { synced: false, reason: "before tournament" };
    if (r4 && now > new Date(r4).getTime() + 14 * 3600_000) return { synced: false, reason: "tournament over" };
    const { data: latest } = await db.from("golfer_rounds").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (latest?.updated_at && now - new Date(latest.updated_at).getTime() < MIN_INTERVAL_MS) return { synced: false, reason: "fresh" };
  }

  const ev = await fetchEvent(t.espn_event_id);
  const { data, error } = await db.rpc("apply_scores", {
    p_secret: secret,
    p_tournament: t.id,
    p_payload: { golfers: ev.golfers },
  });
  if (error) return { synced: false, reason: error.message };
  return { synced: true, golfers: data as number };
}
