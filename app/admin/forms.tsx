"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createTournament, forceSync, setCutRule, setGolferStatus, setLockTimes, setPayouts, setPaymentNote } from "./actions";

type Result = { ok?: string; error?: string };
const init: Result = {};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="min-h-[44px] bg-fairway text-white text-sm font-semibold rounded px-4 py-2 hover:bg-pine disabled:opacity-60">
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
            <option value="percent">Top % of entries advance</option>
            <option value="count">Top number of entries advance</option>
            <option value="off">No cut</option>
          </select>
        </label>
        <label className="text-sm">
          Percent or number
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


const money = (n: number) =>
  "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const ord = (n: number) => {
  const x = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (x[(v - 20) % 10] || x[v] || x[0]);
};

export function PayoutForm({
  tournamentId,
  fee: feeIn,
  payouts,
  entries,
  paidEntries,
}: {
  tournamentId: string;
  fee: number | null;
  payouts: number[];
  entries: number;
  paidEntries: number;
}) {
  const [s, action] = useFormState(setPayouts.bind(null, tournamentId), init);
  const [fee, setFee] = useState(feeIn === null ? "" : String(feeIn));
  const [amts, setAmts] = useState<string[]>(payouts.map(String));
  const feeN = Number(fee) || 0;
  const pot = feeN * entries;
  const paid = amts.reduce((a, v) => a + (Number(v) || 0), 0);
  const diff = Math.round((pot - paid) * 100) / 100;
  const status =
    amts.length === 0
      ? { text: "No payouts set. Rules page shows TBD.", cls: "text-ink/70" }
      : feeN === 0
        ? { text: "Enter the entry fee to check the total.", cls: "text-ink/70" }
        : diff === 0
          ? { text: "Balanced: payouts match the pot exactly.", cls: "text-fairway" }
          : diff > 0
            ? { text: `${money(diff)} left to assign`, cls: "text-ink" }
            : { text: `Over by ${money(diff)}`, cls: "text-azalea" };
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-semibold">
        Entry fee per player
        <div className="mt-1 flex items-center gap-1">
          <span className="text-ink/60">$</span>
          <input
            name="fee"
            inputMode="decimal"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="20"
            className="w-28 border border-pine/30 rounded px-3 py-2"
          />
        </div>
      </label>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Places paid: {amts.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Remove a paid place"
              disabled={amts.length === 0}
              onClick={() => setAmts(amts.slice(0, -1))}
              className="min-h-[44px] min-w-[44px] rounded border border-pine/30 text-xl font-semibold disabled:opacity-30"
            >
              &minus;
            </button>
            <button
              type="button"
              aria-label="Add a paid place"
              disabled={amts.length >= 20}
              onClick={() => setAmts([...amts, ""])}
              className="min-h-[44px] min-w-[44px] rounded bg-fairway text-xl font-semibold text-white disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
        <ul className="mt-2 space-y-2">
          {amts.map((a, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-12 text-sm font-semibold text-pine">{ord(i + 1)}</span>
              <span className="text-ink/60">$</span>
              <input
                name="amount"
                inputMode="decimal"
                value={a}
                onChange={(e) => setAmts(amts.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="0"
                aria-label={`${ord(i + 1)} place payout`}
                className="w-28 border border-pine/30 rounded px-3 py-2"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border border-pine/15 bg-paper p-3 text-sm space-y-0.5">
        <div className="flex justify-between"><span>Entries ({paidEntries} paid)</span><span className="font-mono">{entries}</span></div>
        <div className="flex justify-between"><span>Total pot</span><span className="font-mono">{money(pot)}</span></div>
        <div className="flex justify-between"><span>Assigned to payouts</span><span className="font-mono">{money(paid)}</span></div>
        <div className={`flex justify-between border-t border-pine/10 pt-1 font-semibold ${status.cls}`}><span>{status.text}</span></div>
      </div>

      <Submit>Save payouts</Submit>
      <Note s={s} />
    </form>
  );
}
