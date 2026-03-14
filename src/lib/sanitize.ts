import DOMPurify from "isomorphic-dompurify";

const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed"];
let hooksInstalled = false;

function getPurifier() {
  if (!hooksInstalled) {
    DOMPurify.addHook("uponSanitizeAttribute", (_, data) => {
      if (data.attrName && data.attrName.toLowerCase().startsWith("on")) {
        data.keepAttr = false;
      }
    });

    hooksInstalled = true;
  }

  return DOMPurify;
}

export function sanitizeHtmlMarkup(input: string): string {
  return getPurifier().sanitize(input, {
    FORBID_TAGS: FORBIDDEN_TAGS,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
}

export function normalizeHtmlDocument(html: string): string {
  const trimmed = html.trim();

  if (!trimmed) {
    return "";
  }

  if (/<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  return [
    "<!DOCTYPE html>",
    '<html lang="tr">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<style>html,body{margin:0;padding:0;background:#fff;color:#111827;}</style>",
    "</head>",
    `<body>${trimmed}</body>`,
    "</html>",
  ].join("");
}

export function buildPreviewDocument(html: string): string {
  const normalized = normalizeHtmlDocument(html);

  if (!normalized) {
    return normalizeHtmlDocument(
      '<section style="display:grid;place-items:center;min-height:100vh;background:#faf7ef;color:#4b5563;font:500 16px/1.6 Manrope,system-ui,sans-serif;"><div style="text-align:center;max-width:28rem;padding:2rem;"><strong style="display:block;margin-bottom:0.5rem;color:#111827;">Canli onizleme burada gorunecek.</strong>HTML ekleyince sanitize edilmis surumu bu alanda izleyebilirsiniz.</div></section>',
    );
  }

  return normalized;
}
