import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const isConfigured = Boolean(
    process.env.BROWSERLESS_TOKEN &&
      process.env.REDIS_URL &&
      process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );

  return NextResponse.json(
    {
      status: isConfigured ? "ok" : "degraded",
      services: {
        browserless: Boolean(process.env.BROWSERLESS_TOKEN),
        redis: Boolean(process.env.REDIS_URL),
        turnstileSecret: Boolean(process.env.TURNSTILE_SECRET_KEY),
        turnstileSiteKey: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
