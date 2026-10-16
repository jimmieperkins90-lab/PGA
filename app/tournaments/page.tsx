import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmtPar } from "@/lib/format";

export const dynamic = "force-dynamic";

type Hist = { tournament_id: string; slug: string; name: string; completed_at: string; place: number; entries: number; total: number; is_cut: boolean };

const ord = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default async function Tournaments() {
  const db = createClient();
  const [{ data: hist }, { data: past }, { data: current }] = await Promise.all([
    db.rpc("my_history"),
    db.from("tournaments").select("id, slug, name, completed_at").not("completed_at", "is", null).order("completed_at", { ascending: false }),
    db.from("tournaments").select("slug, name").eq("is_active", true).is("completed_at", null).maybeSingle(),
  ]);
  const mine = (hist ?? []) as Hist[];
  const wins = mine.filter((h) => h.place === 1).length;
  const best = mine.length ? Math.min(...mine.map((h) => h.place)) : null;
  const avg = mine.length ? mine.reduce((a, h) => a + h.place, 0) / mine.length : null;
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-pine">Tournaments</h1>

      {current && (
        <p className="text-sm bg-sand rounded px-3 py-2">
          In progress: <Link href="/" className="text-fairway font-semibold underline">{current.name}</Link>
        </p>
      )}

      <section>
        <h2 className="font-semibold mb-2">My results</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-ink/60">Nothing yet. Your finishes show up here after a tournament ends.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                ["Played", String(mine.length)],
                ["Wins", String(wins)],
                ["Best finish", best ? ord(best) : "–"],
                ["Avg finish", avg ? avg.toFixed(1) : "–"],
              ].map(([k, v]) => (
                <div key={k} className="bg-white border border-pine/15 rounded-lg px-3 py-2">
                  <div className="text-xs uppercase text-ink/50">{k}</div>
                  <div className="font-display text-xl text-pine">{v}</div>
                </div>
              ))}
            </div>
            <ul className="bg-white border border-pine/15 rounded-lg divide-y divide-pine/10">
              {mine.map((h) => (
                <li key={h.tournament_id}>
                  <Link href={`/tournaments/${h.slug}`} className="flex items-center justify-between px-3 py-2 hover:bg-sand/50">
                    <span>
                      <span className="font-semibold">{h.name}</span>
                      <span className="block text-xs text-ink/50">{dateOf(h.completed_at)}</span>
                    </span>
                    <span className="text-right text-sm">
                      <span className="font-semibold">{h.is_cut ? "Cut" : ord(h.place)}</span>
                      <span className="text-ink/50"> of {h.entries}</span>
                      <span className="block font-mono text-xs">{fmtPar(h.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Past tournaments</h2>
        {(past ?? []).length === 0 ? (
          <p className="text-sm text-ink/60">No finished tournaments yet.</p>
        ) : (
          <ul className="bg-white border border-pine/15 rounded-lg divide-y divide-pine/10">
            {(past ?? []).map((p: any) => (
              <li key={p.id}>
                <Link href={`/tournaments/${p.slug}`} className="flex items-center justify-between px-3 py-2 hover:bg-sand/50">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-ink/50">{dateOf(p.completed_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
