export type ThemeName = "classic" | "masters";

// Masters is the standard look; an admin can switch a tournament to "classic".
export function resolveTheme(t: { name?: string | null; theme?: string | null } | null | undefined): ThemeName {
  return t?.theme === "classic" ? "classic" : "masters";
}

export function brandWords(theme: ThemeName): [string, string] {
  return theme === "masters" ? ["Masters", "Pool"] : ["PGA", "Pool"];
}
