import { createClient } from "@/lib/supabase/server";
import { getActive } from "@/lib/data";
import { cutRuleText } from "@/lib/format";

export const dynamic = "force-dynamic";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-pine/15 rounded-lg p-4">
      <h2 className="font-display text-lg text-pine mb-2">{title}</h2>
      <div className="text-[15px] leading-relaxed text-ink/85 space-y-2">{children}</div>
    </section>
  );
}

export default async function Rules() {
  const db = createClient();
  const active = await getActive(db);
  const t = active?.t;
  const picks = t?.picks_per_round ?? [4, 4, 3, 3];
  const cutAfter = t?.cut_after_round ?? 2;
  const cutText = t ? cutRuleText(t.cut_mode, t.cut_value, t.cut_after_round) : "After Round 2, the lowest-scoring entries are cut.";

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-pine">How it works</h1>
        <p className="text-sm text-ink/70 mt-1">The short version: pick golfers each round, use each one only once, lowest score wins.</p>
      </div>

      <Card title="The basics">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Join the pool and pick golfers for each round of the tournament.</li>
          <li>Your score is what your golfers shoot, counted only for the round you used them.</li>
          <li>Add up your rounds. <strong>Lowest total to par wins.</strong></li>
        </ol>
      </Card>

      <Card title="Picks each round">
        <div className="grid grid-cols-4 gap-2 text-center">
          {picks.map((n, i) => (
            <div key={i} className="rounded border border-pine/15 bg-paper py-2">
              <div className="text-[11px] font-semibold uppercase text-ink/50">Round {i + 1}</div>
              <div className="font-display text-2xl text-pine">{n}</div>
              <div className="text-[11px] text-ink/50">golfers</div>
            </div>
          ))}
        </div>
        <p>Make or change your picks on <strong>My Roster</strong> any time before the round locks.</p>
      </Card>

      <Card title="Locks">
        <p>
          Each round&apos;s picks lock at its first tee time. After that you can&apos;t add or remove golfers for that round,
          and everyone&apos;s picks for the round become visible on the leaderboard.
        </p>
      </Card>

      <Card title="Use each golfer once">
        <p>
          You can use a golfer in only one round all tournament. Once you&apos;ve picked someone, they show as &ldquo;Used&rdquo; for the
          rest of the week. Other players can still pick the same golfer, just not twice by you.
        </p>
      </Card>

      <Card title="Scoring">
        <p>
          A pick earns the golfer&apos;s score to par <em>in the round you used them</em>. If you play a golfer in Round 2 and they shoot
          -3 that day, you get -3, whatever they shoot on other days.
        </p>
        <p>Scores update about once a minute during play and are final when the golfer finishes the round.</p>
      </Card>

      <Card title="The cut">
        <p>{cutText}</p>
        <p>
          If you&apos;re cut, your score stays where it was after Round {cutAfter} and you can&apos;t make more picks. Everyone tied at the
          cut line stays in.
        </p>
        <p>
          Separately, golfers who miss the real tournament cut (or withdraw) can&apos;t score in the later rounds, so they can&apos;t be
          picked for Rounds {cutAfter + 1}–4.
        </p>
      </Card>

      <Card title="Ties">
        <p>During play, tied players share a place. Final ties are broken in this order:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Most holes under par (birdies or better)</li>
          <li>Fewest holes over par (bogeys or worse)</li>
          <li>Best single round by any of your golfers</li>
          <li>Best <em>worst</em> round by any of your golfers</li>
        </ol>
      </Card>

      {t?.payment_note && (
        <Card title="Entry fee">
          <p>{t.payment_note}</p>
        </Card>
      )}

      <Card title="After the tournament">
        <p>Finished tournaments move to <strong>Past</strong>, where you can look back at final standings, picks, and your own results over time.</p>
      </Card>
    </div>
  );
}
