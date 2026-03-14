import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/pdf-conversions/route";
import { DEFAULT_PDF_OPTIONS, DEV_TURNSTILE_BYPASS_TOKEN } from "@/lib/pdf-contract";
import { resetRateLimitStoreForTests } from "@/lib/rate-limit";

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
);

describe("POST /api/v1/pdf-conversions", () => {
  beforeEach(() => {
    process.env.BROWSERLESS_TOKEN = "browserless-token";
    delete process.env.REDIS_URL;
    delete process.env.TURNSTILE_SECRET_KEY;
    resetRateLimitStoreForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams a PDF for sanitized HTML input", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(SAMPLE_PDF, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        source: {
          type: "html",
          html: '<div onclick="alert(1)"><h1>Merhaba</h1></div>',
        },
        options: DEFAULT_PDF_OPTIONS,
        turnstileToken: DEV_TURNSTILE_BYPASS_TOKEN,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const payload = JSON.parse(String(init?.body)) as { html?: string };

    expect(payload.html).toContain("<h1>Merhaba</h1>");
    expect(payload.html).not.toContain("onclick");
  });

  it("fails when turnstile verification is rejected", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        source: {
          type: "html",
          html: "<h1>Blocked</h1>",
        },
        options: DEFAULT_PDF_OPTIONS,
        turnstileToken: "bad-token",
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "turnstile_validation_failed",
      },
    });
  });

  it("returns 429 after the anonymous limit is exceeded", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(SAMPLE_PDF, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    for (let index = 0; index < 6; index += 1) {
      const response = await POST(
        makeRequest(
          {
            source: {
              type: "html",
              html: `<h1>Run ${index}</h1>`,
            },
            options: DEFAULT_PDF_OPTIONS,
            turnstileToken: DEV_TURNSTILE_BYPASS_TOKEN,
          },
          "203.0.113.15",
        ),
      );

      expect(response.status).toBe(200);
    }

    const blocked = await POST(
      makeRequest(
        {
          source: {
            type: "html",
            html: "<h1>Blocked</h1>",
          },
          options: DEFAULT_PDF_OPTIONS,
          turnstileToken: DEV_TURNSTILE_BYPASS_TOKEN,
        },
        "203.0.113.15",
      ),
    );

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("maps browserless server errors to a temporary unavailability response", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response("busy", {
        status: 503,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        source: {
          type: "html",
          html: "<h1>Busy</h1>",
        },
        options: DEFAULT_PDF_OPTIONS,
        turnstileToken: DEV_TURNSTILE_BYPASS_TOKEN,
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "upstream_busy",
      },
    });
  });
});

function makeRequest(body: unknown, ip = "198.51.100.10") {
  return new Request("http://localhost/api/v1/pdf-conversions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}
