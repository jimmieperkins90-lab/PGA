"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createTournament, forceSync, setCutRule, setGolferStatus, setLockTimes, setPaymentNote } from "./actions";

type Result = { ok?: string; error?: string };
const init: Result = {};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="bg-fairway text-white text-sm font-semibold rounded px-3 py-2 hover:bg-pine disabled:opacity-60">
      {pending ? "Working…" : children}
    </button>
  );
}
function Note({ s }: { s: Result }) {
  if (s.error) return <p className="text-sm text-azalea" role="alert">{s.error}</p>;
  if (s.ok) return <p className="text-sm text-fairway">{s.ok}</p>;
  return null;
}

export function CreateForm() {
  const [s, action] = useFormState(createTournament, init);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="event_id" className="block text-sm font-semibold">ESPN event id</label>
      <div className="flex gap-2">
        <input id="event_id" name="event_id" required placeholder="e.g. 401850916" className="border border-pine/30 rounded px-3 py-2 flex-1" />
        <Submit>Create</Submit>
      </div>
      <Note s={s} />
    </form>
  );
}

export function LockForm({ tournamentId, values }: { tournamentId: string; values: string[] }) {
  const [s, action] = useFormState(setLockTimes.bind(null, tournamentId), init);
  return (
    <form action={action} className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <label key={n} className="text-sm">
            Round {n} first tee (ET)
            <input type="datetime-local" name={`r${n}`} defaultValue={values[n - 1]} required className="block w-full border border-pine/30 rounded px-2 py-1" />
          </label>
        ))}
      </div>
      <Submit>Save lock times</Submit>
      <Note s={s} />
    </form>
  );
}

export function SyncForm() {
  const [s, action] = useFormState(forceSync, init);
  return (
    <form action={action} className="space-y-2">
      <Submit>Sync scores now</Submit>
      <Note s={s} />
    </form>
  );
}

export function StatusForm({ golfers }: { golfers: { id: string; name: string; status: string }[] }) {
  const [s, action] = useFormState(setGolferStatus, init);
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select name="golfer_id" required className="border border-pine/30 rounded px-2 py-2 flex-1 min-w-[12rem]" aria-label="Golfer">
          <option value="">Select golfer</option>
          {golfers.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.status})</option>
          ))}
        </select>
        <select name="status" className="border border-pine/30 rounded px-2 py-2" aria-label="Status">
          <option value="active">active</option>
          <option value="cut">cut</option>
          <option value="wd">wd</option>
          <option value="dq">dq</option>
        </select>
        <Submit>Set status</Submit>
      </div>
      <Note s={s} />
    </form>
  );
}

export function CutForm({ tournamentId, mode, value }: { tournamentId: string; mode: string; value: number }) {
  const [s, action] = useFormState(setCutRule.bind(null, tournamentId), init);
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Cut rule
          <select name="mode" defaultValue={mode} className="block border border-pine/30 rounded px-2 py-2">
            <option value="percent">Cut the bottom % of entries</option>
            <option value="count">Cut a set number of entries</option>
            <option value="off">No cut</option>
          </select>
        </label>
        <label className="text-sm">
          Amount
          <input name="value" type="number" min={0} defaultValue={value} className="block w-24 border border-pine/30 rounded px-2 py-2" />
        </label>
        <Submit>Save cut rule</Submit>
      </div>
      <Note s={s} />
    </form>
  );
}

export function PaymentNoteForm({ tournamentId, note }: { tournamentId: string; note: string }) {
  const [s, action] = useFormState(setPaymentNote.bind(null, tournamentId), init);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="note" className="block text-sm font-semibold">Payment message shown to players</label>
      <div className="flex gap-2">
        <input
          id="note"
          name="note"
          defaultValue={note}
          maxLength={300}
          placeholder="e.g. $20 entry, send via Venmo @yourname before Round 1"
          className="flex-1 border border-pine/30 rounded px-3 py-2"
        />
        <Submit>Save</Submit>
      </div>
      <Note s={s} />
    </form>
  );
}
