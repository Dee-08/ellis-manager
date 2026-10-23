import { build } from "vite";

await build({
  define: { "import.meta.env.VITE_REVIEW_MODE": JSON.stringify("true") },
});
