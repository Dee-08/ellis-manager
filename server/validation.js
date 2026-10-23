import { z } from "zod";
export { z };
export const text = z.string().trim().min(1).max(120);
export const optional = z.string().trim().max(500).default("");
export const uuid = z.uuid();
export const ver = z.number().int().positive();
export const password = z.string().min(12).max(128);
export const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const timezone = z.string().refine((v) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}, "Use a valid IANA timezone, such as Africa/Lagos.");
export function parse(schema, body) {
  return schema.strict().parse(body);
}
export function page(query) {
  return z
    .object({
      offset: z.coerce.number().int().min(0).max(100000).default(0),
      q: z.string().max(100).default(""),
    })
    .parse(query);
}
