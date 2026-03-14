const FORBIDDEN_BLOCK_TAGS = ["script", "iframe", "object", "embed"];
const EVENT_HANDLER_PATTERN = /\s+on[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL_PATTERN =
  /\s+(href|src|xlink:href|formaction)\s*=\s*(?:"\s*(?:javascript|vbscript|data):[^"]*"|'\s*(?:javascript|vbscript|data):[^']*'|(?:javascript|vbscript|data):[^\s>]+)/gi;
const SRCDOC_PATTERN = /\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

export function sanitizeHtmlMarkup(input: string): string {
  let sanitized = input;

  for (const tag of FORBIDDEN_BLOCK_TAGS) {
    const blockPattern = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`,
      "gi",
    );
    const selfClosingPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");

    sanitized = sanitized.replace(blockPattern, "");
    sanitized = sanitized.replace(selfClosingPattern, "");
  }

  sanitized = sanitized.replace(EVENT_HANDLER_PATTERN, "");
  sanitized = sanitized.replace(JAVASCRIPT_URL_PATTERN, " $1=\"#\"");
  sanitized = sanitized.replace(SRCDOC_PATTERN, "");

  return sanitized.trim();
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
