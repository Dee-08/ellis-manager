import React, { useState } from "react";
import { api } from "./api";
import { useData, Load, Form, field } from "./workspace";
function dateInZone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}
function practiceDate(timeZone) {
  const { year, month, day } = dateInZone(timeZone);
  return `${year}-${month}-${day}`;
}
export function Schedule({ me }) {
  const [day, setDay] = useState(() => practiceDate(me.timezone)),
    [rev, setRev] = useState(0),
    [adding, setAdding] = useState(
      () => new URLSearchParams(location.search).get("new") === "1",
    ),
    [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(() => crypto.randomUUID());
  const [rows, e] = useData("/appointments?weekStart=" + day, rev);
  const [patients, patientError] = useData("/patients");
  const canManage = me.capabilities.includes("appointment.manage");
  const refresh = () => setRev((x) => x + 1);
  const format = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: me.timezone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const formatDay = (value) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: me.timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(value));
  const groups = (rows || []).reduce((result, appointment) => {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: me.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(appointment.starts_at));
    const last = result[result.length - 1];
    if (!last || last.key !== key)
      result.push({ key, date: appointment.starts_at, appointments: [] });
    result[result.length - 1].appointments.push(appointment);
    return result;
  }, []);
  async function checkIn(id) {
    setBusy(true);
    setError("");
    try {
      await api("/appointments/" + id + "/check-in", {});
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="work-heading">
        <div>
          <h1>Schedule</h1>
          <p>Times displayed in {me.timezone}. Seven-day list.</p>
        </div>
        {canManage && (
          <button
            className="button primary"
            onClick={() => {
              setAdding(true);
              setKey(crypto.randomUUID());
            }}
          >
            Book appointment
          </button>
        )}
      </div>
      <label>
          Week starting ({me.timezone})
        <input
          type="date"
          value={day}
          onChange={(e) => e.target.value && setDay(e.target.value)}
        />
      </label>
      {error && <Load error={error} />}
      {adding && (
        <Form
          title="Book appointment"
          submit="Book appointment"
          onCancel={() => setAdding(false)}
          onSave={async (b) => {
            await api("/appointments", {
              patientId: b.patientId,
              reason: b.reason,
              startsAt: new Date(b.startsAt).toISOString(),
              endsAt: new Date(b.endsAt).toISOString(),
              internalNote: b.internalNote,
              overrideOverlap: b.overrideOverlap === "on",
              key,
            });
            setAdding(false);
            refresh();
          }}
        >
          <label>
            Patient
            <select name="patientId" required>
              <option value="">Choose a patient</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.client_name}
                </option>
              ))}
            </select>
          </label>
          {patientError && <Load error={patientError} />}
          <p className="small">
            First 50 patients shown. Register patients in the patient directory.
          </p>
          {field("Reason", "reason", "", { required: true })}
          {field("Start (your device timezone)", "startsAt", "", {
            type: "datetime-local",
            required: true,
          })}
          {field("End (your device timezone)", "endsAt", "", {
            type: "datetime-local",
            required: true,
          })}
          {field("Internal note (optional)", "internalNote")}
          <label className="check">
            <input type="checkbox" name="overrideOverlap" /> Allow a reviewed
            overlap
          </label>
          <p>No clinician assignment is required.</p>
        </Form>
      )}
      {editing && (
        <Form
          key={editing.id}
          title="Change appointment"
          onCancel={() => setEditing(null)}
          onSave={async (b) => {
            await api(
              "/appointments/" + editing.id,
              {
                startsAt: new Date(b.startsAt).toISOString(),
                endsAt: new Date(b.endsAt).toISOString(),
                state: b.state,
                reason: b.reason,
                version: editing.version,
                overrideOverlap: b.overrideOverlap === "on",
              },
              "PATCH",
            );
            setEditing(null);
            refresh();
          }}
        >
          {field(
            "New start (your device timezone)",
            "startsAt",
            localTime(editing.starts_at),
            { type: "datetime-local", required: true },
          )}
          {field(
            "New end (your device timezone)",
            "endsAt",
            localTime(editing.ends_at),
            { type: "datetime-local", required: true },
          )}
          <label>
            State
            <select name="state" defaultValue={editing.state}>
              <option value="booked">Booked</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </select>
          </label>
          {field("Reason for change", "reason", "", { required: true })}
          <label className="check">
            <input type="checkbox" name="overrideOverlap" /> Allow a reviewed
            overlap
          </label>
        </Form>
      )}
      {!rows ? (
        <Load error={e} />
      ) : rows.length ? (
        <div className="schedule-groups">
          {groups.map((group) => (
            <section className="schedule-group" key={group.key}>
              <h2>{formatDay(group.date)}</h2>
              <div className="schedule-entries">
                {group.appointments.map((a) => (
                  <article className="schedule-entry" key={a.id}>
                    <time dateTime={a.starts_at}>{format(a.starts_at)}</time>
                    <div className="schedule-entry-copy">
                      <h3>{a.patient_name}</h3>
                      <p>{a.reason}</p>
                    </div>
                    <span className="state-label">
                      {a.state.replaceAll("_", " ")}
                    </span>
                    {canManage && a.state !== "arrived" && (
                      <div className="actions">
                        <button disabled={busy} onClick={() => setEditing(a)}>
                          Change
                        </button>
                        {["booked", "confirmed"].includes(a.state) && (
                          <button disabled={busy} onClick={() => checkIn(a.id)}>
                            Check in
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p>No appointments in this date range.</p>
      )}
    </>
  );
}
function localTime(value) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
