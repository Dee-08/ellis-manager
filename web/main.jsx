import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
const Workspace = lazy(() =>
  import("./workspace").then((m) => ({ default: m.Workspace })),
);
import "./styles.css";
import Landing, { PublicFooter, PublicHeader } from "./landing";
import { AboutPage, HowPage, ContactPage } from "./public-pages";
import IdentityPage, { identityRoute } from "./identity-pages";
import DemoPage from "./demo-page";
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
        Personal and clinic practices keep separate records. One verified login
        can access practices you belong to.
      </p>
    </section>
  );
}
function App() {
  const previewAccountPaths = ["/sign-in", "/sign-up", "/choose-account"];
  if (
    import.meta.env.VITE_REVIEW_MODE === "true" &&
    ((identityRoute(path) && !previewAccountPaths.includes(path)) ||
      path.startsWith("/app") ||
      ["/activate"].includes(path))
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
  if (identityRoute(path)) return <IdentityPage />;
  if (path === "/") return <Landing />;
  if (path === "/book-demo") return <DemoPage />;
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
    page = (
      <section className="section">
        <h1>This activation link is no longer supported.</h1>
        <p>Ask your clinic for an email invitation.</p>
        <a href="/sign-in">Sign in</a>
      </section>
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
