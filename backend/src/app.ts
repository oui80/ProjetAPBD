import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  AuthService,
  EmailAlreadyUsedError,
  InvalidCredentialsError,
} from "./modules/auth/auth-service.js";
import type { AuthStore } from "./modules/auth/auth-store.js";

const sessionCookieName = "pace_session";
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});

type AppOptions = {
  store: AuthStore;
  sessionTtlMs: number;
  secureCookies: boolean;
  allowedOrigin?: string;
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
      path: "/",
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
      response.clearCookie(sessionCookieName, { path: "/" });
      apiError(response, 401, "UNAUTHENTICATED", "Session invalide ou expirée.");
      return null;
    }
    return user;
  }

  app.get("/api/health", async (_request, response, next) => {
    try {
      await options.store.healthcheck();
      response.json({ status: "ok" });
    } catch (error) {
      next(error);
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
      response.clearCookie(sessionCookieName, { path: "/" });
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
      if (user) response.json({ activities: [] });
    } catch (error) {
      next(error);
    }
  });

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
    console.error("Unhandled request error", error instanceof Error ? error.message : error);
    apiError(response, 500, "INTERNAL_ERROR", "Une erreur interne est survenue.");
  });

  return app;
}
