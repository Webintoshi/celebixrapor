import { describe, expect, it } from "vitest";

import {
  makeDownloadFilename,
  mapPdfOptionsToRenderer,
} from "@/lib/pdf-renderer";

describe("mapPdfOptionsToRenderer", () => {
  it("maps public API options to playwright pdf options", () => {
    const mapped = mapPdfOptionsToRenderer({
      format: "A4",
      orientation: "landscape",
      marginMm: 18,
      printBackground: true,
      preferCssPageSize: false,
      scale: 1.2,
    });

    expect(mapped).toEqual({
      format: "A4",
      landscape: true,
      margin: {
        top: "18mm",
        right: "18mm",
        bottom: "18mm",
        left: "18mm",
      },
      printBackground: true,
      preferCSSPageSize: false,
      scale: 1.2,
    });
  });

  it("creates a predictable filename shape", () => {
    const filename = makeDownloadFilename("html");

    expect(filename.startsWith("html-to-pdf-")).toBe(true);
    expect(filename.endsWith(".pdf")).toBe(true);
  });
});
