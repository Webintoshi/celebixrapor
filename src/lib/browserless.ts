import { HttpError } from "@/lib/api-error";
import {
  BROWSERLESS_NAVIGATION_TIMEOUT_MS,
  BROWSERLESS_REQUEST_TIMEOUT_MS,
  DEFAULT_BROWSERLESS_ENDPOINT,
  type PdfOptionsInput,
  type PdfSourceInput,
} from "@/lib/pdf-contract";

const BLOCKED_RESOURCE_PATTERNS = [
  "/(^|:\\/\\/)(localhost|0\\.0\\.0\\.0|127\\.0\\.0\\.1)(:\\d+)?(\\/|$)/i",
  "/(^|:\\/\\/)(10\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[0-1])\\.)/i",
  "/(^|:\\/\\/)(169\\.254\\.|100\\.(6[4-9]|[7-9]\\d|1[01]\\d|12[0-7])\\.)/i",
  "/(^|:\\/\\/)(\\[::1\\]|\\[fe80:|\\[fc|\\[fd)/i",
  "/(^|\\.)((internal)|(local)|(localhost)|(home)|(lan))(\\/|$)/i",
];

interface BrowserlessPayload {
  url?: string;
  html?: string;
  options: Record<string, unknown>;
  gotoOptions: {
    timeout: number;
    waitUntil: "networkidle2";
  };
  rejectRequestPattern: string[];
}

export function mapPdfOptionsToBrowserless(options: PdfOptionsInput) {
  return {
    format: options.format,
    landscape: options.orientation === "landscape",
    margin: {
      top: `${options.marginMm}mm`,
      right: `${options.marginMm}mm`,
      bottom: `${options.marginMm}mm`,
      left: `${options.marginMm}mm`,
    },
    printBackground: options.printBackground,
    preferCSSPageSize: options.preferCssPageSize,
    ...(options.scale ? { scale: Number(options.scale.toFixed(2)) } : {}),
  };
}

export async function requestBrowserlessPdf({
  source,
  options,
  requestId,
}: {
  source: PdfSourceInput;
  options: PdfOptionsInput;
  requestId: string;
}): Promise<Response> {
  const endpoint = process.env.BROWSERLESS_ENDPOINT ?? DEFAULT_BROWSERLESS_ENDPOINT;
  const token = process.env.BROWSERLESS_TOKEN;

  if (!token) {
    throw new HttpError(
      503,
      "browserless_not_configured",
      "PDF motoru henuz yapilandirilmadi.",
    );
  }

  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set("token", token);

  const payload: BrowserlessPayload = {
    options: mapPdfOptionsToBrowserless(options),
    gotoOptions: {
      timeout: BROWSERLESS_NAVIGATION_TIMEOUT_MS,
      waitUntil: "networkidle2",
    },
    rejectRequestPattern: BLOCKED_RESOURCE_PATTERNS,
    ...(source.type === "html" ? { html: source.html } : { url: source.url }),
  };

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(BROWSERLESS_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HttpError(
        503,
        "upstream_timeout",
        "PDF olusturma zaman asimina ugradi. Lutfen tekrar deneyin.",
      );
    }

    throw new HttpError(
      502,
      "upstream_unavailable",
      "PDF motoruna su an ulasilamiyor.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || !contentType.includes("application/pdf")) {
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      throw new HttpError(
        503,
        "upstream_busy",
        "PDF motoru gecici olarak yogun. Kisa sure sonra tekrar deneyin.",
      );
    }

    throw new HttpError(
      502,
      "upstream_failed",
      "PDF motoru belgeyi isleyemedi.",
    );
  }

  if (!response.body) {
    throw new HttpError(
      502,
      "empty_pdf",
      "PDF motoru bos bir yanit dondurdu.",
    );
  }

  return response;
}

export function makeDownloadFilename(sourceType: PdfSourceInput["type"]): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:]/g, "-")
    .replace(/\..+/, "")
    .replace("T", "_");

  return `${sourceType}-to-pdf-${stamp}.pdf`;
}
