import { NextResponse } from "next/server";
import { syncActiveTournament } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await syncActiveTournament());
  } catch (e: any) {
    return NextResponse.json({ synced: false, reason: String(e?.message ?? e) }, { status: 200 });
  }
}
