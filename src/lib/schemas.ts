import { z } from "zod";

import {
  DEFAULT_PDF_OPTIONS,
  MAX_HTML_LENGTH,
  MAX_URL_LENGTH,
  PDF_FORMATS,
  PDF_ORIENTATIONS,
} from "@/lib/pdf-contract";

const DEFAULT_SCHEMA_OPTIONS = {
  ...DEFAULT_PDF_OPTIONS,
  scale: DEFAULT_PDF_OPTIONS.scale ?? 1,
};

const htmlSourceSchema = z.strictObject({
  type: z.literal("html"),
  html: z
    .string()
    .trim()
    .min(1, "HTML icerigi zorunludur.")
    .max(
      MAX_HTML_LENGTH,
      `HTML icerigi en fazla ${MAX_HTML_LENGTH.toLocaleString("tr-TR")} karakter olabilir.`,
    ),
});

const urlSourceSchema = z.strictObject({
  type: z.literal("url"),
  url: z
    .string()
    .trim()
    .min(1, "Link zorunludur.")
    .max(MAX_URL_LENGTH, "Link cok uzun."),
});

export const pdfOptionsSchema = z
  .strictObject({
    format: z.enum(PDF_FORMATS).default(DEFAULT_SCHEMA_OPTIONS.format),
    orientation: z
      .enum(PDF_ORIENTATIONS)
      .default(DEFAULT_SCHEMA_OPTIONS.orientation),
    marginMm: z.coerce
      .number()
      .int("Kenar boslugu tam sayi olmali.")
      .min(0, "Kenar boslugu negatif olamaz.")
      .max(40, "Kenar boslugu 40 mm'den buyuk olamaz.")
      .default(DEFAULT_SCHEMA_OPTIONS.marginMm),
    printBackground: z
      .boolean()
      .default(DEFAULT_SCHEMA_OPTIONS.printBackground),
    preferCssPageSize: z
      .boolean()
      .default(DEFAULT_SCHEMA_OPTIONS.preferCssPageSize),
    scale: z.coerce
      .number()
      .min(0.5, "Olcek en az 0.5 olabilir.")
      .max(1.5, "Olcek en fazla 1.5 olabilir.")
      .default(DEFAULT_SCHEMA_OPTIONS.scale),
  })
  .default(DEFAULT_SCHEMA_OPTIONS);

export const pdfConversionSchema = z.strictObject({
  source: z.discriminatedUnion("type", [htmlSourceSchema, urlSourceSchema]),
  options: pdfOptionsSchema,
});
