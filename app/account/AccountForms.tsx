"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const input = "w-full border border-pine/30 rounded px-3 py-2";
const btn = "bg-fairway text-white text-sm font-semibold rounded px-4 py-2 hover:bg-pine disabled:opacity-60";

export default function AccountForms({ displayName, hasProfile }: { displayName: string; hasProfile: boolean }) {
  const [pw, setPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok?: string; err?: string }>({});
  const [name, setName] = useState(displayName);
  const [nameMsg, setNameMsg] = useState<{ ok?: string; err?: string }>({});
  const [busy, setBusy] = useState(false);

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg({});
    if (pw.length < 8) return setPwMsg({ err: "Use at least 8 characters." });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setPwMsg({ err: error.message });
    else {
      setPw("");
      setPwMsg({ ok: "Password saved. You can now sign in with your email and password." });
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg({});
    const clean = name.trim().slice(0, 40);
    if (!clean) return setNameMsg({ err: "Enter a display name." });
    setBusy(true);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ display_name: clean }).eq("user_id", u.user?.id ?? "");
    setBusy(false);
    setNameMsg(error ? { err: error.message } : { ok: "Name updated." });
  }

  const card = "bg-white border border-pine/15 rounded-lg p-4 space-y-3";
  return (
    <>
      {hasProfile && (
        <form onSubmit={saveName} className={card}>
          <h2 className="font-semibold">Display name</h2>
          <label htmlFor="dn" className="sr-only">Display name</label>
          <input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={input} />
          <button disabled={busy} className={btn}>Save name</button>
          {nameMsg.err && <p className="text-sm text-azalea" role="alert">{nameMsg.err}</p>}
          {nameMsg.ok && <p className="text-sm text-fairway">{nameMsg.ok}</p>}
        </form>
      )}
      <form onSubmit={savePassword} className={card}>
        <h2 className="font-semibold">Set or change password</h2>
        <label htmlFor="pw" className="sr-only">New password</label>
        <input
          id="pw"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={input}
          placeholder="New password (8+ characters)"
        />
        <button disabled={busy} className={btn}>Save password</button>
        {pwMsg.err && <p className="text-sm text-azalea" role="alert">{pwMsg.err}</p>}
        {pwMsg.ok && <p className="text-sm text-fairway">{pwMsg.ok}</p>}
      </form>
    </>
  );
}
