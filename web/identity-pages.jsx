import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./identity-pages.css";
export const identityRoute = (path) =>
  [
    "/sign-up",
    "/sign-in",
    "/verify-email",
    "/recovery",
    "/reset-password",
    "/workspaces",
    "/invitations/accept",
  ].includes(path) || path.startsWith("/onboarding/");
function Field({ label, ...props }) {
  return (
    <label className="identity-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export default function IdentityPage() {
  const path = location.pathname,
    query = new URLSearchParams(location.search);
  const signup = path === "/sign-up",
    login = path === "/sign-in",
    setup = path.startsWith("/onboarding/");
  const [kind, setKind] = useState(
    query.get("kind") === "clinic" || path.endsWith("/clinic")
      ? "clinic"
      : "personal",
  );
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errorCode, setErrorCode] = useState(""),
    [message, setMessage] = useState(""),
    [configuration, setConfiguration] = useState(null),
    [workspaces, setWorkspaces] = useState(null);
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const previewMode = import.meta.env.VITE_REVIEW_MODE === "true";
  useEffect(() => {
    let active = true;
    if (!previewMode) {
      api("/auth/configuration")
        .then((x) => active && setConfiguration(x))
        .catch((e) => active && setError(e.message));
      if (path === "/verify-email" && !token)
        api("/auth/session")
          .then((session) => {
            if (active && session.next !== "/verify-email")
              location.assign(session.next);
          })
          .catch((e) => {
            if (active) {
              setError(e.message);
              setErrorCode(e.code);
            }
          });
    }
    if (path === "/workspaces")
      api("/workspaces")
        .then(async (rows) => {
          if (!active) return;
          const tenant = query.get("tenant");
          const chosen = tenant
            ? rows.find((x) => x.slug === tenant)
            : rows.length === 1
              ? rows[0]
              : null;
          if (chosen) {
            const result = await api("/workspaces/select", {
              slug: chosen.slug,
            });
            location.assign(result.next);
          } else setWorkspaces(rows);
        })
        .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [path, previewMode, token]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setErrorCode("");
    setMessage("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      let result;
      if (signup)
        result = await api("/auth/register", { ...fields, intent: kind });
      else if (login)
        result = await api("/auth/login", {
          ...fields,
          ...(query.get("tenant") ? { tenant: query.get("tenant") } : {}),
        });
      else if (setup)
        result = await api("/workspaces", {
          ...fields,
          kind,
          clinical: fields.clinical === "on",
          key,
        });
      else if (path === "/verify-email")
        result = await api(
          token ? "/auth/verify" : "/auth/resend",
          token ? { token } : {},
        );
      else if (path === "/recovery")
        result = await api("/auth/forgot-password", fields);
      else if (path === "/reset-password")
        result = await api("/auth/reset-password", { ...fields, token });
      else if (path === "/invitations/accept")
        result = await api(
          token ? "/auth/invitation-intent" : "/invitations/accept",
          token ? { token } : {},
        );
      if (result?.next) location.assign(result.next);
      else setMessage(result?.message || "Request completed.");
    } catch (e) {
      setError(e.message);
      setErrorCode(e.code);
    } finally {
      setBusy(false);
    }
  }
  const title = signup
    ? "Create your Ellis account"
    : login
      ? "Welcome back"
      : setup
        ? kind === "clinic"
          ? "Set up your clinic"
          : "Set up your practice"
        : path === "/verify-email"
          ? "Verify your email"
          : path === "/recovery"
            ? "Recover your account"
            : path === "/reset-password"
              ? "Choose a new password"
              : path === "/workspaces"
                ? "Choose your practice"
                : "Join your clinic";
  return (
    <main className="identity-page">
      <section className="identity-content">
        <a href="/" className="identity-logo">
          <img
            src="/brand/ellis-primary.svg"
            alt="Ellis"
            width="120"
            height="40"
          />
        </a>
        <div className="identity-form-wrap">
          <h1>{title}</h1>
          {(signup || login) && (
            <>
              <p>
                {signup
                  ? "Your login gives you secure access to your veterinary work."
                  : "Sign in to continue with your patients and outstanding work."}
              </p>
              <button
                className="identity-provider"
                disabled
                aria-describedby="google-status"
              >
                Continue with Google
              </button>
              <p id="google-status" className="identity-hint">
                Google sign-in is not configured yet. Use email and password.
              </p>
              <div className="identity-divider">With email</div>
            </>
          )}
          {previewMode && (signup || login) && (
            <p id="account-preview-status" className="identity-notice">
              This public preview lets you view the account screens. Sign-in and
              account creation are not connected here.
            </p>
          )}
          {configuration?.localMailbox && (
            <p className="identity-notice">
              Local development: verification and recovery links are written to
              the private local mailbox. No email is sent.
            </p>
          )}
          {configuration &&
            !configuration.email &&
            (signup || path === "/recovery" || path === "/verify-email") && (
              <p className="identity-notice">
                Email delivery is not configured. Registration and recovery need
                a delivery adapter.
              </p>
            )}
          {error && (
            <p role="alert" className="identity-error">
              {error}
            </p>
          )}
          {signup && errorCode === "mail_failed" && (
            <p>
              <a href="/verify-email">
                Continue to verification and resend the email
              </a>
              . Your pending account is already saved.
            </p>
          )}
          {errorCode === "authentication_required" && (
            <p>
              <a href="/sign-in">Sign in to request a new verification email</a>
              .
            </p>
          )}
          {message && <p role="status">{message}</p>}
          {path === "/workspaces" ? (
            <div className="identity-workspaces">
              {workspaces === null && !error && (
                <p role="status">Loading your practices…</p>
              )}
              {error && (
                <button onClick={() => location.reload()}>Try again</button>
              )}
              {workspaces?.map((w) => (
                <button
                  key={w.id}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const r = await api("/workspaces/select", {
                        slug: w.slug,
                      });
                      location.assign(r.next);
                    } catch (e) {
                      setError(e.message);
                      setBusy(false);
                    }
                  }}
                >
                  {w.name}
                  <small>
                    {w.kind === "personal" ? "Personal practice" : "Clinic"} ·{" "}
                    {w.slug}
                  </small>
                </button>
              ))}
              {workspaces?.length === 0 && (
                <>
                  <p>
                    You have no active practice membership. You can set up your
                    own practice or ask your clinic to restore access.
                  </p>
                  <a href="/onboarding/personal">Set up a practice</a>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={submit}>
              {signup && (
                <>
                  <fieldset>
                    <legend>How will you use Ellis?</legend>
                    <label>
                      <input
                        type="radio"
                        checked={kind === "personal"}
                        onChange={() => setKind("personal")}
                      />{" "}
                      For myself
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={kind === "clinic"}
                        onChange={() => setKind("clinic")}
                      />{" "}
                      For a clinic
                    </label>
                  </fieldset>
                  <Field
                    label="Your name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={120}
                  />
                </>
              )}
              {(signup || login || path === "/recovery") && (
                <Field
                  label="Email address"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              )}
              {(signup || login || path === "/reset-password") && (
                <Field
                  label={
                    path === "/reset-password" ? "New password" : "Password"
                  }
                  type="password"
                  name="password"
                  autoComplete={login ? "current-password" : "new-password"}
                  required
                  minLength={login ? 1 : 12}
                  maxLength={128}
                />
              )}
              {setup && (
                <>
                  <p>
                    {kind === "personal"
                      ? "Your own patients, visits and follow-ups. No clinic details or staff invitations needed."
                      : "You can start alone. Add staff later when you need them."}
                  </p>
                  <Field
                    label={
                      kind === "clinic"
                        ? "Clinic name"
                        : "Practice label (optional)"
                    }
                    name="name"
                    required={kind === "clinic"}
                    maxLength={120}
                  />
                  <Field
                    label="Practice address"
                    name="slug"
                    required
                    pattern="[a-z0-9][a-z0-9-]{1,48}[a-z0-9]"
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="identity-hint">
                    Use lowercase letters, numbers and hyphens. This is your
                    practice address, not a verified live domain.
                  </p>
                  <div className="identity-pair">
                    <Field
                      label="Country code"
                      name="country"
                      placeholder="NG"
                      pattern="[A-Z]{2}"
                      required
                      maxLength={2}
                    />
                    <Field
                      label="Currency code"
                      name="currency"
                      placeholder="NGN"
                      pattern="[A-Z]{3}"
                      required
                      maxLength={3}
                    />
                  </div>
                  <Field
                    label="Timezone"
                    name="timezone"
                    defaultValue={
                      Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                    required
                  />
                  {kind === "clinic" && (
                    <label className="identity-check">
                      <input name="clinical" type="checkbox" /> I am a
                      veterinarian who will provide clinical care. Enable
                      clinical capabilities for my membership.
                    </label>
                  )}
                </>
              )}
              {path === "/verify-email" && (
                <p>
                  {token
                    ? "Confirm your email to continue setting up your practice."
                    : "Open your verification link, or request another link after signing in."}
                </p>
              )}
              {path === "/invitations/accept" && (
                <p>
                  Sign in with the verified email address your clinic invited,
                  then return to this invitation to accept it.
                </p>
              )}
              <button
                className="identity-primary"
                disabled={
                  busy ||
                  (previewMode && (signup || login)) ||
                  (path === "/reset-password" && !token)
                }
                aria-describedby={
                  previewMode && (signup || login)
                    ? "account-preview-status"
                    : undefined
                }
              >
                {busy
                  ? "Please wait…"
                  : signup
                    ? "Create account"
                    : login
                      ? "Sign in"
                      : setup
                        ? "Create practice"
                        : path === "/verify-email"
                          ? token
                            ? "Verify email"
                            : "Resend verification"
                          : path === "/recovery"
                            ? "Request recovery link"
                            : path === "/reset-password"
                              ? "Save new password"
                              : "Accept invitation"}
              </button>
            </form>
          )}
          <nav className="identity-links" aria-label="Account help">
            {login ? (
              <>
                <a href="/recovery">Forgot password?</a>
                <a href="/sign-up">Create an account</a>
              </>
            ) : (
              <a href="/sign-in">Back to sign in</a>
            )}
          </nav>
        </div>
        <p className="identity-footnote">Keep care moving.</p>
      </section>
      <aside className="identity-art" aria-label="Image placeholder">
        <span>Ellis</span>
        <p>Photography will be added here.</p>
      </aside>
    </main>
  );
}
