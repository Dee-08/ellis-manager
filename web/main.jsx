import React, { useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
const Workspace = lazy(() =>
  import("./workspace").then((m) => ({ default: m.Workspace })),
);
import "./styles.css";
import Landing, { PublicFooter, PublicHeader } from "./landing";
import { AboutPage, HowPage, ContactPage } from "./public-pages";
const path = window.location.pathname;
export function Logo({ dark = false }) {
  return (
    <a className="logo" href="/" aria-label="Ellis home">
      <img
        width="160"
        height="52"
        src={"/brand/ellis-" + (dark ? "reverse" : "primary") + ".svg"}
        alt="Ellis"
      />
    </a>
  );
}
function Header() {
  return (
    <div className="ellis-landing public-header-space">
      <PublicHeader solid />
    </div>
  );
}
function Footer() {
  return (
    <div className="ellis-landing">
      <PublicFooter />
    </div>
  );
}
function Choices({ standalone = false }) {
  return (
    <section className={"section choices " + (standalone ? "standalone" : "")}>
      <h2>
        Your practice.
        <br />
        Your way of working.
      </h2>
      <p>
        Choose the account that fits your work. Both work for a veterinarian
        practising alone.
      </p>
      <div className="choice-grid">
        <a href="/sign-up?kind=personal">
          <h3>
            For my
            <br />
            personal practice.
          </h3>
          <p>
            An independent account for your patients, visits and follow-through.
            Start on your own.
          </p>
          <span className="choice-action">Choose personal practice</span>
        </a>
        <a href="/sign-up?kind=clinic">
          <h3>
            For my
            <br />
            clinic or hospital.
          </h3>
          <p>
            One clinic account with your own credentials. Add staff with
            individual permissions whenever you need them.
          </p>
          <span className="choice-action">Choose clinic</span>
        </a>
      </div>
      <p className="small">
        These are independent accounts. Records and credentials are never
        automatically linked.
      </p>
    </section>
  );
}
function Auth() {
  const signup = path === "/sign-up",
    activation = path === "/activate";
  const kind =
    new URLSearchParams(location.search).get("kind") === "clinic"
      ? "clinic"
      : "personal";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState(null);
  useEffect(() => {
    if (activation)
      api("/auth/activation-info", {
        token: new URLSearchParams(location.hash.slice(1)).get("token"),
      })
        .then(setInvite)
        .catch((e) => setError(e.message));
  }, [activation]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(
        activation
          ? "/auth/activate"
          : signup
            ? "/auth/register"
            : "/auth/login",
        activation
          ? {
              ...body,
              token: new URLSearchParams(location.hash.slice(1)).get("token"),
            }
          : { ...body, ...(signup ? { kind } : {}) },
      );
      location.href = "/app";
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <h1>
          {activation
            ? "Your own credentials."
            : signup
              ? "Make room for a clearer day."
              : "Welcome back."}
        </h1>
        <p>
          {activation
            ? "Activate your clinic staff account using the link shared by your administrator."
            : signup
              ? "Start with your " +
                (kind === "clinic"
                  ? "clinic or hospital"
                  : "personal practice") +
                ". " +
                (kind === "clinic"
                  ? "Continue on your own. Add staff later when you need them."
                  : "Your practice, your records, your next steps.")
              : "Sign in with your practice code and your own credentials."}
        </p>
        <p className="small">
          Pilot · Coordination companion. Use synthetic data while release
          checks are underway.
        </p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {activation && invite && (
          <p className="invite-context">
            Join {invite.clinic} as {invite.name}. Set your own password below.
          </p>
        )}
        <h2>
          {activation
            ? "Activate account"
            : signup
              ? "Create account"
              : "Sign in"}
        </h2>
        {signup && (
          <>
            <label>
              Practice name
              <input
                name="practiceName"
                required
                maxLength="120"
                autoComplete="organization"
              />
            </label>
            <label>
              Your name
              <input name="name" required maxLength="100" autoComplete="name" />
            </label>
          </>
        )}
        {!activation && (
          <>
            <label>
              Practice / clinic code
              <input
                name="slug"
                required
                pattern="[a-z0-9-]{3,40}"
                autoCapitalize="none"
                autoComplete="organization-title"
                placeholder="e.g. cedar-vets"
              />
              <small>
                {signup
                  ? "Choose a unique code. You will use it to sign in."
                  : "The code chosen when your practice was created."}
              </small>
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
          </>
        )}
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={signup || activation ? 12 : 1}
            maxLength="128"
            required
            autoComplete={
              signup || activation ? "new-password" : "current-password"
            }
          />
          {(signup || activation) && <small>Use at least 12 characters.</small>}
        </label>
        {signup && (
          <>
            <label>
              Practice timezone
              <input name="timezone" defaultValue="Africa/Lagos" required />
            </label>
            <label className="check">
              <input type="checkbox" name="clinical" /> I need permission to
              draft and sign coordination notes.{" "}
              {kind === "clinic"
                ? "The clinic controls clinical capability grants."
                : "Administration alone does not grant this capability."}
            </label>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary"
          disabled={busy || (activation && !invite)}
        >
          {busy
            ? "Please wait…"
            : activation
              ? "Activate account"
              : signup
                ? kind === "clinic"
                  ? "Create clinic and continue on my own"
                  : "Create personal practice"
                : "Sign in"}{" "}
        </button>
        <p className="small">
          {signup ? (
            <a href="/choose-account">Change account choice</a>
          ) : (
            <a href="/choose-account">Create an independent account</a>
          )}
        </p>
        {!signup && !activation && (
          <p className="small">
            Need access restored? <a href="/recovery">Account recovery</a>
          </p>
        )}
      </form>
    </section>
  );
}
function App() {
  if (
    import.meta.env.VITE_REVIEW_MODE === "true" &&
    (path.startsWith("/app") ||
      ["/sign-up", "/sign-in", "/activate", "/recovery"].includes(path))
  )
    return (
      <>
        <Header />
        <main className="section">
          <h1>Design review only.</h1>
          <p>
            This shared preview has no account services or patient database.
            Please use it to review the public website.
          </p>
          <a href="/">Return to Ellis</a>
        </main>
        <Footer />
      </>
    );
  if (path === "/") return <Landing />;
  if (path === "/about") return <AboutPage />;
  if (path === "/contact") return <ContactPage />;
  if (path === "/how-it-works") return <HowPage />;
  if (path.startsWith("/app"))
    return (
      <Suspense
        fallback={
          <main className="section" role="status">
            Loading your practice…
          </main>
        }
      >
        <Workspace />
      </Suspense>
    );
  let page;
  if (path === "/choose-account") page = <Choices standalone />;
  else if (["/sign-up", "sign-in", "/sign-in", "/activate"].includes(path))
    page = <Auth />;
  else if (path === "/recovery")
    page = (
      <section className="section">
        <h1>Account recovery</h1>
        <p>
          Clinic staff can ask their clinic administrator for a new activation
          link.
        </p>
        <p>
          Owner recovery is not enabled for this pilot. A verified recovery
          channel is required before real patient data can be used.
        </p>
        <a href="/contact">Contact Hub Animalia</a>
      </section>
    );
  else
    page = (
      <section className="section">
        <h1>Page not found.</h1>
        <a href="/">Return home</a>
      </section>
    );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{page}</main>
      <Footer />
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);

import "./workspace.css";

import "./landing.css";
import "./public-pages.css";
import "./typography.css";
