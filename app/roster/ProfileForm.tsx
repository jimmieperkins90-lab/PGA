"use client";
import { useState, useTransition } from "react";
import { saveProfile } from "./actions";

export default function ProfileForm({ tournamentId, tournamentName }: { tournamentId: string; tournamentName: string }) {
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await saveProfile(tournamentId, fd);
          if (r.error) setErr(r.error);
        })
      }
      className="max-w-md mx-auto bg-white border border-pine/15 rounded-lg p-6 space-y-3"
    >
      <h1 className="font-display text-2xl text-pine">Join {tournamentName}</h1>
      <label htmlFor="display_name" className="block text-sm font-semibold">Name shown on the leaderboard</label>
      <input id="display_name" name="display_name" required maxLength={40} className="w-full border border-pine/30 rounded px-3 py-2" />
      <button disabled={pending} className="w-full bg-fairway text-white font-semibold rounded py-2 hover:bg-pine disabled:opacity-60">
        {pending ? "Joining…" : "Join the pool"}
      </button>
      {err && <p className="text-sm text-azalea">{err}</p>}
    </form>
  );
}
