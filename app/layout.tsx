import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "PGA Pool",
  description: "Daily-lineup golf pool: pick golfers each round, climb the leaderboard.",
};

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    isAdmin = !!data?.is_admin;
  }
  const link = "px-3 py-2 rounded text-sm font-semibold hover:bg-white/10 transition-colors";
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <header className="bg-pine text-sand border-b-4 border-azalea">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <Link href="/" className="font-display text-xl tracking-wide">
              PGA <span className="text-azalea">Pool</span>
            </Link>
            {user && (
              <nav className="flex items-center gap-1">
                <Link href="/" className={link}>Leaderboard</Link>
                <Link href="/roster" className={link}>My Roster</Link>
                {isAdmin && <Link href="/admin" className={link}>Admin</Link>}
                <form action={signOut}>
                  <button className={link}>Sign out</button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
