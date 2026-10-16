"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchEvent } from "@/lib/espn";
import { syncActiveTournament } from "@/lib/sync";
import { etToIso } from "@/lib/time";

type Result = { ok?: string; error?: string };

async function requireAdmin(db: any) {
  const { data } = await db.rpc("is_admin");
  return data === true;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createTournament(_: Result, fd: FormData): Promise<Result> {
  const db = createClient();
  if (!(await requireAdmin(db))) return { error: "Admins only." };
  const eventId = String(fd.get("event_id") ?? "").trim();
  if (!eventId) return { error: "Enter an ESPN event id." };
  let ev;
  try {
    ev = await fetchEvent(eventId);
  } catch (e: any) {
    return { error: `Couldn't read ESPN: ${e.message}` };
  }
  const year = (ev.startDate ?? "").slice(0, 4) || String(new Date().getFullYear());
  const { data: t, error } = await db
    .from("tournaments")
    .insert({ slug: slugify(`${ev.name}-${year}`), name: ev.name, espn_event_id: ev.eventId })
    .select()
    .single();
  if (error) return { error: error.message };

  const start = ev.startDate ? new Date(ev.startDate).getTime() : Date.now();
  const rounds = [1, 2, 3, 4].map((n) => ({
    tournament_id: t.id,
    round_no: n,
    lock_at: new Date(start + 12 * 3600_000 + (n - 1) * 24 * 3600_000).toISOString(), // ~8am ET; adjust below
  }));
  const r1 = await db.from("rounds").insert(rounds);
  if (r1.error) return { error: r1.error.message };

  const rows = ev.golfers.map((g) => ({
    tournament_id: t.id,
    espn_athlete_id: g.espn_id,
    name: g.name,
    country: g.country,
    status: g.status,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const r = await db.from("golfers").insert(rows.slice(i, i + 200));
    if (r.error) return { error: r.error.message };
  }
  revalidatePath("/admin");
  return { ok: `Created ${ev.name} with ${rows.length} golfers. Set first-tee lock times below, then make it active.` };
}

export async function setActive(id: string): Promise<void> {
  const db = createClient();
  if (!(await requireAdmin(db))) return;
  await db.from("tournaments").update({ is_active: false }).neq("id", id);
  await db.from("tournaments").update({ is_active: true }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/roster");
}

export async function setLockTimes(tournamentId: string, _: Result, fd: FormData): Promise<Result> {
  const db = createClient();
  if (!(await requireAdmin(db))) return { error: "Admins only." };
  for (const n of [1, 2, 3, 4]) {
    const iso = etToIso(String(fd.get(`r${n}`) ?? ""));
    if (!iso) return { error: `Round ${n}: enter a valid date and time.` };
    const { error } = await db.from("rounds").update({ lock_at: iso }).eq("tournament_id", tournamentId).eq("round_no", n);
    if (error) return { error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/roster");
  return { ok: "Lock times saved (Eastern Time)." };
}

export async function forceSync(_: Result, __: FormData): Promise<Result> {
  const db = createClient();
  if (!(await requireAdmin(db))) return { error: "Admins only." };
  try {
    const r = await syncActiveTournament(true);
    revalidatePath("/");
    return r.synced ? { ok: `Synced ${r.golfers} golfers.` } : { error: r.reason ?? "Sync did not run." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function setGolferStatus(_: Result, fd: FormData): Promise<Result> {
  const db = createClient();
  if (!(await requireAdmin(db))) return { error: "Admins only." };
  const id = String(fd.get("golfer_id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!id || !["active", "cut", "wd", "dq"].includes(status)) return { error: "Pick a golfer and a status." };
  const { error } = await db.from("golfers").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/roster");
  return { ok: "Status updated." };
}

export async function setCutRule(tournamentId: string, _: Result, fd: FormData): Promise<Result> {
  const db = createClient();
  if (!(await requireAdmin(db))) return { error: "Admins only." };
  const mode = String(fd.get("mode") ?? "");
  const value = mode === "off" ? 0 : parseInt(String(fd.get("value") ?? ""), 10);
  if (!["off", "percent", "count"].includes(mode)) return { error: "Choose a cut rule." };
  if (mode !== "off" && (!Number.isFinite(value) || value < 0)) return { error: "Enter a number of 0 or more." };
  if (mode === "percent" && value > 100) return { error: "Percent can't be more than 100." };
  const { data, error } = await db.rpc("set_cut_rule", { p_t: tournamentId, p_mode: mode, p_value: value });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/roster");
  return { ok: mode === "off" ? "Cut turned off." : `Cut rule saved.${data > 0 ? ` ${data} entries were cut.` : ""}` };
}
