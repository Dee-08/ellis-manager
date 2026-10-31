import React, { useEffect, useState } from "react";
import { api } from "./api";
import { Schedule } from "./schedule";
import { Team, Settings, Activity } from "./team";
export const field = (label, name, value = "", props = {}) => (
  <label key={name}>
    {label}
    <input name={name} defaultValue={value} {...props} />
  </label>
);
export function Form({ title, onSave, children, submit = "Save", onCancel }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <form
      className="work-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setDone(false);
        setError("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          await onSave(data);
          setDone(true);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{title}</h3>
      {children}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="success" role="status">
          Saved.
        </p>
      )}
      <div className="actions">
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : submit}
        </button>
        {onCancel && (
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
export function useData(path, revision = 0) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api(path)
      .then((v) => {
        if (active) {
          setData(v);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return [data, error];
}
export function Load({ error }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : (
    <p role="status">Loading…</p>
  );
}
export function Pager({ offset, setOffset, count }) {
  return (
    <div className="pagination">
      <button
        disabled={!offset}
        onClick={() => setOffset(Math.max(0, offset - 50))}
      >
        Previous
      </button>
      <span>Page {offset / 50 + 1}</span>
      <button disabled={count < 50} onClick={() => setOffset(offset + 50)}>
        Next
      </button>
    </div>
  );
}
export function Workspace() {
  const [revision, setRevision] = useState(0),
    [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [me, error] = useData("/me", revision);
  const [workspaces] = useData("/workspaces");
  const section = location.pathname.split("/")[2] || "today";
  if (!me)
    return (
      <main className="section">
        <Load error={error} />
        {error && <a href="/sign-in">Sign in to continue</a>}
      </main>
    );
  const can = (c) => me.capabilities.includes(c);
  const personal = me.kind === "personal";
  const nav = [
    ["today", "Today"],
    ...(can("appointment.view")
      ? [["schedule", personal ? "My schedule" : "Schedule"]]
      : []),
    ...(can("patients.view")
      ? [["patients", personal ? "My patients" : "Patients"]]
      : []),
    ["tasks", personal ? "My tasks" : "Tasks"],
    ["follow-ups", personal ? "My follow-ups" : "Follow-ups"],
    ["settings", "Settings"],
    ...(me.kind === "clinic" && can("staff.manage") ? [["team", "Team"]] : []),
    ...(can("audit.view") ? [["audit", "Activity"]] : []),
  ];
  return (
    <div className="workspace">
      <a className="skip" href="#work-main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a href="/" aria-label="Ellis home">
          <img
            src="/brand/ellis-reverse.svg"
            width="160"
            height="52"
            alt="Ellis"
          />
        </a>
        <p className="practice-name">
          {me.practice_name}
          <small>{me.kind === "clinic" ? "Clinic" : "Personal practice"}</small>
        </p>
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-expanded={mobileNavOpen}
          aria-controls="practice-navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? "Close navigation" : "Practice menu"}
        </button>
        <nav
          id="practice-navigation"
          className={mobileNavOpen ? "is-open" : ""}
          aria-label="Practice"
        >
          {nav.map(([key, label]) => (
            <a
              key={key}
              className={section === key ? "selected" : ""}
              href={"/app/" + key}
              aria-current={section === key ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="identity">
          <strong>{me.name}</strong>
          <small>{me.title || "Your practice account"}</small>
          {workspaces?.length > 1 && (
            <a href="/workspaces">Switch practice</a>
          )}
          <Signout />
        </div>
      </aside>
      <main id="work-main" className="work-main">
        <div className="work-top">
          <a href="/app/today" aria-label={me.practice_name + " Today"}>
            {me.practice_name}
          </a>
          <span>
            {new Intl.DateTimeFormat("en-GB", {
              timeZone: me.timezone,
              dateStyle: "full",
            }).format(new Date())}
          </span>
        </div>
        <p className="pilot">
          Development · Use synthetic records until release checks are complete.
        </p>
        {error && <Load error={error} />}
        {section === "schedule" ? (
          <Schedule me={me} />
        ) : section === "patients" ? (
          <Patients me={me} />
        ) : section === "team" ? (
          <Team me={me} />
        ) : section === "settings" ? (
          <Settings me={me} reload={() => setRevision((v) => v + 1)} />
        ) : section === "audit" ? (
          <Activity />
        ) : section === "today" ? (
          <Today me={me} />
        ) : ["tasks", "follow-ups"].includes(section) ? (
          <Tasks me={me} section={section} />
        ) : (
          <h1>Page not found.</h1>
        )}
      </main>
    </div>
  );
}
function Signout() {
  const [e, setE] = useState("");
  return (
    <>
      <button
        onClick={async () => {
          try {
            await api("/auth/logout", {});
            location.href = "/sign-in";
          } catch (err) {
            setE(err.message);
          }
        }}
      >
        Sign out
      </button>
      {e && <p role="alert">{e}</p>}
    </>
  );
}
function Patients({ me }) {
  const [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [offset, setOffset] = useState(0),
    [rev, setRev] = useState(0),
    [adding, setAdding] = useState(
      () => new URLSearchParams(location.search).get("new") === "1",
    ),
    [selected, setSelected] = useState(
      () => new URLSearchParams(location.search).get("patient"),
    );
  const [patients, error] = useData(
    "/patients?q=" + encodeURIComponent(search) + "&offset=" + offset,
    rev,
  );
  const [clients] = useData("/clients?q=" + encodeURIComponent(search), rev);
  const refresh = () => setRev((v) => v + 1);
  if (selected)
    return (
      <Patient
        id={selected}
        me={me}
        back={() => {
          setSelected(null);
          history.replaceState(null, "", location.pathname);
          refresh();
        }}
      />
    );
  return (
    <>
      <div className="work-heading">
        <div>
          <span className="eyebrow">People and patients</span>
          <h1>Patients</h1>
        </div>
        {me.capabilities.includes("patients.edit") && (
          <button className="button primary" onClick={() => setAdding(!adding)}>
            Register patient +
          </button>
        )}
      </div>
      {adding && (
        <Form
          title="Register a patient"
          submit="Register patient"
          onCancel={() => setAdding(false)}
          onSave={async (data) => {
            const b = { ...data };
            if (!b.clientId) delete b.clientId;
            if (b.clientId) delete b.clientName;
            const p = await api("/patients", b);
            setSelected(p.id);
            setAdding(false);
            refresh();
          }}
        >
          <p className="small">
            Search first for possible duplicates. Similar names are never merged
            automatically.
          </p>
          {field("Patient name", "name", "", {
            required: true,
            maxLength: 120,
          })}
          {field("Species", "species", "", { required: true, maxLength: 120 })}
          {field("Breed (optional)", "breed")}
          {field("Age or estimated age (optional)", "age")}
          <label>
            Sex
            <select name="sex">
              <option value="unknown">Unknown</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label>
            Animal owner
            <select name="clientId">
              <option value="">Register a new animal owner</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {field("New animal owner name", "clientName")}
          {field("Phone (optional)", "phone")}
          {field("Email (optional)", "email", "", { type: "email" })}
        </Form>
      )}
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
          setOffset(0);
        }}
      >
        <label>
          Search patients or animal owners
          <input value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button className="button secondary">Search</button>
      </form>
      {!patients ? (
        <Load error={error} />
      ) : (
        <>
          {error && <Load error={error} />}
          <div className="record-list">
            {patients.length ? (
              patients.map((p) => (
                <button
                  className="patient-row"
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                >
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.species}
                      {p.breed ? " · " + p.breed : ""}
                    </small>
                  </span>
                  <span>{p.client_name}</span>
                  <span>Open record ↗</span>
                </button>
              ))
            ) : (
              <div className="empty">
                <h3>
                  {search
                    ? "No matching patients."
                    : "A clear start for your practice."}
                </h3>
                <p>
                  {search
                    ? "Try a patient or animal owner’s name."
                    : "Register your first patient when you are ready."}
                </p>
              </div>
            )}
          </div>
          <Pager
            offset={offset}
            setOffset={setOffset}
            count={patients.length}
          />
        </>
      )}
    </>
  );
}
function Patient({ id, me, back }) {
  const [rev, setRev] = useState(0),
    [mode, setMode] = useState(""),
    [error, setError] = useState("");
  const [p, e] = useData("/patients/" + id, rev);
  const can = (c) => me.capabilities.includes(c);
  const refresh = () => setRev((v) => v + 1);
  async function run(fn) {
    try {
      setError("");
      await fn();
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }
  if (!p) return <Load error={e} />;
  return (
    <>
      <button className="back-link" onClick={back}>
        ← Patients
      </button>
      <button className="button secondary" onClick={refresh}>
        Refresh record to compare changes
      </button>
      <div className="work-heading">
        <div>
          <span className="eyebrow">Patient record</span>
          <h1>{p.name}</h1>
          <p>
            {p.species} · {p.breed || "Breed not recorded"} ·{" "}
            {p.age || "Age unknown"}
          </p>
        </div>
        {can("visits.manage") && (
          <button
            className="button primary"
            onClick={() => run(() => api("/visits", { patientId: id }))}
          >
            Start visit +
          </button>
        )}
      </div>
      {error && <Load error={error} />}
      <div className="patient-context">
        <div>
          <span className="eyebrow">Animal owner</span>
          <h3>{p.client.name}</h3>
          <p>{p.client.phone || "No phone recorded"}</p>
          <p>{p.client.email}</p>
        </div>
        <div>
          <span className="eyebrow">Patient details</span>
          <p>Sex: {p.sex}</p>
          {can("patients.edit") && (
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setMode("patient")}
              >
                Edit patient
              </button>
              <button
                className="button secondary"
                onClick={() => setMode("client")}
              >
                Edit owner contact
              </button>
            </div>
          )}
        </div>
      </div>
      {mode === "patient" && (
        <Form
          title="Edit patient"
          onCancel={() => setMode("")}
          onSave={async (b) => {
            await api("/patients/" + id, { ...b, version: p.version }, "PATCH");
            refresh();
            setMode("");
          }}
        >
          {field("Patient name", "name", p.name, { required: true })}
          {field("Species", "species", p.species, { required: true })}
          {field("Breed", "breed", p.breed)}
          {field("Age or estimated age", "age", p.age)}
          <label>
            Sex
            <select name="sex" defaultValue={p.sex}>
              <option value="unknown">Unknown</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
        </Form>
      )}
      {mode === "client" && (
        <Form
          title="Edit animal owner"
          onCancel={() => setMode("")}
          onSave={async (b) => {
            await api(
              "/clients/" + p.client.id,
              { ...b, version: p.client.version },
              "PATCH",
            );
            refresh();
            setMode("");
          }}
        >
          {field("Owner name", "name", p.client.name, { required: true })}
          {field("Phone", "phone", p.client.phone)}
          {field("Email", "email", p.client.email, { type: "email" })}
        </Form>
      )}
      <h2 className="subheading">Visits and coordination notes</h2>
      <p className="small">
        Keep the authoritative clinical record in your existing system. These
        notes support coordination.
      </p>
      {p.visits.length ? (
        p.visits.map((v) => (
          <Visit
            key={v.id}
            v={v}
            notes={p.notes.filter((n) => n.visit_id === v.id)}
            me={me}
            refresh={refresh}
            run={run}
          />
        ))
      ) : (
        <div className="empty">
          <h3>No visits yet.</h3>
          <p>Start a visit to begin the care journey.</p>
        </div>
      )}
    </>
  );
}
function Visit({ v, notes, me, refresh, run }) {
  const [note, setNote] = useState(null),
    [state, setState] = useState(""),
    [task, setTask] = useState(false);
  const can = (c) => me.capabilities.includes(c);
  return (
    <article className="visit">
      <div className="visit-heading">
        <h3>
          {new Date(v.arrived_at).toLocaleString("en-GB", {
            timeZone: me.timezone,
          })}
        </h3>
        <span className="status">{v.state.replaceAll("_", " ")}</span>
      </div>
      <p className="small">Responsible: {v.responsible_name}</p>
      <div className="actions">
        {can("visits.manage") && (
          <>
            {["waiting", "ended"].includes(v.state) && (
              <button
                className="button secondary"
                onClick={() => setState("in_consultation")}
              >
                {v.state === "ended" ? "Reopen visit" : "Begin consultation"}
              </button>
            )}
            {!["ended", "cancelled"].includes(v.state) && (
              <>
                <button
                  className="button secondary"
                  onClick={() => setState("ended")}
                >
                  End visit
                </button>
                <button
                  className="button secondary"
                  onClick={() => setState("cancelled")}
                >
                  Cancel visit
                </button>
              </>
            )}
          </>
        )}
        {can("notes.draft") && (
          <button className="button secondary" onClick={() => setNote({})}>
            Add coordination note
          </button>
        )}
        {can("tasks.create") && (
          <button className="button secondary" onClick={() => setTask(!task)}>
            Add outstanding work
          </button>
        )}
      </div>
      {state && (
        <Form
          title={
            state === "ended"
              ? "End visit — outstanding work stays open"
              : "Update visit"
          }
          submit="Confirm visit status"
          onCancel={() => setState("")}
          onSave={async (b) => {
            await api("/visits/" + v.id + "/state", {
              state,
              version: v.version,
              reason: b.reason,
            });
            setState("");
            refresh();
          }}
        >
          {field("Reason (required when reopening or cancelling)", "reason")}
        </Form>
      )}
      {task && (
        <TaskForm
          patientId={v.patient_id}
          visitId={v.id}
          close={() => setTask(false)}
          refresh={refresh}
        />
      )}
      {note && (
        <Form
          title={
            note.amendsId
              ? "Amend signed note"
              : note.id
                ? "Edit draft"
                : "Coordination note"
          }
          onCancel={() => setNote(null)}
          onSave={async (b) => {
            if (note.id)
              await api(
                "/notes/" + note.id,
                { content: b.content, version: note.version },
                "PATCH",
              );
            else
              await api("/notes", {
                visitId: v.id,
                content: b.content,
                ...(note.amendsId
                  ? { amendsId: note.amendsId, reason: b.reason }
                  : {}),
              });
            setNote(null);
            refresh();
          }}
        >
          <label>
            Note
            <textarea
              name="content"
              required
              maxLength="12000"
              defaultValue={note.content || ""}
            />
          </label>
          {note.amendsId &&
            field("Amendment reason", "reason", "", { required: true })}
        </Form>
      )}
      {notes.map((n) => (
        <div className="note" key={n.id}>
          <div className="note-meta">
            <strong>{n.author_name}</strong>
            <span>
              {n.state} ·{" "}
              {new Date(n.signed_at || n.created_at).toLocaleString("en-GB", {
                timeZone: me.timezone,
              })}
            </span>
          </div>
          {n.amends_id && <p className="small">Amendment · {n.reason}</p>}
          <p className="note-content">{n.content}</p>
          <div className="actions">
            {n.state === "draft" && n.author_id === me.id && (
              <>
                {can("notes.draft") && (
                  <button onClick={() => setNote(n)}>Edit draft</button>
                )}
                {can("notes.sign") && (
                  <button
                    onClick={() =>
                      run(() =>
                        api("/notes/" + n.id + "/sign", { version: n.version }),
                      )
                    }
                  >
                    Sign note
                  </button>
                )}
              </>
            )}
            {n.state === "signed" &&
              can("notes.sign") &&
              can("notes.draft") && (
                <button onClick={() => setNote({ amendsId: n.id })}>
                  Add amendment
                </button>
              )}
          </div>
        </div>
      ))}
    </article>
  );
}
function TaskForm({ patientId, visitId, close, refresh }) {
  return (
    <Form
      title="Add outstanding work"
      onCancel={close}
      submit="Create task"
      onSave={async (b) => {
        await api("/tasks", {
          action: b.action,
          kind: b.kind,
          dueAt: b.dueAt ? new Date(b.dueAt).toISOString() : null,
          ...(patientId ? { patientId } : {}),
          ...(visitId ? { visitId } : {}),
        });
        refresh();
        close();
      }}
    >
      {field("Action", "action", "", { required: true, maxLength: 120 })}
      <label>
        Kind
        <select name="kind">
          <option value="task">Task</option>
          <option value="follow_up">Follow-up</option>
        </select>
      </label>
      {field("Due at (your device timezone; optional)", "dueAt", "", {
        type: "datetime-local",
      })}
    </Form>
  );
}
function Tasks({ me, section }) {
  const [rev, setRev] = useState(0),
    [offset, setOffset] = useState(0),
    [adding, setAdding] = useState(false),
    [selected, setSelected] = useState(
      () => new URLSearchParams(location.search).get("task"),
    ),
    [filter, setFilter] = useState("open"),
    [error, setError] = useState("");
  const [tasks, e] = useData(
    "/tasks?offset=" +
      offset +
      "&view=" +
      filter +
      "&kind=" +
      (section === "follow-ups" ? "follow_up" : "all"),
    rev,
  );
  const [handovers] = useData("/handovers", rev);
  const refresh = () => setRev((v) => v + 1);
  const can = (c) => me.capabilities.includes(c);
  async function decide(h, decision) {
    try {
      await api("/handovers/" + h.id + "/decide", { decision });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }
  const shown = tasks;
  return (
    <>
      <div className="work-heading">
        <div>
          <span className="eyebrow">Keep the next step in sight</span>
          <h1>
            {section === "today"
              ? "Today"
              : section === "follow-ups"
                ? "Follow-ups"
                : "Tasks"}
          </h1>
          <p>
            {section === "today"
              ? "What needs attention, and who is looking after it."
              : "Responsibility stays clear until the work is complete."}
          </p>
        </div>
        {can("tasks.create") && (
          <button className="button primary" onClick={() => setAdding(!adding)}>
            Add task +
          </button>
        )}
      </div>
      {adding && <TaskForm close={() => setAdding(false)} refresh={refresh} />}
      {error && <Load error={error} />}
      <div className="filter-bar">
        <label>
          Show
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setOffset(0);
            }}
          >
            <option value="open">Outstanding work</option>
            <option value="mine">My work</option>
            <option value="today">Due today (practice timezone)</option>
            <option value="all">All statuses</option>
          </select>
        </label>
        <button className="button secondary" onClick={refresh}>
          Refresh
        </button>
      </div>
      {handovers?.length > 0 && (
        <section className="handover-list">
          <h3>Pending handovers</h3>
          {handovers.map((h) => (
            <div key={h.id}>
              <p>
                {h.action} · {h.from_name} → {h.to_name}
              </p>
              <small>Current owner remains accountable until accepted.</small>
              {h.to_id === me.id && (
                <div className="actions">
                  <button onClick={() => decide(h, "accepted")}>Accept</button>
                  <button onClick={() => decide(h, "declined")}>Decline</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
      {!tasks ? (
        <Load error={e} />
      ) : (
        <>
          {e && <Load error={e} />}
          <div className="task-list">
            <div className="task-list-title">
              <h2>{filter === "all" ? "All work" : "Needs attention"}</h2>
              <span>{shown.length} on this page</span>
            </div>
            {shown.length ? (
              shown.map((t) => (
                <button
                  className="task-row"
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                >
                  <span>
                    <strong>{t.action}</strong>
                    <small>
                      {t.patient_name || "Practice task"} ·{" "}
                      {t.kind === "follow_up" ? "Follow-up" : "Task"}
                    </small>
                    {t.reason && <small>{t.reason}</small>}
                  </span>
                  <span>
                    <small>Accountable</small>
                    {t.owner_name}
                  </span>
                  <span className={t.overdue ? "overdue" : ""}>
                    <small>{t.overdue ? "Overdue" : "Due"}</small>
                    {t.due_at
                      ? new Date(t.due_at).toLocaleString("en-GB", {
                          timeZone: me.timezone,
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "No deadline"}
                  </span>
                  <span className="status">
                    {t.status.replaceAll("_", " ")}
                  </span>
                </button>
              ))
            ) : (
              <div className="empty">
                <span className="eyebrow">Room for the next step</span>
                <h3>No work in this view.</h3>
                <p>
                  Add a meaningful action when there is something to follow
                  through.
                </p>
                {can("patients.view") && (
                  <a href="/app/patients">Go to patients ↗</a>
                )}
              </div>
            )}
          </div>
          <Pager offset={offset} setOffset={setOffset} count={tasks.length} />
        </>
      )}
      {selected && (
        <TaskDetail
          key={selected}
          taskId={selected}
          me={me}
          refresh={refresh}
          close={() => {
            setSelected(null);
            history.replaceState(null, "", location.pathname);
          }}
        />
      )}
    </>
  );
}
function TaskDetail({ taskId, me, refresh, close }) {
  const [rev, setRev] = useState(0),
    [mode, setMode] = useState("state");
  const [t, error] = useData("/tasks/" + taskId, rev);
  const [people] = useData("/people");
  const done = () => {
    setRev((x) => x + 1);
    refresh();
  };
  if (!t) return <Load error={error} />;
  const can = (c) => me.capabilities.includes(c);
  return (
    <section className="task-detail">
      <button className="back-link" onClick={close}>
        Close task details ×
      </button>
      <button className="button secondary" onClick={() => setRev((x) => x + 1)}>
        Refresh record to compare changes
      </button>
      <h2>{t.action}</h2>
      <p className="small">
        Version {t.version} · {t.status.replaceAll("_", " ")}
      </p>
      <div className="actions">
        <button onClick={() => setMode("state")}>Status</button>
        {!t.owner_id && can("tasks.complete") && (
          <button onClick={() => setMode("claim")}>Pick up shared task</button>
        )}
        {can("tasks.create") && (
          <button onClick={() => setMode("edit")}>
            Edit action / deadline
          </button>
        )}
        {t.kind === "follow_up" && (
          <button onClick={() => setMode("contact")}>Contact attempts</button>
        )}
        {can("tasks.create") && t.owner_id === me.id && (
          <button onClick={() => setMode("handover")}>Offer handover</button>
        )}
        {can("tasks.reassign") && (
          <button onClick={() => setMode("reassign")}>
            Reassign with reason
          </button>
        )}
      </div>
      {mode === "claim" && (
        <Form
          title="Pick up this task"
          submit="Assign to me"
          onSave={async () => {
            await api("/tasks/" + t.id + "/claim", { version: t.version });
            done();
          }}
        >
          <p>
            You will become responsible for this task. Shared work can also be
            completed without assignment.
          </p>
        </Form>
      )}
      {mode === "state" && can("tasks.complete") && (
        <Form
          key={mode}
          title="Update task"
          onSave={async (b) => {
            await api("/tasks/" + t.id + "/state", {
              ...b,
              version: t.version,
            });
            done();
          }}
        >
          <label>
            New status
            <select name="status">
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="open">Open / reopen</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          {field(
            "Completion note / reason (required for blocked, cancelled or reopened work)",
            "reason",
          )}
        </Form>
      )}
      {mode === "edit" && (
        <Form
          title="Edit action and deadline"
          onSave={async (b) => {
            await api(
              "/tasks/" + t.id,
              {
                action: b.action,
                dueAt: b.dueAt ? new Date(b.dueAt).toISOString() : null,
                version: t.version,
              },
              "PATCH",
            );
            done();
          }}
        >
          {field("Action", "action", t.action, {
            required: true,
            maxLength: 120,
          })}
          {field(
            "Deadline (your device timezone; optional)",
            "dueAt",
            t.due_at
              ? new Date(
                  new Date(t.due_at).getTime() -
                    new Date(t.due_at).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)
              : "",
            { type: "datetime-local" },
          )}
        </Form>
      )}
      {mode === "contact" && (
        <>
          <p>
            Recording an attempt does not send a message or complete the
            follow-up.
          </p>
          {can("tasks.complete") && (
            <Form
              key={mode}
              title="Record contact attempt"
              onSave={async (b) => {
                await api("/tasks/" + t.id + "/contact", {
                  ...b,
                  version: t.version,
                });
                done();
              }}
            >
              <label>
                Channel
                <select name="channel">
                  <option value="phone">Phone</option>
                  <option value="in_person">In person</option>
                  <option value="email">Email</option>
                  <option value="other">Other</option>
                </select>
              </label>
              {field("Outcome", "outcome", "", { required: true })}
              {field("Short note (optional)", "note")}
            </Form>
          )}
          {t.attempts.map((a) => (
            <p className="note" key={a.id}>
              {a.actor_name} · {a.channel} · {a.outcome}
              <br />
              <small>
                {new Date(a.created_at).toLocaleString("en-GB", {
                  timeZone: me.timezone,
                })}
              </small>
            </p>
          ))}
        </>
      )}
      {["handover", "reassign"].includes(mode) && (
        <Form
          key={mode}
          title={
            mode === "handover" ? "Offer a handover" : "Force reassignment"
          }
          onSave={async (b) => {
            await api("/tasks/" + t.id + "/" + mode, {
              ...b,
              version: t.version,
            });
            done();
          }}
        >
          <label>
            Recipient
            <select name="toId" required>
              <option value="">Choose active staff</option>
              {people
                ?.filter((p) => p.id !== t.owner_id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          {mode === "reassign" &&
            field("Reason", "reason", "", { required: true })}
          <p className="small">
            {mode === "handover"
              ? "You remain accountable until the recipient accepts."
              : "The new owner sees a reassignment notice on the task."}
          </p>
        </Form>
      )}
    </section>
  );
}

function Today({ me }) {
  const [revision, setRevision] = useState(0);
  const [data, error] = useData("/today", revision);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: me.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const can = (capability) => me.capabilities.includes(capability);
  return (
    <div className="today-page">
      <header className="today-heading">
        <div>
          <span className="eyebrow">{date}</span>
          <h1>{me.kind === "personal" ? "My day" : "Today"}</h1>
          <p>Appointments, active visits and work still to do.</p>
        </div>
        <div className="today-actions">
          {can("appointment.manage") && (
            <a className="button secondary" href="/app/schedule?new=1">
              Book appointment
            </a>
          )}
          {can("patients.edit") && (
            <a className="button primary" href="/app/patients?new=1">
              Register patient
            </a>
          )}
        </div>
      </header>
      {!data ? (
        <div className="today-load">
          <Load error={error} />
          {error && (
            <button
              className="button secondary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Try again
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="today-counts" aria-label="Today's work at a glance">
            <div>
              <strong>{data.visits === null ? "—" : data.visits.length}</strong>
              <span>Current visits</span>
            </div>
            <div>
              <strong>{data.tasks.filter((task) => task.overdue).length}</strong>
              <span>Overdue actions</span>
            </div>
            <div>
              <strong>{data.tasks.length}</strong>
              <span>Open actions</span>
            </div>
          </div>
          <div className="today-columns">
            <div className="today-primary-column">
              {can("appointment.view") && <TodayAppointments me={me} />}
              <section className="today-section" aria-labelledby="current-visits">
                <div className="today-section-heading">
                  <div>
                    <span className="eyebrow">At the practice</span>
                    <h2 id="current-visits">Current visits</h2>
                  </div>
                </div>
                {data.visits === null ? (
                  <p className="today-empty">
                    Your membership does not include patient access.
                  </p>
                ) : data.visits.length ? (
                  <div className="today-list">
                    {data.visits.map((visit) => (
                      <article className="today-row" key={visit.id}>
                        <div>
                          <a
                            className="today-row-title"
                            href={
                              "/app/patients?patient=" +
                              encodeURIComponent(visit.patient_id)
                            }
                          >
                            {visit.patient_name}
                          </a>
                          <span className="today-row-meta">
                            Arrived {formatPracticeTime(visit.arrived_at, me.timezone)}
                          </span>
                        </div>
                        <span className="state-label">
                          {visit.state.replaceAll("_", " ")}
                        </span>
                        <a
                          className="text-link"
                          href={
                            "/app/patients?patient=" +
                            encodeURIComponent(visit.patient_id)
                          }
                        >
                          Open record
                        </a>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="today-empty">
                    No visits are in progress. Check the schedule or register a
                    walk-in patient when they arrive.
                  </p>
                )}
              </section>
            </div>
            <div className="today-secondary-column">
              <section className="today-section" aria-labelledby="outstanding-work">
                <div className="today-section-heading">
                  <div>
                    <span className="eyebrow">Next steps</span>
                    <h2 id="outstanding-work">Outstanding work</h2>
                  </div>
                  <a className="text-link" href="/app/tasks">All tasks</a>
                </div>
                {data.tasks.length ? (
                  <div className="today-work-list">
                    {data.tasks.map((task) => (
                      <a
                        className="today-work-row"
                        href={"/app/tasks?task=" + encodeURIComponent(task.id)}
                        key={task.id}
                      >
                        <span
                          className={
                            "work-indicator" + (task.overdue ? " is-overdue" : "")
                          }
                          aria-hidden="true"
                        />
                        <span className="today-work-copy">
                          <strong>{task.action}</strong>
                          <small>
                            {task.kind === "follow_up" ? "Follow-up" : "Task"} · {me.kind === "personal" ? "My practice" : task.owner_name}
                          </small>
                        </span>
                        <span className={task.overdue ? "due-label overdue" : "due-label"}>
                          {task.overdue
                            ? "Overdue"
                            : task.due_at
                              ? formatPracticeTime(task.due_at, me.timezone)
                              : "No deadline"}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="today-empty">
                    No outstanding work. Follow-ups remain here until their work
                    is complete.
                  </p>
                )}
              </section>
              <section className="today-next-step" aria-labelledby="keep-moving">
                <span className="eyebrow">Keep care moving</span>
                <h2 id="keep-moving">What needs attention next?</h2>
                <p>
                  Open a patient record, review the schedule or add a task with a
                  clear owner and due time.
                </p>
                <a className="text-link" href="/app/follow-ups">
                  Review follow-ups
                </a>
              </section>
            </div>
          </div>
          <p className="today-footnote">
            Showing up to {data.limit} visits and open actions. Counts follow
            your workspace permissions.
          </p>
        </>
      )}
    </div>
  );
}
function TodayAppointments({ me }) {
  const date = practiceDate(me.timezone);
  const [revision, setRevision] = useState(0);
  const [appointments, error] = useData(
    "/appointments?weekStart=" + date,
    revision,
  );
  const today = (appointments || []).filter(
    (appointment) => practiceDate(me.timezone, appointment.starts_at) === date,
  );
  return (
    <section className="today-section" aria-labelledby="todays-schedule">
      <div className="today-section-heading">
        <div>
          <span className="eyebrow">Coming up</span>
          <h2 id="todays-schedule">Today’s schedule</h2>
        </div>
        <a className="text-link" href="/app/schedule">Full schedule</a>
      </div>
      {appointments === null ? (
        <div>
          <Load error={error} />
          {error && (
            <button
              className="button secondary"
              onClick={() => setRevision((value) => value + 1)}
            >
              Retry schedule
            </button>
          )}
        </div>
      ) : today.length ? (
        <div className="today-list">
          {today.map((appointment) => (
            <article className="today-row" key={appointment.id}>
              <span className="today-time">
                {formatPracticeTime(appointment.starts_at, me.timezone, true)}
              </span>
              <div>
                <a
                  className="today-row-title"
                  href={
                    "/app/patients?patient=" +
                    encodeURIComponent(appointment.patient_id)
                  }
                >
                  {appointment.patient_name}
                </a>
                <span className="today-row-meta">{appointment.reason}</span>
              </div>
              <span className="state-label">
                {appointment.state.replaceAll("_", " ")}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="today-empty">No appointments scheduled for today.</p>
      )}
    </section>
  );
}
function practiceDate(timeZone, value = new Date()) {
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dateValue);
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
}
function formatPracticeTime(value, timeZone, timeOnly = false) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    ...(timeOnly
      ? { timeStyle: "short" }
      : { dateStyle: "medium", timeStyle: "short" }),
  }).format(new Date(value));
}
