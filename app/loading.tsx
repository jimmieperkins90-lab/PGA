export default function Loading() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      <div className="h-7 w-40 rounded bg-pine/15" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 rounded bg-pine/10" />
      ))}
    </div>
  );
}
