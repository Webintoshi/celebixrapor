import { HttpError, toErrorResponse, zodIssuesToDetails } from "@/lib/api-error";
import {
  makeDownloadFilename,
  requestBrowserlessPdf,
} from "@/lib/browserless";
import { getClientIp } from "@/lib/request-context";
import { getRateLimitStore } from "@/lib/rate-limit";
import { pdfConversionSchema } from "@/lib/schemas";
import { normalizeHtmlDocument, sanitizeHtmlMarkup } from "@/lib/sanitize";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { assertPublicHttpUrl } from "@/lib/url-safety";

export async function handlePdfConversionRequest(request: Request) {
  const requestId = crypto.randomUUID();
  const clientIp = getClientIp(request);
  const rateLimitStore = getRateLimitStore();

  let baseHeaders: HeadersInit | undefined;
  let releaseActiveLock: (() => Promise<void>) | undefined;

  try {
    const body = await request.json().catch(() => {
      throw new HttpError(
        400,
        "invalid_json",
        "Istek govdesi gecerli JSON olmali.",
      );
    });

    const parsed = pdfConversionSchema.safeParse(body);

    if (!parsed.success) {
      throw new HttpError(
        422,
        "validation_error",
        "Istek dogrulanamadi.",
        zodIssuesToDetails(parsed.error.issues),
      );
    }

    const windowLimit = await rateLimitStore.consumeWindow(clientIp);
    baseHeaders = windowLimit.headers;

    if (!windowLimit.allowed) {
      throw new HttpError(
        429,
        "rate_limit_exceeded",
        `Cok fazla deneme yapildi. ${windowLimit.retryAfter} saniye sonra tekrar deneyin.`,
        undefined,
        {
          ...windowLimit.headers,
          "Retry-After": String(windowLimit.retryAfter),
        },
      );
    }

    await verifyTurnstileToken({
      token: parsed.data.turnstileToken,
      ip: clientIp,
    });

    const activeLock = await rateLimitStore.acquireActive(clientIp, requestId);

    if (!activeLock.acquired) {
      throw new HttpError(
        429,
        "conversion_in_progress",
        `Bu IP icin zaten aktif bir donusum var. ${activeLock.retryAfter} saniye sonra tekrar deneyin.`,
        undefined,
        {
          ...windowLimit.headers,
          "Retry-After": String(activeLock.retryAfter),
        },
      );
    }

    releaseActiveLock = activeLock.release;

    const source =
      parsed.data.source.type === "html"
        ? buildHtmlSource(parsed.data.source.html)
        : await buildUrlSource(parsed.data.source.url);

    const upstream = await requestBrowserlessPdf({
      source,
      options: parsed.data.options,
      requestId,
    });

    const headers = new Headers(baseHeaders);
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${makeDownloadFilename(parsed.data.source.type)}"`,
    );
    headers.set("Cache-Control", "no-store");
    headers.set("X-Request-Id", requestId);

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error("[pdf-conversion]", {
        requestId,
        message: error instanceof Error ? error.message : "unexpected_error",
      });
    }

    return toErrorResponse(error, baseHeaders, requestId);
  } finally {
    await releaseActiveLock?.();
  }
}

function buildHtmlSource(html: string) {
  const sanitized = sanitizeHtmlMarkup(html);
  const normalized = normalizeHtmlDocument(sanitized);

  if (!normalized.trim()) {
    throw new HttpError(
      422,
      "unsafe_html",
      "HTML icerigi bos veya guvenli degil.",
    );
  }

  return {
    type: "html" as const,
    html: normalized,
  };
}

async function buildUrlSource(rawUrl: string) {
  const validated = await assertPublicHttpUrl(rawUrl);

  return {
    type: "url" as const,
    url: validated.toString(),
  };
}
