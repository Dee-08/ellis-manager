import React, { useEffect, useRef, useState } from "react";

const links = [
  ["How it works", "/how-it-works"],
  ["About", "/about"],
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
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
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
  const toggleVideo = () => {
    if (playing) video.current?.pause();
    else video.current?.play().catch(() => setMediaError(true));
  };
  return (
    <div className="ellis-landing">
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
        <header
          className="el-header"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              menu.current?.focus();
            }
          }}
        >
          <a className="el-wordmark" href="/" aria-label="Ellis home">
            <img
              src="/brand/wordmark-white.svg"
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
        <h1 className={started ? "el-sr" : "el-video-fallback"}>
          Keep care moving.
        </h1>
        <a
          className="el-scroll"
          href="#landing-main"
          aria-label="Explore Ellis"
        >
          ↓
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
                Good care takes people.
                <br />
                Keeping it moving takes clarity.
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
                  Meet Ellis <span>↗</span>
                </a>
              </div>
            </div>
          </div>
          <div className="el-mosaic">
            <div className="el-mosaic-column">
              <div className="el-principle">
                <span>01 / Clarity</span>
                <p>
                  See what
                  <br />
                  comes next.
                </p>
              </div>
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
              <a className="el-lime-link" href="/how-it-works">
                See how it works <span>↗</span>
              </a>
            </div>
          </div>
        </section>

        <figure className="el-wide-photo">
          <img
            src="/photography/clinicians.webp"
            width="1536"
            height="1024"
            alt="Two clinicians discussing the next steps in care"
            loading="lazy"
          />
          <figcaption>Clarity. Accountability. Follow-through.</figcaption>
        </figure>

        <section className="el-explore" aria-labelledby="explore-title">
          <h2 id="explore-title">
            Your practice.
            <br />
            Your way of working.
          </h2>
          <div className="el-programmes">
            <a className="el-programme" href="/sign-up?kind=personal">
              <span className="el-kicker">01 / Independent practice</span>
              <h3>
                For my
                <br />
                personal practice
              </h3>
              <p>
                Your patients. Your next steps.
                <br />A clear place to work on your own.
              </p>
              <div className="el-programme-end">
                <span>Choose personal practice</span>
                <span>↗</span>
              </div>
            </a>
            <a className="el-programme" href="/sign-up?kind=clinic">
              <span className="el-kicker">02 / Clinic or hospital</span>
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
                <span>↗</span>
              </div>
            </a>
            <a className="el-programme" href="/how-it-works">
              <span className="el-kicker">03 / A closer look</span>
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
                <span>↗</span>
              </div>
            </a>
          </div>
          <p className="el-account-note">
            Personal practice and clinic are separate accounts. Their
            credentials and records are never automatically linked.
          </p>
        </section>

        <section className="el-journey" aria-label="The care journey">
          {journey.map(([title, subtitle, copy], i) => (
            <details key={title}>
              <summary>
                <span className="el-step-number">0{i + 1}</span>
                <span>
                  <strong>{title}</strong>
                  <span className="el-outline">{subtitle}</span>
                </span>
                <span className="el-disclosure" aria-hidden="true">
                  ↗
                </span>
              </summary>
              <p>{copy}</p>
            </details>
          ))}
          <a className="el-more" href="/how-it-works">
            Explore Ellis <span>↗</span>
          </a>
        </section>

        <section className="el-story" aria-labelledby="story-title">
          <div>
            <span className="el-kicker">The thinking behind Ellis</span>
            <h2 id="story-title">
              Care is a sequence.
              <br />
              Every next step
              <br />
              matters.
            </h2>
            <p>
              We’re building Ellis around the everyday work of veterinary
              practice. Less uncertainty about what is outstanding. A clearer
              sense of who is taking it forward.
            </p>
            <a className="el-inline" href="/about">
              Our story <span>↗</span>
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

      <footer className="el-footer">
        <div className="el-footer-top">
          <h2>
            Keep care
            <br />
            moving.
          </h2>
          <a href="/choose-account">
            Create your account <span>↗</span>
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
            <span className="el-kicker">Let’s talk</span>
            <a href="mailto:hubanimalia@gmail.com">hubanimalia@gmail.com ↗</a>
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
              height="37"
              alt="Hub Animalia"
            />
          </span>
          <span>Clarity. Accountability. Follow-through.</span>
          <a href="#">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
