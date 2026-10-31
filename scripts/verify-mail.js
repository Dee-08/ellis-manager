// Checks DNS, TLS and authentication only. Does not send a message.
import { smtpTransport } from "../server/mail.js";
const transport = smtpTransport();
if (!transport) {
  console.error("SMTP configuration is incomplete.");
  process.exitCode = 1;
} else {
  try {
    await transport.verify();
    console.log("SMTP TLS and authentication verified. No message sent.");
  } catch (e) {
    console.error(
      "SMTP verification failed: " + (e.code || "connection_failed"),
    );
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}
