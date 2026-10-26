import React, { useEffect, useRef } from "react";
import { PublicHeader, PublicFooter } from "./landing";
import { contact, displayPhone } from "./contact";
import { usePublicMotion } from "./public-motion";

function Page({ title, image, children, intro }) {
  const root = useRef(null);
  usePublicMotion(root);
  useEffect(() => {
    document.title = `${title} | Ellis`;
  }, [title]);
  return (
    <div ref={root} className="ellis-landing editorial-page">
      <a className="skip" href="#page-main">
        Skip to content
      </a>
      <PublicHeader light={image === "contact-hero"} />
      <main id="page-main">
        <section
          className={
            "ed-hero" + (image === "contact-hero" ? " ed-hero-light" : "")
          }
          style={{ backgroundImage: `url(/photography/${image}.webp)` }}
        >
          <h1>{title}</h1>
          <p>{intro}</p>
        </section>
        <div className="ed-content">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function HowPage() {
  return (
    <Page
      title="How to use Ellis."
      image="how-hero"
      intro="Keep the next action connected to the patient, from the first visit to the follow-up call."
    >
      <section className="ed-introduction">
        <h2>
          A place for the work
          <br />
          still to do.
        </h2>
        <div>
          <p>
            Ellis is being built as a coordination companion to your clinical
            record. It brings visits, outstanding work and follow-ups into one
            view.
          </p>
          <p className="ed-note">
            This is an early guide. We’ll update the walkthrough as the
            dashboard and workflows take shape.
          </p>
        </div>
      </section>
      <section className="ed-guide" aria-label="Getting started">
        <article>
          <h2>Start with your practice.</h2>
          <div>
            <p>
              Choose a personal practice account for your own work, or a clinic
              account. Each has its own credentials and records.
            </p>
            <p>
              You can use either on your own. In a clinic, add staff when you
              need them. Each person signs in separately; permissions determine
              what they can access, and job titles are optional.
            </p>
            <a className="el-cta" href="/choose-account">
              Explore the account choices
            </a>
          </div>
        </article>
        <article>
          <h2>Connect the visit.</h2>
          <div>
            <p>
              Register the patient and their owner, then open a visit. Keep
              coordination notes alongside the primary clinical record.
            </p>
            <p>
              When something needs doing after the consultation, record the
              action and when it is due.
            </p>
          </div>
        </article>
        <article>
          <h2>Keep unfinished work visible.</h2>
          <div>
            <p>
              Review what is open, in progress or blocked. Give each action a
              responsible person. If work changes hands, the current owner
              remains responsible until the handover is accepted.
            </p>
          </div>
        </article>
        <article>
          <h2>Follow up after the visit.</h2>
          <div>
            <p>
              Record contact attempts and outcomes. Complete the task when the
              work is done. Ending a visit does not clear its outstanding
              actions.
            </p>
          </div>
        </article>
      </section>
      <section className="ed-next">
        <h2>Help shape the next version.</h2>
        <div>
          <p>
            Tell us where this guide needs more detail or where the workflow
            needs to fit your day better.
          </p>
          <a className="el-cta el-cta-secondary" href="/contact">
            Talk to Hub Animalia
          </a>
        </div>
      </section>
    </Page>
  );
}

export function AboutPage() {
  return (
    <Page
      title="Built around the people who care."
      image="about-hero"
      intro="Ellis is a veterinary practice management platform by Hub Animalia. We’re building it to help veterinary teams know what needs doing, who is responsible, and what has been completed, from arrival to follow-up."
    >
      <section className="ed-introduction ed-company">
        <h2>
          Meet
          <br />
          Hub Animalia.
        </h2>
        <div>
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
      <section className="ed-purpose">
        <article>
          <h2>Our vision.</h2>
          <p>
            Empowering every voice in veterinary care through intelligent
            technology, compassionate design, and unrelenting innovation.
          </p>
          <p>
            We envision veterinary professionals, breeders, pet owners and
            farmers connected through technology that supports better decisions,
            collaboration across borders and care shaped around real needs.
          </p>
        </article>
        <article>
          <h2>Our mission.</h2>
          <p>
            To develop a suite of versatile, intelligent tools that transform
            the veterinary experience from siloed workflows to an integrated,
            global community of care.
          </p>
          <p>
            We listen to people working in and around veterinary medicine,
            identify the difficulties they face and build practical tools to
            address them. Accessibility, continuous learning and feedback from
            the field guide that work.
          </p>
        </article>
      </section>
      <section className="ed-introduction">
        <h2>
          Where Ellis
          <br />
          comes in.
        </h2>
        <div>
          <p>
            A patient arrives. A consultation takes place. A result needs
            reviewing. Someone needs to follow up.
          </p>
          <p>
            Ellis focuses on the information and responsibilities that can get
            lost between these steps. We’re designing it to make pending work
            visible, with a clear owner and a record of what has been completed.
          </p>
          <p>
            Whether a vet works alone or a clinic has a team, the aim is the
            same: help care continue beyond the consultation.
          </p>
        </div>
      </section>
      <section className="ed-principles" aria-label="What guides Ellis">
        <article>
          <h3>Clarity.</h3>
          <p>Know what needs attention and what happens next.</p>
        </article>
        <article>
          <h3>Accountability.</h3>
          <p>
            Make responsibility clear, so important work has someone looking
            after it.
          </p>
        </article>
        <article>
          <h3>Follow-through.</h3>
          <p>
            Keep outstanding work visible until it has been completed, even
            after a patient leaves.
          </p>
        </article>
      </section>
      <section className="ed-founder">
        <div>
          <h2>A message from our founder.</h2>
          <blockquote>
            “Technology shouldn’t just connect us. It should empower us to care
            better.”
          </blockquote>
          <p>
            Fred Adekunle
            <br />
            <span>Founder, Hub Animalia</span>
          </p>
        </div>
        <img
          src="/photography/founder.webp"
          width="858"
          height="1080"
          alt="Fred Adekunle, founder of Hub Animalia"
          loading="lazy"
        />
      </section>
      <section className="ed-next">
        <h2>
          Let’s talk about
          <br />
          your working day.
        </h2>
        <div>
          <p>
            Have a question about Ellis or want to speak with the Hub Animalia
            team? We’d like to hear from you.
          </p>
          <a className="el-inline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <p>
            <a className="el-cta el-cta-secondary" href="/contact">
              All contact details
            </a>
          </p>
          <address>{contact.address}</address>
        </div>
      </section>
    </Page>
  );
}

export function ContactPage() {
  return (
    <Page
      title="Let’s talk about Ellis."
      image="contact-hero"
      intro="Have a question about Ellis or want to speak with the Hub Animalia team? We’d like to hear from you."
    >
      <section className="ed-contact">
        <div className="ed-contact-intro">
          <h2>Get in touch.</h2>
          <p>Choose the way that works for you.</p>
        </div>
        <div className="ed-contact-grid">
          <article>
            <h3>Email</h3>
            <a className="el-inline" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </article>
          <article>
            <h3>Find us</h3>
            <address>{contact.address}</address>
          </article>
        </div>
        <h3 className="ed-phone-heading">Phone / WhatsApp</h3>
        <div className="ed-phone-list">
          {contact.phones.map((number) => (
            <div key={number}>
              <span>{displayPhone(number)}</span>
              <a
                href={`tel:${number}`}
                aria-label={`Call ${displayPhone(number)}`}
              >
                Call
              </a>
              <a
                href={`https://wa.me/${number.slice(1)}`}
                aria-label={`WhatsApp ${displayPhone(number)}`}
              >
                WhatsApp
              </a>
            </div>
          ))}
        </div>
      </section>
    </Page>
  );
}
