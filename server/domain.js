export class Problem extends Error {
  constructor(status, message, code = "request_failed") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const capabilities = [
  "appointment.view",
  "appointment.manage",
  "patients.view",
  "patients.edit",
  "notes.view",
  "notes.draft",
  "notes.sign",
  "visits.manage",
  "tasks.team",
  "tasks.create",
  "tasks.complete",
  "tasks.reassign",
  "staff.manage",
  "audit.view",
  "settings.manage",
  "data.export",
];
export function requireCap(actor, cap) {
  if (!actor.capabilities.includes(cap))
    throw new Problem(403, "You do not have permission for this action.");
}
export function version(record, expected) {
  if (record.version !== expected)
    throw new Problem(
      409,
      "This record changed. Refresh and compare before retrying; your unsaved changes are still in the form.",
    );
}
export function taskTransition(from, to, reason) {
  const allowed = {
    open: ["in_progress", "blocked", "completed", "cancelled"],
    in_progress: ["open", "blocked", "completed", "cancelled"],
    blocked: ["open", "in_progress", "cancelled"],
    completed: ["open"],
    cancelled: [],
  };
  if (!allowed[from]?.includes(to))
    throw new Problem(409, "This task transition is not available.");
  if (
    (["blocked", "cancelled"].includes(to) || from === "completed") &&
    !reason?.trim()
  )
    throw new Problem(400, "A reason is required.");
}
export function visitTransition(from, to, reason) {
  const allowed = {
    waiting: ["in_consultation", "ended", "cancelled"],
    in_consultation: ["ended", "cancelled"],
    ended: ["in_consultation"],
    cancelled: [],
  };
  if (!allowed[from]?.includes(to))
    throw new Problem(409, "This visit transition is not available.");
  if ((to === "cancelled" || from === "ended") && !reason?.trim())
    throw new Problem(400, "A reason is required.");
}
