"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Asks the server to pull fresh scores (throttled to once a minute) and refreshes the page.
export default function LiveRefresher({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let stop = false;
    async function tick() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/sync", { cache: "no-store" });
        const j = await r.json();
        if (!stop && j.synced) router.refresh();
      } catch {}
    }
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [router, intervalMs]);
  return null;
}
