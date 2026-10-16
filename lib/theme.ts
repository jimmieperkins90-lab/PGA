export type ThemeName = "classic" | "masters";

// "auto" picks the Masters look whenever the active tournament's name contains "Masters".
export function resolveTheme(t: { name?: string | null; theme?: string | null } | null | undefined): ThemeName {
  if (t?.theme === "masters") return "masters";
  if (t?.theme === "classic") return "classic";
  return /masters/i.test(t?.name ?? "") ? "masters" : "classic";
}

export function brandWords(theme: ThemeName): [string, string] {
  return theme === "masters" ? ["Masters", "Pool"] : ["PGA", "Pool"];
}
