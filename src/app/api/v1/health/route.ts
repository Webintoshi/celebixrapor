import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const isConfigured = Boolean(
    process.env.BROWSERLESS_TOKEN &&
      process.env.REDIS_URL &&
      process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );

  const statusCode =
    isConfigured || process.env.NODE_ENV !== "production" ? 200 : 503;

  return NextResponse.json(
    {
      status: statusCode === 200 ? "ok" : "degraded",
      services: {
        browserless: Boolean(process.env.BROWSERLESS_TOKEN),
        redis: Boolean(process.env.REDIS_URL),
        turnstileSecret: Boolean(process.env.TURNSTILE_SECRET_KEY),
        turnstileSiteKey: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      },
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
