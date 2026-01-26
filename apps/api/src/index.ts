import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { env } from "./lib/env";
import { auth } from "./routes/auth";
import { coursesRouter } from "./routes/courses";
import { chaptersRouter } from "./routes/chapters";
import { lessonsRouter } from "./routes/lessons";
import { chatRouter } from "./routes/chat";
import { notificationsRouter } from "./routes/notifications";
import { referralsRouter } from "./routes/referrals";
import { usersRouter } from "./routes/users";
import { purchasesRouter } from "./routes/purchases";
import { leaderboardRouter } from "./routes/leaderboard";
import { categoriesRouter } from "./routes/categories";
import { adminRouter } from "./routes/admin";
import { reportsRouter } from "./routes/reports";
import { feedbackRouter } from "./routes/feedback";

const app = new Hono();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(",").map(o => o.trim()),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/auth", auth);
app.route("/users", usersRouter);
app.route("/courses", coursesRouter);
app.route("/chapters", chaptersRouter);
app.route("/lessons", lessonsRouter);
app.route("/chat", chatRouter);
app.route("/notifications", notificationsRouter);
app.route("/referrals", referralsRouter);
app.route("/purchases", purchasesRouter);
app.route("/leaderboard", leaderboardRouter);
app.route("/categories", categoriesRouter);
app.route("/admin", adminRouter);
app.route("/reports", reportsRouter);
app.route("/feedback", feedbackRouter);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

console.log(`Starting server on port ${env.PORT}...`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server running at http://localhost:${env.PORT}`);

export default app;
