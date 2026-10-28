import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { z } from "zod";
import {
  AuthService,
  EmailAlreadyUsedError,
  InvalidCredentialsError,
} from "./modules/auth/auth-service.js";
import type { AuthStore } from "./modules/auth/auth-store.js";
import type { ActivityStore } from "./modules/activities/activity-store.js";
import { decodeFit, InvalidFitError } from "./modules/activities/fit-decoder.js";

const sessionCookieName = "pace_session";
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});

type AppOptions = {
  store: AuthStore;
  activityStore: ActivityStore;
  sessionTtlMs: number;
  secureCookies: boolean;
  allowedOrigin?: string;
  cookiePath?: string;
  serveFrontend?: boolean;
};

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.cookie;
  if (!header) return null;

  for (const item of header.split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function apiError(response: Response, status: number, code: string, message: string): void {
  response.status(status).json({ error: { code, message } });
}

export function createApp(options: AppOptions): express.Express {
  const app = express();
  const auth = new AuthService(options.store, options.sessionTtlMs);
  const cookiePath = options.cookiePath ?? "/";
  const fitUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 10, fields: 0 },
  });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.use("/api", (request, response, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next();
    if (!options.allowedOrigin) return next();
    if (request.headers.origin === options.allowedOrigin) return next();
    apiError(response, 403, "INVALID_ORIGIN", "Origine de la requête refusée.");
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "TOO_MANY_ATTEMPTS",
        message: "Trop de tentatives. Réessayez dans quelques minutes.",
      },
    },
  });

  function setSessionCookie(response: Response, token: string): void {
    response.cookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: options.secureCookies,
      maxAge: options.sessionTtlMs,
      path: cookiePath,
    });
  }

  async function requireUser(request: Request, response: Response) {
    const token = cookieValue(request, sessionCookieName);
    if (!token) {
      apiError(response, 401, "UNAUTHENTICATED", "Authentification requise.");
      return null;
    }

    const user = await auth.session(token);
    if (!user) {
      response.clearCookie(sessionCookieName, { path: cookiePath });
      apiError(response, 401, "UNAUTHENTICATED", "Session invalide ou expirée.");
      return null;
    }
    return user;
  }

  async function requireUserMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await requireUser(request, response);
      if (user) {
        response.locals.user = user;
        next();
      }
    } catch (error) {
      next(error);
    }
  }

  app.get("/api/health", async (_request, response) => {
    try {
      await options.store.healthcheck();
      response.json({ status: "ok" });
    } catch {
      response.status(503).json({ status: "unavailable" });
    }
  });

  app.post("/api/auth/register", authLimiter, async (request, response, next) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      apiError(
        response,
        400,
        "INVALID_INPUT",
        "Utilisez un email valide et un mot de passe d’au moins 12 caractères.",
      );
      return;
    }

    try {
      const result = await auth.register(parsed.data.email, parsed.data.password);
      setSessionCookie(response, result.token);
      response.status(201).json({ user: result.user });
    } catch (error) {
      if (error instanceof EmailAlreadyUsedError) {
        apiError(response, 409, "EMAIL_ALREADY_USED", "Un compte existe déjà avec cet email.");
        return;
      }
      next(error);
    }
  });

  app.post("/api/auth/login", authLimiter, async (request, response, next) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      apiError(response, 401, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
      return;
    }

    try {
      const result = await auth.login(parsed.data.email, parsed.data.password);
      setSessionCookie(response, result.token);
      response.json({ user: result.user });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        apiError(response, 401, "INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
        return;
      }
      next(error);
    }
  });

  app.post("/api/auth/logout", async (request, response, next) => {
    const token = cookieValue(request, sessionCookieName);
    try {
      if (token) await auth.logout(token);
      response.clearCookie(sessionCookieName, { path: cookiePath });
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/session", async (request, response, next) => {
    try {
      const user = await requireUser(request, response);
      if (user) response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/activities", async (request, response, next) => {
    try {
      const user = await requireUser(request, response);
      if (user) {
        response.json({ activities: await options.activityStore.listActivities(user.id) });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/imports/fit",
    requireUserMiddleware,
    fitUpload.array("files", 10),
    async (request, response) => {
      const files = (request.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        apiError(response, 400, "NO_FILES", "Sélectionnez au moins un fichier FIT.");
        return;
      }

      const user = response.locals.user as { id: string };
      const results = [];
      for (const file of files) {
        if (!file.originalname.toLowerCase().endsWith(".fit")) {
          results.push({
            filename: file.originalname,
            status: "error",
            message: "Extension .fit requise.",
          });
          continue;
        }
        if (![
          "application/octet-stream",
          "application/vnd.ant.fit",
          "application/fit",
          "application/x-fit",
        ].includes(file.mimetype)) {
          results.push({
            filename: file.originalname,
            status: "error",
            message: "Type de fichier FIT invalide.",
          });
          continue;
        }

        try {
          const sha256 = createHash("sha256").update(file.buffer).digest("hex");
          const activity = decodeFit(file.buffer, {
            userId: user.id,
            filename: file.originalname,
            sha256,
          });
          const created = await options.activityStore.createActivity(activity);
          results.push({
            filename: file.originalname,
            status: created ? "imported" : "duplicate",
            ...(created ? { activityId: activity.id } : {}),
          });
        } catch (error) {
          results.push({
            filename: file.originalname,
            status: "error",
            message: error instanceof InvalidFitError
              ? "Fichier FIT invalide ou corrompu."
              : "Impossible d’enregistrer ce fichier.",
          });
        }
      }

      response.status(200).json({ results });
    },
  );

  if (options.serveFrontend) {
    const frontendDirectory = fileURLToPath(new URL("../../frontend/dist", import.meta.url));
    if (existsSync(frontendDirectory)) {
      app.use(express.static(frontendDirectory));
      app.use((request, response, next) => {
        if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
        response.sendFile(path.join(frontendDirectory, "index.html"));
      });
    }
  }

  app.use((_request, response) => {
    apiError(response, 404, "NOT_FOUND", "Ressource introuvable.");
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    void _next;
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      apiError(
        response,
        tooLarge ? 413 : 400,
        tooLarge ? "FILE_TOO_LARGE" : "INVALID_UPLOAD",
        tooLarge
          ? "Chaque fichier FIT doit peser au maximum 20 Mo."
          : "Envoi de fichiers invalide.",
      );
      return;
    }
    console.error("Unhandled request error", error instanceof Error ? error.message : error);
    apiError(response, 500, "INTERNAL_ERROR", "Une erreur interne est survenue.");
  });

  return app;
}
