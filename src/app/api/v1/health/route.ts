import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const isConfigured = Boolean(
    process.env.BROWSERLESS_TOKEN && process.env.REDIS_URL,
  );

  return NextResponse.json(
    {
      status: isConfigured ? "ok" : "degraded",
      services: {
        browserless: Boolean(process.env.BROWSERLESS_TOKEN),
        redis: Boolean(process.env.REDIS_URL),
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
