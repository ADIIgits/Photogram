/* app.ts — Express application factory.
 * Configures middleware, mounts the API router, and attaches error handlers.
 * Exported as a bare Express instance so index.ts can bind it to a port,
 * and tests (if added later) can import it without starting the server. */

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler, notFound } from "./middlewares/error.middleware";

const app: Express = express();

/* HTTP request logger — logs method, path (without query string), and status.
 * Query strings are stripped to avoid logging potentially sensitive params. */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/* Allow requests from any origin (frontend runs on a different port in dev).
 * Tighten this in production by passing an allowlist to cors(). */
app.use(cors());

/* Parse JSON and URL-encoded bodies; 10 MB limit covers base64 image uploads */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* Mount all API routes under /api (e.g. /api/auth/login, /api/posts) */
app.use("/api", router);

/* 404 handler — catches any unmatched routes and returns { error: "Not found" } */
app.use(notFound);

/* Global error handler — formats thrown errors as JSON with the correct status */
app.use(errorHandler);

export default app;
