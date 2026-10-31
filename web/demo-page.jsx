import React, { useState } from "react";
import { PublicHeader, PublicFooter } from "./landing";
import { api } from "./api";
import "./demo-page.css";

export default function DemoPage() {
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const preview = import.meta.env.VITE_REVIEW_MODE === "true";
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setReceipt(
        await api("/demo-requests", {
          ...fields,
          key,
          consent: fields.consent === "on",
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ellis-landing">
      <a className="skip" href="#demo-main">
        Skip to content
      </a>
      <PublicHeader solid />
      <main id="demo-main" className="demo-page">
        <header>
          <h1>Book a Demo</h1>
          <p>
            Tell us about your practice and what you’d like to explore in Ellis.
          </p>
          <p>
            Share a time that suits you, including your timezone. This is a
            request; an appointment is confirmed separately.
          </p>
        </header>
        {receipt ? (
          <section role="status">
            <h2>Request received.</h2>
            <p>{receipt.message}</p>
            <p>Reference: {receipt.id}</p>
            <a href="/">Return to Ellis</a>
          </section>
        ) : (
          <form onSubmit={submit} className="demo-form">
            {preview && (
              <p role="status">
                Demo requests are unavailable in this static design preview.
              </p>
            )}
            <label>
              Your name
              <input name="name" autoComplete="name" maxLength={120} required />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label>
              Phone number (optional)
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
              />
            </label>
            <label>
              Practice name (optional)
              <input
                name="practiceName"
                autoComplete="organization"
                maxLength={120}
              />
            </label>
            <label>
              Practice type
              <select name="practiceType" required>
                <option value="personal">Personal practice</option>
                <option value="clinic">Clinic</option>
              </select>
            </label>
            <label>
              Timezone
              <input
                name="timezone"
                defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                required
              />
            </label>
            <label>
              Preferred day and time (optional)
              <input name="preferredTime" maxLength={200} />
            </label>
            <label>
              What would you like to discuss? (optional)
              <textarea name="details" rows={4} maxLength={2000} />
            </label>
            <p className="demo-hint">
              Please don’t include patient or client information.
            </p>
            <label className="demo-consent">
              <input name="consent" type="checkbox" required /> I agree that Hub
              Animalia may store these details and contact me about this demo
              request.
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="el-cta" disabled={busy || preview}>
              {busy ? "Saving request…" : "Request a demo"}
            </button>
          </form>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
