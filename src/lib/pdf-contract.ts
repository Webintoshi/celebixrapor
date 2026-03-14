export const PDF_FORMATS = ["A4", "Letter", "Legal"] as const;
export const PDF_ORIENTATIONS = ["portrait", "landscape"] as const;

export type PdfFormat = (typeof PDF_FORMATS)[number];
export type PdfOrientation = (typeof PDF_ORIENTATIONS)[number];

export interface PdfOptionsInput {
  format: PdfFormat;
  orientation: PdfOrientation;
  marginMm: number;
  printBackground: boolean;
  preferCssPageSize: boolean;
  scale?: number;
}

export type PdfSourceInput =
  | {
      type: "html";
      html: string;
    }
  | {
      type: "url";
      url: string;
    };

export interface PdfConversionRequest {
  source: PdfSourceInput;
  options: PdfOptionsInput;
  turnstileToken: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
  code: string;
}

export const DEFAULT_PDF_OPTIONS: PdfOptionsInput = {
  format: "A4",
  orientation: "portrait",
  marginMm: 12,
  printBackground: true,
  preferCssPageSize: false,
  scale: 1,
};

export const PDF_RATE_LIMIT = 6;
export const PDF_RATE_WINDOW_MS = 10 * 60 * 1000;
export const ACTIVE_CONVERSION_TTL_MS = 45 * 1000;
export const BROWSERLESS_NAVIGATION_TIMEOUT_MS = 25 * 1000;
export const BROWSERLESS_REQUEST_TIMEOUT_MS = 40 * 1000;
export const MAX_HTML_LENGTH = 200_000;
export const MAX_URL_LENGTH = 2_048;
export const DEFAULT_BROWSERLESS_ENDPOINT =
  "https://production-sfo.browserless.io/pdf";
export const DEV_TURNSTILE_BYPASS_TOKEN = "dev-bypass-token";
