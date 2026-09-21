import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { publicRouter } from "./routes/public";
import { adminRouter } from "./routes/admin";
import { createSessionMiddleware } from "./auth";
import { log, setupVite, serveStatic } from "./vite";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(createSessionMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  let capturedBody: unknown;
  res.json = (body: unknown) => {
    capturedBody = body;
    return originalJson(body);
  };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedBody) {
        const short = JSON.stringify(capturedBody);
        line += ` :: ${short.length > 120 ? short.slice(0, 120) + "…" : short}`;
      }
      log(line);
    }
  });
  next();
});

app.use("/api/admin", adminRouter);
app.use("/api", publicRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(err);
  res.status(status).json({ message });
});

const server = createServer(app);

async function main() {
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Nuée Tavern & Bar server listening on port ${port}`);
  });
}

main();
