"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "link";

const input = "w-full border border-pine/30 rounded px-3 py-3";
const primary =
  "w-full min-h-[48px] bg-fairway text-white font-semibold rounded py-3 hover:bg-pine disabled:opacity-60";

function friendly(msg: string): string {
  if (/rate limit/i.test(msg))
    return "Too many sign-in emails were sent recently. Wait about an hour and try again, or sign in with your password.";
  return msg;
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  function switchTo(m: Mode) {
    setMode(m);
    setErr("");
    setNote("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    setBusy(true);
    const supabase = createClient();
    const cleanEmail = email.trim();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          setErr(
            error.message.toLowerCase().includes("invalid")
              ? "Email or password didn't match. New here? Create an account, or use an email link."
              : error.message
          );
        } else {
          router.replace("/roster");
          router.refresh();
        }
      } else if (mode === "signup") {
        if (password.length < 8) {
          setErr("Use at least 8 characters for your password.");
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
          if (error) setErr(friendly(error.message));
          else if (data.user && (data.user.identities?.length ?? 1) === 0) {
            setErr("That email already has an account. Sign in with your password, or tap “Forgot password?” to get an email link.");
          } else if (data.session) {
            router.replace("/roster");
            router.refresh();
          } else {
            setNote("Almost there: check your email and tap the confirmation link to finish creating your account.");
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) setErr(friendly(error.message));
        else setNote("Check your email for the sign-in link, then open it on this device.");
      }
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Sign in with email link";
  const button =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a sign-in link";

  return (
    <div>
      <h1 className="font-display text-2xl text-pine mb-4">{title}</h1>
      {mode === "link" && (
        <p className="text-sm text-ink/70 mb-3">
          We&apos;ll email you a link that signs you in. Once in, open Account to set a new password.
        </p>
      )}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            placeholder="you@example.com"
          />
        </div>
        {mode !== "link" && (
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
            />
            {mode === "signup" && <p className="text-xs text-ink/60 mt-1">At least 8 characters.</p>}
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => switchTo("link")}
                className="mt-1 py-2 text-sm text-fairway font-semibold underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}
        <button disabled={busy} className={primary}>{busy ? "One moment…" : button}</button>
        {err && <p className="text-sm text-azalea" role="alert">{err}</p>}
        {note && <p className="text-sm text-fairway font-semibold" role="status">{note}</p>}
      </form>

      <div className="mt-5 pt-4 border-t border-pine/10 text-sm space-y-2">
        {mode === "signin" && (
          <>
            <p>
              New here?{" "}
              <button type="button" onClick={() => switchTo("signup")} className="py-2 text-fairway font-semibold underline">
                Create an account
              </button>
            </p>
          </>
        )}
        {mode === "signup" && (
          <p>
            Already have an account?{" "}
            <button type="button" onClick={() => switchTo("signin")} className="py-2 text-fairway font-semibold underline">
              Sign in
            </button>
          </p>
        )}
        {mode === "link" && (
          <p>
            <button type="button" onClick={() => switchTo("signin")} className="py-2 text-fairway font-semibold underline">
              Back to password sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
