import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import NavBar from "./_components/NavBar";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "PGA Pool",
  description: "Daily-lineup golf pool: pick golfers each round, climb the leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07391F",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const user = await getUser();
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    isAdmin = !!data?.is_admin;
  }
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-body flex h-[100dvh] flex-col overflow-hidden">
        <header className="shrink-0 bg-pine text-sand border-b-4 border-trim pt-[env(safe-area-inset-top)]">
          <div className="max-w-5xl mx-auto px-4 py-2.5">
            <Link href="/" className="font-display text-xl tracking-wide">
              Masters <span className="text-trim">Pool</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <main className="max-w-5xl w-full mx-auto px-4 py-4 sm:py-6 pb-8">{children}</main>
        </div>
        {user && <NavBar isAdmin={isAdmin} />}
      </body>
    </html>
  );
}
