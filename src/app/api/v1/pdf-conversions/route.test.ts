import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/pdf-conversions/route";
import { HttpError } from "@/lib/api-error";
import { DEFAULT_PDF_OPTIONS } from "@/lib/pdf-contract";
import * as pdfRenderer from "@/lib/pdf-renderer";
import { resetRateLimitStoreForTests } from "@/lib/rate-limit";

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
);

describe("POST /api/v1/pdf-conversions", () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    resetRateLimitStoreForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams a PDF for sanitized HTML input", async () => {
    const renderPdfMock = vi
      .spyOn(pdfRenderer, "renderPdf")
      .mockResolvedValue(SAMPLE_PDF);

    const response = await POST(
      makeRequest({
        source: {
          type: "html",
          html: '<div onclick="alert(1)"><h1>Merhaba</h1></div>',
        },
        options: DEFAULT_PDF_OPTIONS,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(renderPdfMock).toHaveBeenCalledTimes(1);
    await expect(response.arrayBuffer()).resolves.toBeTruthy();

    const [{ source }] = renderPdfMock.mock.calls[0] ?? [];
    expect(source).toMatchObject({
      type: "html",
      html: expect.stringContaining("<h1>Merhaba</h1>"),
    });
    expect(source).not.toMatchObject({
      html: expect.stringContaining("onclick"),
    });
  });

  it("returns 429 after the anonymous limit is exceeded", async () => {
    vi.spyOn(pdfRenderer, "renderPdf").mockResolvedValue(SAMPLE_PDF);

    for (let index = 0; index < 6; index += 1) {
      const response = await POST(
        makeRequest(
          {
            source: {
              type: "html",
              html: `<h1>Run ${index}</h1>`,
            },
            options: DEFAULT_PDF_OPTIONS,
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
        },
        "203.0.113.15",
      ),
    );

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("maps renderer startup errors to a temporary unavailability response", async () => {
    vi.spyOn(pdfRenderer, "renderPdf").mockRejectedValue(
      new HttpError(
        503,
        "pdf_engine_unavailable",
        "PDF motoru su an baslatilamiyor.",
      ),
    );

    const response = await POST(
      makeRequest({
        source: {
          type: "html",
          html: "<h1>Busy</h1>",
        },
        options: DEFAULT_PDF_OPTIONS,
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "pdf_engine_unavailable",
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
