import cors, { type CorsOptions } from "cors";
import rateLimit from "express-rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

export class CorsOriginError extends Error {
  constructor() {
    super("Origin is not allowed");
    this.name = "CorsOriginError";
  }
}

export function parseAllowedOrigins(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const isSupportedProtocol = url.protocol === "http:" || url.protocol === "https:";
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isReplitPreview = url.hostname.endsWith(".replit.dev");
    return isSupportedProtocol && (isLocalhost || isReplitPreview);
  } catch {
    return false;
  }
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!origin) return true;

  if (parseAllowedOrigins(env.ALLOWED_ORIGINS).has(origin)) return true;

  return env.NODE_ENV !== "production" && isDevelopmentOrigin(origin);
}

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (isCorsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new CorsOriginError());
  },
};

export const corsMiddleware = cors(corsOptions);

export const sensitiveMutationLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
  },
});