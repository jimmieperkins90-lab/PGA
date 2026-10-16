"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState("error");
      setMsg(error.message);
    } else {
      setState("sent");
    }
  }

  if (state === "sent")
    return <p className="text-pine font-semibold">Check your email for the sign-in link, then open it on this device.</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-semibold" htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-pine/30 rounded px-3 py-2"
        placeholder="you@example.com"
      />
      <button
        disabled={state === "sending"}
        className="w-full bg-fairway text-white font-semibold rounded py-2 hover:bg-pine disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state === "error" && <p className="text-sm text-azalea">{msg}</p>}
    </form>
  );
}
