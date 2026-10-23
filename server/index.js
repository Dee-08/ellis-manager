import { createApp } from "./app.js";
const app = createApp();
app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log("Ellis API ready."),
);
export default app;
