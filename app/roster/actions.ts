"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

async function ensureEntry(db: any, tournamentId: string, userId: string) {
  await db.from("entries").upsert({ tournament_id: tournamentId, user_id: userId }, { onConflict: "tournament_id,user_id", ignoreDuplicates: true });
}

export async function saveProfile(tournamentId: string, formData: FormData): Promise<Result> {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const name = String(formData.get("display_name") ?? "").trim().slice(0, 40);
  if (!name) return { error: "Enter a display name." };
  const { error } = await db.from("profiles").upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  await ensureEntry(db, tournamentId, user.id);
  revalidatePath("/roster");
  revalidatePath("/");
  return {};
}

export async function addPick(tournamentId: string, roundNo: number, golferId: string): Promise<Result> {
  const db = createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  await ensureEntry(db, tournamentId, user.id);
  const { error } = await db.from("picks").insert({ tournament_id: tournamentId, round_no: roundNo, golfer_id: golferId });
  if (error) {
    if (error.code === "23505") return { error: "You've already used this golfer in a round." };
    return { error: error.message };
  }
  revalidatePath("/roster");
  revalidatePath("/");
  return {};
}

export async function removePick(pickId: string): Promise<Result> {
  const db = createClient();
  const { error } = await db.from("picks").delete().eq("id", pickId);
  if (error) return { error: error.message };
  revalidatePath("/roster");
  revalidatePath("/");
  return {};
}
