import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Problem } from "./domain.js";
import nodemailer from "nodemailer";

export function smtpTransport() {
  const port = Number(process.env.MAIL_PORT);
  if (
    !process.env.MAIL_HOST ||
    !process.env.MAIL_USERNAME ||
    !process.env.MAIL_PASSWORD ||
    !process.env.MAIL_FROM_ADDRESS ||
    ![465, 587].includes(port)
  )
    return null;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

// Explicit local delivery adapter. Never enabled implicitly or in production.
// Messages remain private, ignored files; no no-op claims of delivery.
export function mailAdapter() {
  if (
    process.env.AUTH_MAIL_MODE === "local" &&
    process.env.NODE_ENV === "development"
  ) {
    return async (message) => {
      await mkdir(".local/mail", { recursive: true });
      await writeFile(
        `.local/mail/${randomUUID()}.json`,
        JSON.stringify(message),
        { mode: 0o600 },
      );
      return { delivery: "local_mailbox" };
    };
  }
  if (process.env.AUTH_MAIL_MODE !== "smtp" || process.env.NODE_ENV === "test")
    return null;
  const transport = smtpTransport();
  if (!transport) return null;
  return async ({ to, purpose, url }) => {
    const labels = {
      verify: "Verify your Ellis email",
      reset: "Reset your Ellis password",
      invitation: "Your invitation to Ellis",
    };
    if (!labels[purpose]) throw new Error("Unsupported mail purpose");
    const link = new URL(url),
      origin = new URL(process.env.APP_ORIGIN);
    if (link.origin !== origin.origin)
      throw new Error("Invalid mail link origin");
    const result = await transport.sendMail({
      from: {
        name: process.env.MAIL_FROM_NAME || "Ellis",
        address: process.env.MAIL_FROM_ADDRESS,
      },
      to,
      subject: labels[purpose],
      text: `${labels[purpose]}\n\nOpen this link to continue:\n${link.href}\n\nIf you did not request this, you can ignore this message.\n\nEllis · Keep care moving.`,
    });
    if (!result.accepted?.length)
      throw new Error("Mail was not accepted by the provider");
    return { delivery: "smtp_accepted" };
  };
}
export function requireDelivery(deliver) {
  if (!deliver)
    throw new Problem(
      503,
      "Email delivery is not configured. No email has been sent.",
      "mail_unavailable",
    );
}
