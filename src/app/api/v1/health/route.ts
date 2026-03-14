import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      services: {
        redis: Boolean(process.env.REDIS_URL),
        renderer: "embedded-chromium",
        rateLimitStore: process.env.REDIS_URL ? "redis" : "memory",
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
