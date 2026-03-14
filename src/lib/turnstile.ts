import { HttpError } from "@/lib/api-error";

import { DEV_TURNSTILE_BYPASS_TOKEN } from "@/lib/pdf-contract";

interface VerifyTurnstileOptions {
  token: string;
  ip: string;
}

interface TurnstileResponse {
  success: boolean;
}

export async function verifyTurnstileToken({
  token,
  ip,
}: VerifyTurnstileOptions): Promise<void> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    throw new HttpError(
      503,
      "turnstile_not_configured",
      "Insan dogrulamasi henuz yapilandirilmadi.",
    );
  }

  if (!token || token === DEV_TURNSTILE_BYPASS_TOKEN) {
    throw new HttpError(
      422,
      "turnstile_validation_failed",
      "Insan dogrulamasi tamamlanmadi.",
    );
  }

  const payload = new URLSearchParams({
    secret: secretKey,
    response: token,
  });

  if (ip !== "unknown") {
    payload.set("remoteip", ip);
  }

  let response: Response;

  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
  } catch {
    throw new HttpError(
      503,
      "turnstile_unavailable",
      "Insan dogrulamasi servisine su an ulasilamiyor.",
    );
  }

  if (!response.ok) {
    throw new HttpError(
      503,
      "turnstile_unavailable",
      "Insan dogrulamasi servisi gecici olarak yanit vermiyor.",
    );
  }

  const result = (await response.json()) as TurnstileResponse;

  if (!result.success) {
    throw new HttpError(
      422,
      "turnstile_validation_failed",
      "Insan dogrulamasi basarisiz oldu.",
    );
  }
}
