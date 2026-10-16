"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, React.ReactNode> = {
  board: <path d="M5 20v-9M12 20V5M19 20v-7" />,
  roster: <path d="M9 6h11M9 12h11M9 18h11M4 6.5l1 1 2-2M4 12.5l1 1 2-2M4 18.5l1 1 2-2" />,
  past: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  admin: (
    <>
      <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
};

export default function NavBar({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname() || "/";
  const tabs = [
    { href: "/", label: "Leaderboard", icon: "board", active: path === "/" },
    { href: "/roster", label: "My Roster", icon: "roster", active: path.startsWith("/roster") },
    { href: "/tournaments", label: "Past", icon: "past", active: path.startsWith("/tournaments") },
    { href: "/account", label: "Account", icon: "account", active: path.startsWith("/account") },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "admin", active: path.startsWith("/admin") }] : []),
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 inset-x-0 z-40 bg-pine text-sand border-t-4 border-azalea pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="max-w-5xl mx-auto flex">
        {tabs.map((t) => (
          <li key={t.href} className="flex-1 min-w-0">
            <Link
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
                t.active ? "bg-white/10 text-white" : "text-sand/70 hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ICONS[t.icon]}
              </svg>
              <span className="truncate max-w-full">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
