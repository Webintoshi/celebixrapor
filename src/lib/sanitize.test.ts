import { describe, expect, it } from "vitest";

import { sanitizeHtmlMarkup } from "@/lib/sanitize";

describe("sanitizeHtmlMarkup", () => {
  it("removes scripts, embeds, and inline event handlers", () => {
    const sanitized = sanitizeHtmlMarkup(
      '<div onclick="alert(1)"><script>alert(1)</script><iframe src="https://evil.test"></iframe><p>Merhaba</p></div>',
    );

    expect(sanitized).toContain("<p>Merhaba</p>");
    expect(sanitized).not.toContain("script");
    expect(sanitized).not.toContain("iframe");
    expect(sanitized).not.toContain("onclick");
  });
});
