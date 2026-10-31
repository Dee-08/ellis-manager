import { PracticeConversion } from "./practice-conversion";
import React, { useState } from "react";
import { api } from "./api";
import { Form, field, useData, Load, Pager } from "./workspace";
const labels = {
  "appointment.view": "View appointments",
  "appointment.manage": "Book, change and check in appointments",
  "patients.view": "View patients",
  "patients.edit": "Edit patient demographics",
  "notes.view": "View clinical notes",
  "notes.draft": "Write clinical notes",
  "notes.sign": "Sign and amend notes",
  "visits.manage": "Manage visits",
  "tasks.team": "View team tasks",
  "tasks.create": "Create tasks and offer handovers",
  "tasks.complete": "Complete assigned work",
  "tasks.reassign": "Reassign work",
  "staff.manage": "Manage staff and permissions",
  "audit.view": "View audit history",
  "settings.manage": "Manage practice settings",
  "data.export": "Export data",
};
export function Team({ me }) {
  const [rev, setRev] = useState(0),
    [adding, setAdding] = useState(false),
    [editing, setEditing] = useState(null),
    [delivery, setDelivery] = useState(""),
    [caps, setCaps] = useState([]);
  const [people, e] = useData("/team", rev);
  const refresh = () => setRev((x) => x + 1);
  if (me.kind !== "clinic" || !me.capabilities.includes("staff.manage"))
    return <p className="error">You do not have permission to manage staff.</p>;
  return (
    <>
      <div className="work-heading">
        <div>
          <span className="eyebrow">
            Individual credentials. Clear permissions.
          </span>
          <h1>Your team</h1>
          <p>Titles describe a person. Permissions determine access.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setAdding(true);
            setCaps([]);
            setEditing(null);
          }}
        >
          Add staff +
        </button>
      </div>
      {(adding || editing) && (
        <Form
          key={editing?.id || "new"}
          title={editing ? "Edit permissions" : "Add staff"}
          submit={editing ? "Save permissions" : "Send invitation"}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={async (b) => {
            const result = editing
              ? await api(
                  "/team/" + editing.id,
                  {
                    title: b.title,
                    capabilities: caps,
                    version: editing.auth_version,
                  },
                  "PATCH",
                )
              : await api("/invitations", {
                  email: b.email,
                  title: b.title,
                  capabilities: caps,
                });
            if (result.delivery)
              setDelivery(
                result.delivery === "local_mailbox"
                  ? "Invitation written to the private local development mailbox. No email was sent."
                  : "Invitation sent.",
              );
            refresh();
            setAdding(false);
            setEditing(null);
          }}
        >
          {!editing && (
            <>
              {field("Email", "email", "", { required: true, type: "email" })}
            </>
          )}
          {field("Title (optional)", "title", editing?.title || "")}
          <fieldset>
            <legend>Permissions</legend>
            {me.capabilities.map((c) => (
              <label className="check" key={c}>
                <input
                  type="checkbox"
                  checked={caps.includes(c)}
                  onChange={(e) =>
                    setCaps(
                      e.target.checked
                        ? [...caps, c]
                        : caps.filter((x) => x !== c),
                    )
                  }
                />
                {labels[c]}
              </label>
            ))}
          </fieldset>
          <p className="access-summary">
            Access summary:{" "}
            {caps.length
              ? caps.map((c) => labels[c]).join("; ")
              : "No clinical or practice permissions selected."}
          </p>
          <p className="small">
            The clinic controls clinical capability grants. Administration does
            not verify professional qualifications.
          </p>
        </Form>
      )}
      {delivery && <p role="status">{delivery}</p>}
      {!people ? (
        <Load error={e} />
      ) : (
        people.map((p) => (
          <article className="team-person" key={p.id}>
            <div>
              <h3>
                {p.name} {p.is_owner ? "· Owner" : ""}
              </h3>
              <p>
                {p.title || "No title specified"} · {p.email}
              </p>
              <small>
                {p.status} · {p.open_work} open tasks
              </small>
            </div>
            {!p.is_owner && p.id !== me.id && (
              <div className="actions">
                <button
                  onClick={() => {
                    setEditing(p);
                    setCaps(p.capabilities);
                    setAdding(false);
                  }}
                >
                  Edit permissions
                </button>
                <details>
                  <summary>Revoke access</summary>
                  <Form
                    title="Revoke and escalate open work"
                    submit="Revoke access"
                    onSave={async (b) => {
                      await api("/team/" + p.id + "/disable", {
                        reason: b.reason,
                        reviewed: b.reviewed === "on",
                        version: p.auth_version,
                      });
                      refresh();
                    }}
                  >
                    {field("Reason", "reason", "", { required: true })}
                    <label className="check">
                      <input name="reviewed" type="checkbox" required />I
                      reviewed the open work. Escalate unfinished tasks to the
                      clinic owner and invalidate access now.
                    </label>
                  </Form>
                </details>
              </div>
            )}
          </article>
        ))
      )}
    </>
  );
}
export function Settings({ me, reload }) {
  const [people] = useData("/people");
  return (
    <>
      <div className="work-heading">
        <div>
          <span className="eyebrow">Your independent account</span>
          <h1>Settings</h1>
        </div>
      </div>
      <p>
        Practice code: <strong>{me.slug}</strong> · {me.kind}
      </p>
      {me.capabilities.includes("settings.manage") && (
        <Form
          title="Practice details"
          onSave={async (b) => {
            await api(
              "/settings",
              { ...b, version: me.account_version },
              "PATCH",
            );
            reload();
          }}
        >
          {field("Practice name", "name", me.practice_name, { required: true })}
          {field("Timezone", "timezone", me.timezone, { required: true })}
        </Form>
      )}
      {me.capabilities.includes("data.export") && (
        <section className="notice">
          <h3>Export records</h3>
          <p>
            Each file contains up to 500 records and a nextOffset for further
            pages. Store exports securely.
          </p>
          <div className="actions">
            {[
              "patients",
              "clients",
              "visits",
              "notes",
              "tasks",
              "contact_attempts",
              "audit_events",
            ].map((type) => (
              <a key={type} href={"/api/export?type=" + type}>
                {type.replaceAll("_", " ")} ↗
              </a>
            ))}
          </div>
        </section>
      )}
      <section className="notice">
        <h3>Development release</h3>
        <p>
          Use synthetic data while these workflows are being verified. Reviewed
          privacy/retention policies and production backup arrangements must be
          completed before real patient use.
        </p>
      </section>
      <PracticeConversion me={me} reload={reload} />
      {me.kind === "clinic" && me.is_owner && (
        <details>
          <summary>Transfer clinic ownership</summary>
          <Form
            title="Transfer ownership to active staff"
            submit="Transfer ownership and sign out"
            onSave={async (b) => {
              await api("/ownership/transfer", b);
              location.href = "/sign-in";
            }}
          >
            <label>
              New owner
              <select name="toId" required>
                <option value="">Choose staff member</option>
                {people
                  ?.filter((p) => p.id !== me.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            {field("Enter practice code to confirm", "confirmation", "", {
              required: true,
            })}
            <p className="small">
              Administrative permissions are granted to the new owner. Clinical
              permissions remain separate. Both accounts must sign in again.
            </p>
          </Form>
        </details>
      )}
    </>
  );
}
export function Activity() {
  const [offset, setOffset] = useState(0);
  const [events, error] = useData("/audit?offset=" + offset);
  return (
    <>
      <div className="work-heading">
        <div>
          <span className="eyebrow">Who changed what</span>
          <h1>Activity</h1>
        </div>
      </div>
      {!events ? (
        <Load error={error} />
      ) : (
        <>
          <div className="record-list">
            {events.map((e) => (
              <div className="audit-row" key={e.id}>
                <strong>{e.action.replaceAll(".", " ")}</strong>
                <span>{e.actor_name}</span>
                <time>{new Date(e.created_at).toLocaleString()}</time>
              </div>
            ))}
          </div>
          <Pager offset={offset} setOffset={setOffset} count={events.length} />
        </>
      )}
    </>
  );
}
