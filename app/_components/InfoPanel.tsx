export default function InfoPanel({ cutText, live }: { cutText: string; live: boolean }) {
  return (
    <details className="group relative">
      <summary className="list-none cursor-pointer inline-flex items-center gap-1 rounded border border-pine/25 bg-white px-3 py-1 text-sm font-semibold text-pine hover:bg-sand [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-pine text-sand text-[11px] leading-none">i</span>
        Info
      </summary>
      <div className="mt-2 w-full max-w-xl rounded-lg border border-pine/15 bg-white p-4 text-sm text-ink/80 space-y-3 shadow-sm">
        <div>
          <h3 className="font-semibold text-pine">How scoring works</h3>
          <p>
            Each pick counts the golfer&apos;s score to par in the round you used them. Lowest combined total wins.
            A golfer&apos;s round score is final once the round is complete.
            {live ? " Scores refresh about once a minute while play is on." : ""}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-pine">The cut</h3>
          <p>{cutText}</p>
        </div>
        <div>
          <h3 className="font-semibold text-pine">Ties</h3>
          <p>
            During play, tied players share a place (shown as T). Final places are broken by, in order: most holes under par,
            fewest holes over par, best single round by any of your golfers, then best worst round.
          </p>
        </div>
      </div>
    </details>
  );
}
