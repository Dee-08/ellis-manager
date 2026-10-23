import React, { useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api";
import { contact, displayPhone } from "./contact";
const Workspace = lazy(() =>
  import("./workspace").then((m) => ({ default: m.Workspace })),
);
import "./styles.css";
import Landing from "./landing";
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
  const [open, setOpen] = useState(false);
  return (
    <header
      className="public-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          e.currentTarget.querySelector(".menu-toggle").focus();
        }
      }}
    >
      <Logo dark />
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        Menu {open ? "−" : "+"}
      </button>
      <nav
        id="navigation"
        className={open ? "expanded" : ""}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <a href="/how-it-works">How it works</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a className="signin" href="/sign-in">
          Sign in
        </a>
        <a className="button lime" href="/choose-account">
          Create account <span>↗</span>
        </a>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <Logo dark />
        <p>Clarity. Accountability. Follow-through.</p>
        <a href="mailto:hubanimalia@gmail.com">{contact.email} ↗</a>
      </div>
      <div className="footer-bottom">
        <span className="hub-credit">
          A product of{" "}
          <img
            src="/brand/hub-animalia.webp"
            width="126"
            height="42"
            alt="Hub Animalia"
          />
        </span>
        <div>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/sign-in">Sign in</a>
        </div>
        <span>Keep care moving.</span>
      </div>
    </footer>
  );
}
function CTA() {
  return (
    <section className="closing">
      <span className="eyebrow">A clearer day starts here</span>
      <h2>Good care keeps going.</h2>
      <a className="button lime" href="/choose-account">
        Create your account <span>↗</span>
      </a>
    </section>
  );
}
const stages = [
  [
    "Arrival",
    "A clear place to begin.",
    "Register the patient, connect their owner and open a visit. Working alone? You can do it all.",
  ],
  [
    "Consultation",
    "Keep the next step in sight.",
    "Record a coordination note alongside your primary clinical record. Make outstanding actions explicit.",
  ],
  [
    "Outstanding work",
    "Give every next step an owner.",
    "Track the action, accountable person and due time. A handover is complete when the recipient accepts.",
  ],
  [
    "Follow-up",
    "The visit ends. Care continues.",
    "Keep follow-up visible after a patient leaves. Record contact attempts and outcomes without assuming a message was delivered.",
  ],
];
function Stages() {
  return (
    <section className="section" id="how-it-works">
      <div className="section-title">
        <h2>
          From arrival.
          <br />
          Through follow-up.
        </h2>
        <span className="rule" />
        <p>
          One continuous view of the work.
          <br />
          However your practice is organised.
        </p>
      </div>
      <div className="stages">
        {stages.map(([label, title, copy], i) => (
          <article key={label}>
            <span className="stage-number">0{i + 1}</span>
            <div>
              <span className="eyebrow">{label}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function Choices({ standalone = false }) {
  return (
    <section className={"section choices " + (standalone ? "standalone" : "")}>
      <span className="eyebrow">Two account choices</span>
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
          <span className="eyebrow">01 / Personal practice</span>
          <h3>
            For my
            <br />
            personal practice.
          </h3>
          <p>
            An independent account for your patients, visits and follow-through.
            Start on your own.
          </p>
          <span className="choice-action">
            Choose personal practice <b>↗</b>
          </span>
        </a>
        <a href="/sign-up?kind=clinic">
          <span className="eyebrow">02 / Clinic or hospital</span>
          <h3>
            For my
            <br />
            clinic or hospital.
          </h3>
          <p>
            One clinic account with your own credentials. Add staff with
            individual permissions whenever you need them.
          </p>
          <span className="choice-action">
            Choose clinic <b>↗</b>
          </span>
        </a>
      </div>
      <p className="small">
        These are independent accounts. Records and credentials are never
        automatically linked.
      </p>
    </section>
  );
}
function About() {
  return (
    <>
      <section className="section about-hero">
        <span className="eyebrow">About Ellis</span>
        <h1>
          Built around
          <br />
          the people who care.
        </h1>
        <p>
          Ellis is a veterinary practice management platform by Hub Animalia.
          We’re building it to help veterinary teams know what needs doing, who
          is responsible, and what has been completed, from arrival to
          follow-up.
        </p>
      </section>
      <section className="section introduction">
        <span className="eyebrow">The company behind Ellis</span>
        <div>
          <h2>Meet Hub Animalia.</h2>
          <img
            className="about-hub"
            src="/brand/hub-animalia.webp"
            width="210"
            height="70"
            alt="Hub Animalia"
          />
          <p>
            Hub Animalia began with a simple observation: people working in
            animal care often have to piece together paper records, spreadsheets
            and separate applications to get through the day. Information
            becomes scattered, and staying connected takes more effort than it
            should.
          </p>
          <p>
            We’re building technology around those everyday realities. Our aim
            is to help people in veterinary medicine work with greater clarity,
            share knowledge and provide better care through tools shaped by the
            people who use them.
          </p>
        </div>
      </section>
      <section className="section two-column">
        <article>
          <span className="eyebrow">Our vision</span>
          <h3>Empowering every voice in veterinary care.</h3>
          <p>
            Empowering every voice in veterinary care through intelligent
            technology, compassionate design, and unrelenting innovation.
          </p>
        </article>
        <article>
          <span className="eyebrow">Our mission</span>
          <h3>A connected community of care.</h3>
          <p>
            To develop a suite of versatile, intelligent tools that transform
            the veterinary experience from siloed workflows to an integrated,
            global community of care.
          </p>
        </article>
      </section>
      <section className="quote section">
        <blockquote>
          “Technology shouldn’t just connect us — it should empower us to care
          better.”
        </blockquote>
        <p>
          Fred Adekunle
          <br />
          <span className="small">Founder, Hub Animalia</span>
        </p>
      </section>
      <CTA />
    </>
  );
}
function Contact() {
  return (
    <section className="section contact">
      <span className="eyebrow">Get in touch</span>
      <h1>
        Let’s keep
        <br />
        the conversation going.
      </h1>
      <p>
        Have a question about Ellis or want to speak with the Hub Animalia team?
        We’d like to hear from you.
      </p>
      <div className="contact-grid">
        <div>
          <h3>Email</h3>
          <a href={"mailto:" + contact.email}>{contact.email} ↗</a>
          <h3>Find us</h3>
          <address>{contact.address}</address>
        </div>
        <div>
          <h3>Phone / WhatsApp</h3>
          {contact.phones.map((number) => (
            <div className="phone" key={number}>
              <span>{displayPhone(number)}</span>
              <a aria-label={"Call " + number} href={"tel:" + number}>
                Call ↗
              </a>
              <a
                aria-label={"WhatsApp " + number}
                href={"https://wa.me/" + number.slice(1)}
              >
                WhatsApp ↗
              </a>
            </div>
          ))}
        </div>
      </div>
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
        <span className="eyebrow">A clear place to begin</span>
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
          <span>↗</span>
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
  else if (path === "/about") page = <About />;
  else if (path === "/contact") page = <Contact />;
  else if (path === "/how-it-works")
    page = (
      <>
        <section className="section">
          <span className="eyebrow">How Ellis works</span>
          <h1>
            One clear next step.
            <br />
            Then the next.
          </h1>
          <p>Outpatient coordination for your personal practice or clinic.</p>
        </section>
        <Stages />
        <CTA />
      </>
    );
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
        <a href="/contact">Contact Hub Animalia ↗</a>
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
