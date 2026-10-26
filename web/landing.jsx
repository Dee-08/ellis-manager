import React, { useEffect, useRef, useState } from "react";

import { usePublicMotion } from "./public-motion";
import PrinciplesMarquee from "./principles-marquee";

const links = [
  ["How to use", "/how-it-works"],
  ["About us", "/about"],
  ["Contact", "/contact"],
  ["Sign in", "/sign-in"],
  ["Create account", "/choose-account"],
];
const journey = [
  [
    "Arrival",
    "A clear place to begin",
    "Register the patient and their owner, then open a visit. Your next steps stay connected to the patient.",
  ],
  [
    "Consultation",
    "Keep the next step in sight",
    "Add coordination notes alongside your primary clinical record. Give outstanding work a clear action, owner and deadline.",
  ],
  [
    "Outstanding work",
    "Know who is taking it forward",
    "See what is open, in progress or blocked. When work changes hands, responsibility stays with its owner until the handover is accepted.",
  ],
  [
    "Follow-up",
    "The visit ends. Care continues",
    "Keep follow-ups visible after a patient leaves. Record contact attempts and outcomes, then mark the work complete when it is done.",
  ],
];

export default function Landing() {
  const video = useRef(null);
  const root = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (motion.matches) video.current?.pause();
      else video.current?.play().catch(() => setStarted(false));
    };
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);
  usePublicMotion(root);
  return (
    <div ref={root} className="ellis-landing">
      <a className="skip" href="#landing-main">
        Skip to content
      </a>
      <section className="el-hero" aria-label="Ellis — Keep care moving">
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/photography/footer-background.webp"
          onPlay={() => {
            setStarted(true);
          }}
          onError={() => setStarted(false)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <PublicHeader />
        <h1 className={started ? "el-sr" : "el-video-fallback"}>
          Keep care moving.
        </h1>
      </section>

      <main id="landing-main">
        <section className="el-intro" aria-labelledby="intro-title">
          <div className="el-intro-main">
            <img
              className="el-care-photo"
              src="/photography/care.webp"
              width="1531"
              height="1027"
              alt="Veterinarian and assistant examining a terrier"
            />
            <div className="el-intro-copy">
              <h2 id="intro-title">
                Keep track of the work between consultations.
              </h2>
              <div className="el-body-copy">
                <p>
                  A patient arrives. A result needs reviewing. Someone needs a
                  call back. The work doesn’t always end with the consultation.
                </p>
                <p>
                  Ellis brings the next steps into view: what needs doing, who
                  is responsible, and what is complete.
                </p>
                <p>
                  For your own practice or a clinic team. From arrival to
                  follow-up.
                </p>
                <a className="el-cta el-cta-secondary" href="/how-it-works">
                  Meet Ellis
                </a>
              </div>
            </div>
          </div>
        </section>

        <PrinciplesMarquee />

        <section className="el-explore" aria-labelledby="explore-title">
          <h2 id="explore-title">Choose where you’ll use Ellis.</h2>
          <div className="el-programmes">
            <article className="el-programme">
              <div className="el-programme-photo">
                <img
                  src="/photography/personal.webp"
                  width="1023"
                  height="1537"
                  alt="Veterinarian examining a Sphynx cat"
                  loading="lazy"
                />
              </div>
              <h3>For my personal practice</h3>
              <p>
                Manage your patient visits and follow-ups in your own practice
                account.
              </p>
              <div className="el-programme-end">
                <a className="el-cta" href="/sign-up?kind=personal">
                  Choose personal practice
                </a>
              </div>
            </article>
            <article className="el-programme">
              <div className="el-programme-photo">
                <img
                  src="/photography/clinic.webp"
                  width="1531"
                  height="1027"
                  alt="Dog with two clinicians during a checkup"
                  loading="lazy"
                />
              </div>
              <h3>For my clinic</h3>
              <p>
                Start on your own. Add staff when you need them, with their own
                credentials and permissions.
              </p>
              <div className="el-programme-end">
                <a className="el-cta" href="/sign-up?kind=clinic">
                  Choose clinic
                </a>
              </div>
            </article>
          </div>
          <p className="el-account-note">
            Personal practice and clinic are separate accounts. Their
            credentials and records are never automatically linked.
          </p>
        </section>

        <a className="el-workflow" href="/how-it-works">
          <div className="el-programme-photo">
            <img
              src="/photography/phone-clinician.webp"
              width="1562"
              height="1007"
              alt="Clinician speaking on the phone at his desk"
              loading="lazy"
            />
          </div>
          <div className="el-workflow-copy">
            <h2>
              From arrival
              <br />
              to follow-up
            </h2>
            <p>
              See how patient visits, outstanding work and follow-ups fit
              together.
            </p>
            <div className="el-programme-end">
              <span>Explore the workflow</span>
            </div>
          </div>
        </a>

        <section className="el-journey" aria-label="The care journey">
          {journey.map(([title, , copy]) => (
            <details key={title}>
              <summary>
                <span>
                  <strong>{title}</strong>
                </span>
                <span className="el-disclosure" aria-hidden="true">
                  +
                </span>
              </summary>
              <p>{copy}</p>
            </details>
          ))}
          <a className="el-more" href="/how-it-works">
            Explore Ellis
          </a>
        </section>

        <section className="el-story" aria-labelledby="story-title">
          <div>
            <h2 id="story-title">
              Built around
              <br />
              the working day.
            </h2>
            <p>
              Ellis is a Hub Animalia project for veterinary practices. It keeps
              outstanding work attached to a patient, with a named person
              responsible for the next step.
            </p>
            <a className="el-cta el-cta-secondary" href="/about">
              Our story
            </a>
            <span className="el-story-credit">A product of Hub Animalia</span>
          </div>
          <img
            src="/photography/founder.webp"
            width="858"
            height="1080"
            alt="Fred Adekunle, founder of Hub Animalia"
            loading="lazy"
          />
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export function PublicHeader({ light = false, solid = false }) {
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <header
      className={
        "el-header" +
        (scrolled || solid ? " is-scrolled" : "") +
        (light && !scrolled && !solid ? " is-light" : "")
      }
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          menu.current?.focus();
        }
      }}
    >
      <a className="el-wordmark" href="/" aria-label="Ellis home">
        <img
          src={
            light && !scrolled && !solid
              ? "/brand/wordmark-forest.svg"
              : "/brand/wordmark-white.svg"
          }
          width="108"
          height="51"
          alt="Ellis"
        />
      </a>
      <button
        ref={menu}
        className="el-menu"
        aria-controls="landing-navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Menu {open ? "−" : "+"}
      </button>
      <nav
        id="landing-navigation"
        aria-label="Main"
        className={open ? "is-open" : ""}
      >
        {links.map(([label, href]) => (
          <a
            href={href}
            key={href}
            className={href === "/choose-account" ? "el-cta" : undefined}
            aria-current={
              window.location.pathname === href ? "page" : undefined
            }
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="el-footer">
      {import.meta.env.VITE_REVIEW_MODE === "true" && (
        <p className="el-review-notice">
          Personal design preview · Account services are not enabled.
        </p>
      )}
      <div className="el-footer-top">
        <h2>
          Keep care
          <br />
          moving.
        </h2>
        <a className="el-cta" href="/choose-account">
          Create your account
        </a>
      </div>
      <div className="el-footer-grid">
        <div>
          <img
            className="el-footer-wordmark"
            src="/brand/wordmark-white.svg"
            width="150"
            height="71"
            alt="Ellis"
          />
          <p>
            For the people
            <br />
            behind every patient.
          </p>
        </div>
        <nav aria-label="Footer">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div>
          <p>Let’s talk</p>
          <a href="mailto:hubanimalia@gmail.com">hubanimalia@gmail.com</a>
          <p>
            Questions about Ellis?
            <br />
            <a href="/contact">Get in touch.</a>
          </p>
        </div>
      </div>
      <div className="el-footer-bottom">
        <span className="el-hub">
          A product of{" "}
          <img
            src="/brand/hub-animalia.webp"
            width="110"
            height="46"
            alt="Hub Animalia"
          />
        </span>
        <span>Clarity. Accountability. Follow-through.</span>
        <a href="#">Back to top</a>
      </div>
    </footer>
  );
}
