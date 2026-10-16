// Converts a datetime-local value ("2027-04-08T08:00") entered as Eastern Time into an ISO instant.
export function etToIso(local: string): string | null {
  if (!local) return null;
  const hh = local.slice(11, 13);
  for (const off of ["-04:00", "-05:00"]) {
    const d = new Date(`${local}:00${off}`);
    if (isNaN(d.getTime())) return null;
    const hour = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }).format(d);
    if (hour.replace("24", "00").padStart(2, "0") === hh) return d.toISOString();
  }
  return null;
}

export function isoToEtLocal(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
  return parts.replace(" ", "T");
}
