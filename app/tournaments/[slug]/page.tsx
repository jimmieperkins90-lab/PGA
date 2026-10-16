import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Standings from "../../_components/Standings";
import type { Round, Tournament } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PastTournament({ params }: { params: { slug: string } }) {
  const db = createClient();
  const { data: t } = await db.from("tournaments").select("*").eq("slug", params.slug).maybeSingle();
  if (!t) notFound();
  const { data: rounds } = await db.from("rounds").select("*").eq("tournament_id", t.id).order("round_no");
  return (
    <div>
      <Link href="/tournaments" className="text-sm text-fairway font-semibold hover:underline">&larr; All tournaments</Link>
      <div className="mt-3">
        <Standings t={t as Tournament} rounds={(rounds ?? []) as Round[]} live={false} />
      </div>
    </div>
  );
}
