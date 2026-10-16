export function fmtPar(n: number | null | undefined): string {
  if (n === null || n === undefined) return "–";
  if (n === 0) return "E";
  return n > 0 ? `+${n}` : `${n}`;
}

export function parClass(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-ink/40";
  if (n < 0) return "text-azalea font-semibold";
  return "text-ink";
}
