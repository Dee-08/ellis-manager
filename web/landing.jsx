import React, { useEffect, useRef, useState } from "react";

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
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (motion.matches) video.current?.pause();
      else video.current?.play().catch(() => setPlaying(false));
    };
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("el-entered");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    root.current
      ?.querySelectorAll(".el-intro-copy, .el-explore, .el-story")
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
    };
  }, []);
  const toggleVideo = () => {
    if (playing) video.current?.pause();
    else video.current?.play().catch(() => setMediaError(true));
  };
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
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onError={() => setMediaError(true)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <PublicHeader />
        <h1 className={started ? "el-sr" : "el-video-fallback"}>
          Keep care moving.
        </h1>
        <a
          className="el-scroll"
          href="#landing-main"
          aria-label="Explore Ellis"
        >
          Discover Ellis
        </a>
        <button
          className="el-playback"
          onClick={toggleVideo}
          disabled={mediaError}
          aria-label={playing ? "Pause hero video" : "Play hero video"}
        >
          {mediaError ? "Video unavailable" : playing ? "Pause Ⅱ" : "Play ▷"}
        </button>
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
                Keep track of the work
                <br />
                between consultations.
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
                <a className="el-inline" href="/how-it-works">
                  Meet Ellis
                </a>
              </div>
            </div>
          </div>
          <div className="el-mosaic">
            <div className="el-mosaic-column">
              <img
                className="el-window-photo"
                src="/photography/window-clinician.webp"
                width="1536"
                height="1024"
                alt="Clinician holding a coffee and checking her phone by a window"
                loading="lazy"
              />
              <img
                src="/photography/laboratory.webp"
                width="1536"
                height="1024"
                alt="Clinician reviewing work at a laboratory microscope"
                loading="lazy"
              />
              <div className="el-caption">
                From a result to the next action.
              </div>
            </div>
            <div className="el-mosaic-column el-mosaic-offset">
              <img
                src="/photography/clinicians.webp"
                width="1536"
                height="1024"
                alt="Two clinicians reviewing a tablet together"
                loading="lazy"
              />
              <div className="el-caption">
                A shared view of what needs doing.
              </div>
              <a className="el-photo-link" href="/how-it-works">
                <img
                  src="/photography/coffee-clinician.webp"
                  width="1529"
                  height="1028"
                  alt="Clinician holding a coffee and phone in a hallway"
                  loading="lazy"
                />
                <span>See how Ellis works</span>
              </a>
            </div>
          </div>
        </section>

        <figure className="el-wide-photo">
          <img
            src="/photography/clarity.webp"
            width="1536"
            height="1024"
            alt="Medical team reviewing documents together"
            loading="lazy"
          />
          <figcaption>Clarity. Accountability. Follow-through.</figcaption>
        </figure>

        <section className="el-explore" aria-labelledby="explore-title">
          <h2 id="explore-title">
            Choose where
            <br />
            you’ll use Ellis.
          </h2>
          <div className="el-programmes">
            <a className="el-programme" href="/sign-up?kind=personal">
              <div className="el-programme-photo">
                <img
                  src="/photography/personal.webp"
                  width="1536"
                  height="1024"
                  alt="Veterinarian examining a Sphynx cat"
                  loading="lazy"
                />
              </div>
              <h3>
                For my
                <br />
                personal practice
              </h3>
              <p>
                Manage your patient visits and follow-ups in your own practice
                account.
              </p>
              <div className="el-programme-end">
                <span>Choose personal practice</span>
              </div>
            </a>
            <a className="el-programme" href="/sign-up?kind=clinic">
              <div className="el-programme-photo">
                <img
                  src="/photography/clinic.webp"
                  width="1531"
                  height="1027"
                  alt="Dog with two clinicians during a checkup"
                  loading="lazy"
                />
              </div>
              <h3>
                For my
                <br />
                clinic
              </h3>
              <p>
                Start on your own. Add staff when you need them, with their own
                credentials and permissions.
              </p>
              <div className="el-programme-end">
                <span>Choose clinic</span>
              </div>
            </a>
            <a className="el-programme" href="/how-it-works">
              <div className="el-programme-photo">
                <img
                  src="/photography/phone-clinician.webp"
                  width="1562"
                  height="1007"
                  alt="Clinician speaking on the phone at his desk"
                  loading="lazy"
                />
              </div>
              <h3>
                From arrival
                <br />
                to follow-up
              </h3>
              <p>
                See how patient visits, outstanding work and follow-ups fit
                together.
              </p>
              <div className="el-programme-end">
                <span>Explore the workflow</span>
              </div>
            </a>
          </div>
          <p className="el-account-note">
            Personal practice and clinic are separate accounts. Their
            credentials and records are never automatically linked.
          </p>
        </section>

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
            <a className="el-inline" href="/about">
              Our story
            </a>
            <span className="el-story-credit">A product of Hub Animalia</span>
          </div>
          <img
            src="/photography/founder.webp"
            width="858"
            height="1080"
            alt="Portrait of a man in white traditional attire"
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
          <a href={href} key={href}>
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
        <a href="/choose-account">Create your account</a>
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
