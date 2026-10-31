import React, { useState } from "react";
import { api } from "./api";
export function PracticeConversion({ me, reload }) {
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (me.kind !== "personal" || !me.is_owner) return null;
  return (
    <section className="notice">
      <h3>Practice type</h3>
      <p>Personal practice</p>
      {!open ? (
        <button className="button secondary" onClick={() => setOpen(true)}>
          Switch to a clinic
        </button>
      ) : (
        <form
          className="work-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("/workspace/convert", {
                name,
                version: me.account_version,
                confirmed: true,
              });
              setOpen(false);
              reload();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Confirm your switch to a clinic</h3>
          <p>
            Your patients, records and practice address ({me.slug}) stay with
            this practice. Team features become available. Inviting staff is
            optional. There is no billing change.
          </p>
          <label>
            Clinic name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="actions">
            <button className="button primary" disabled={busy}>
              {busy ? "Switching…" : "Confirm switch to clinic"}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
