import net from "node:net";

import { chromium, type Browser } from "playwright";

import { HttpError } from "@/lib/api-error";
import {
  PDF_NAVIGATION_TIMEOUT_MS,
  PDF_RENDER_TIMEOUT_MS,
  type PdfOptionsInput,
  type PdfSourceInput,
} from "@/lib/pdf-contract";
import { isPublicIp } from "@/lib/url-safety";

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
const BLOCKED_SUFFIXES = [
  ".internal",
  ".local",
  ".localhost",
  ".test",
  ".invalid",
  ".home",
  ".lan",
];

let browserPromise: Promise<Browser> | null = null;

interface RendererPdfOptions {
  format: PdfOptionsInput["format"];
  landscape: boolean;
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground: boolean;
  preferCSSPageSize: boolean;
  scale?: number;
}

export function mapPdfOptionsToRenderer(
  options: PdfOptionsInput,
): RendererPdfOptions {
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

export async function renderPdf({
  source,
  options,
}: {
  source: PdfSourceInput;
  options: PdfOptionsInput;
}): Promise<Uint8Array> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 900,
    },
  });

  try {
    await context.route("**/*", async (route) => {
      if (isAllowedResourceUrl(route.request().url())) {
        await route.continue();
        return;
      }

      await route.abort("blockedbyclient");
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(PDF_NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);

    if (source.type === "html") {
      await page.setContent(source.html, {
        waitUntil: "networkidle",
        timeout: PDF_NAVIGATION_TIMEOUT_MS,
      });
    } else {
      await page.goto(source.url, {
        waitUntil: "networkidle",
        timeout: PDF_NAVIGATION_TIMEOUT_MS,
      });
    }

    return await page.pdf(mapPdfOptionsToRenderer(options));
  } catch (error) {
    throw mapRendererError(error);
  } finally {
    await context.close();
  }
}

export function makeDownloadFilename(sourceType: PdfSourceInput["type"]): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[:]/g, "-")
    .replace(/\..+/, "")
    .replace("T", "_");

  return `${sourceType}-to-pdf-${stamp}.pdf`;
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }

  try {
    return await browserPromise;
  } catch (error) {
    browserPromise = null;
    throw mapRendererError(error);
  }
}

function mapRendererError(error: unknown): HttpError {
  const message = error instanceof Error ? error.message : "unknown_error";

  if (message.includes("Executable doesn't exist")) {
    return new HttpError(
      503,
      "pdf_engine_unavailable",
      "PDF motoru sunucuda hazir degil.",
    );
  }

  if (message.includes("Timeout")) {
    return new HttpError(
      503,
      "render_timeout",
      "PDF olusturma zaman asimina ugradi. Lutfen tekrar deneyin.",
    );
  }

  if (
    message.includes("browserType.launch") ||
    message.includes("Failed to launch") ||
    message.includes("Host system is missing dependencies")
  ) {
    return new HttpError(
      503,
      "pdf_engine_unavailable",
      "PDF motoru su an baslatilamiyor.",
    );
  }

  return new HttpError(
    502,
    "render_failed",
    "PDF motoru belgeyi isleyemedi.",
  );
}

function isAllowedResourceUrl(rawUrl: string): boolean {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return false;
  }

  if (["about:", "data:", "blob:"].includes(parsedUrl.protocol)) {
    return true;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return false;
  }

  if (parsedUrl.username || parsedUrl.password) {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (!hostname || BLOCKED_HOSTNAMES.has(hostname)) {
    return false;
  }

  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return false;
  }

  const ipVersion = net.isIP(hostname);

  if (ipVersion > 0) {
    return isPublicIp(hostname);
  }

  if (!hostname.includes(".")) {
    return false;
  }

  return true;
}
