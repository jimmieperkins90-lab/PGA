import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActive } from "@/lib/data";
import Standings from "./_components/Standings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = createClient();
  const active = await getActive(db);
  if (!active)
    return (
      <p className="text-ink/70">
        No tournament is running right now. See <Link href="/tournaments" className="text-fairway font-semibold underline">past tournaments</Link>.
      </p>
    );
  return <Standings t={active.t} rounds={active.rounds} live />;
}
