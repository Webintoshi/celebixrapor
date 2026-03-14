"use client";

import dynamic from "next/dynamic";
import { startTransition, useDeferredValue, useId, useState } from "react";

import {
  DEFAULT_PDF_OPTIONS,
  type PdfConversionRequest,
  type PdfOptionsInput,
} from "@/lib/pdf-contract";
import { buildPreviewDocument, sanitizeHtmlMarkup } from "@/lib/sanitize";
import { htmlTemplates } from "@/lib/templates";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-[480px] place-items-center rounded-[1.5rem] border border-[var(--line)] bg-[#171d2b] text-sm text-white/70">
      Editor yukleniyor...
    </div>
  ),
});

type SourceMode = "html" | "url";

const DEFAULT_URL = "https://example.com";

export function PdfStudio() {
  const [mode, setMode] = useState<SourceMode>("html");
  const [htmlValue, setHtmlValue] = useState<string>(htmlTemplates[0].html);
  const [urlValue, setUrlValue] = useState(DEFAULT_URL);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    htmlTemplates[0].id,
  );
  const [options, setOptions] = useState<PdfOptionsInput>(DEFAULT_PDF_OPTIONS);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const advancedSectionId = useId();
  const deferredHtml = useDeferredValue(htmlValue);

  const previewDocument =
    mode === "html"
      ? buildPreviewDocument(sanitizeHtmlMarkup(deferredHtml))
      : buildPreviewDocument(
          `<section style="display:grid;place-items:center;min-height:100vh;background:#fff7ec;color:#475569;font:500 16px/1.8 Manrope,system-ui,sans-serif;padding:40px;"><div style="max-width:30rem;text-align:center;"><div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#a67a34;margin-bottom:12px;">Link modu</div><h2 style="margin:0 0 16px;font:700 28px/1.1 Newsreader,Georgia,serif;color:#111827;">Public sayfa PDF'e donusecek.</h2><p style="margin:0;">Gecerli bir <strong>${escapeHtml(
            urlValue || DEFAULT_URL,
          )}</strong> linki gonderdiginizde PDF motoru bu sayfayi isleyip dogrudan indirme baslatir.</p></div></section>`,
        );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    setIsSubmitting(true);

    const payload: PdfConversionRequest = {
      source:
        mode === "html"
          ? {
              type: "html",
              html: htmlValue,
            }
          : {
              type: "url",
              url: urlValue,
            },
      options,
    };

    try {
      const response = await fetch("/api/v1/pdf-conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseError = (await response
          .json()
          .catch(() => null)) as { error?: { message?: string } } | null;

        throw new Error(
          responseError?.error?.message ??
            "Belge olusturulamadi. Lutfen tekrar deneyin.",
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ??
        `pdf-${Date.now().toString()}.pdf`;

      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);

      setDownloadCount((current) => current + 1);
      setNotice("PDF hazirlandi. Indirme baslatildi.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Belge olusturulamadi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function applyTemplate(templateId: string) {
    const template = htmlTemplates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    startTransition(() => {
      setMode("html");
      setSelectedTemplateId(template.id);
      setHtmlValue(template.html);
      setNotice(`"${template.title}" sablonu editore yerlestirildi.`);
      setError(null);
    });
  }

  function updateOption<K extends keyof PdfOptionsInput>(
    key: K,
    value: PdfOptionsInput[K],
  ) {
    setOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section className="glass-panel rounded-[2.5rem] p-4 shadow-[0_30px_100px_rgba(17,24,39,0.16)] sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="section-panel rounded-[2rem] p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                Conversion Studio
              </div>
              <div className="text-sm text-[var(--ink-soft)]">
                HTML veya public URL verin, ayni oturumda PDF alin.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <TabButton
                active={mode === "html"}
                label="HTML yapistir"
                onClick={() => setMode("html")}
              />
              <TabButton
                active={mode === "url"}
                label="Link ver"
                onClick={() => setMode("url")}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {mode === "html" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">
                      Hazir sablonlar
                    </div>
                    <div className="text-sm text-[var(--ink-soft)]">
                      Hemen test etmek icin tek tikla editore gonderin.
                    </div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
                    Monaco editor
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {htmlTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        selectedTemplateId === template.id
                          ? "border-[var(--accent)] bg-[rgba(210,171,106,0.18)]"
                          : "border-[var(--line)] bg-white/70 hover:border-[var(--accent)]"
                      }`}
                    >
                      <div className="text-base font-semibold text-[var(--ink)]">
                        {template.title}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {template.blurb}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="monaco-shell overflow-hidden rounded-[1.75rem] border border-[#1f2937] bg-[#111827] shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
                  <MonacoEditor
                    height="520px"
                    defaultLanguage="html"
                    language="html"
                    value={htmlValue}
                    theme="vs-dark"
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme("atelier-premium", {
                        base: "vs-dark",
                        inherit: true,
                        rules: [
                          { token: "tag", foreground: "F6D585" },
                          { token: "attribute.name", foreground: "D2AB6A" },
                          { token: "attribute.value", foreground: "E2E8F0" },
                        ],
                        colors: {
                          "editor.background": "#111827",
                          "editorLineNumber.foreground": "#64748B",
                          "editorCursor.foreground": "#F6D585",
                          "editor.selectionBackground": "#5B647344",
                        },
                      });
                    }}
                    onMount={(editor, monaco) => {
                      monaco.editor.setTheme("atelier-premium");
                      editor.updateOptions({
                        minimap: { enabled: false },
                        smoothScrolling: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 20, bottom: 20 },
                        fontSize: 14,
                        fontLigatures: true,
                        lineHeight: 22,
                      });
                    }}
                    onChange={(value) => setHtmlValue(value ?? "")}
                    options={{
                      automaticLayout: true,
                      minimap: { enabled: false },
                      wordWrap: "on",
                      tabSize: 2,
                      scrollbar: {
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">
                    Public URL girin
                  </div>
                  <div className="text-sm text-[var(--ink-soft)]">
                    Sadece herkese acik http veya https linkleri desteklenir.
                  </div>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--ink)]">
                    Sayfa linki
                  </span>
                  <input
                    data-testid="url-input"
                    type="url"
                    value={urlValue}
                    onChange={(event) => setUrlValue(event.target.value)}
                    placeholder="https://example.com/report"
                    className="w-full rounded-[1.5rem] border border-[var(--line)] bg-white/80 px-5 py-4 text-[var(--ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(210,171,106,0.18)]"
                  />
                </label>
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/65 p-5 text-sm leading-7 text-[var(--ink-soft)]">
                  URL modu, Browserless uzerinden sayfayi render edip PDF akisini
                  stream eder. Giris gerektiren veya private agdaki sayfalar v1
                  kapsaminda degildir.
                </div>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white/72 p-4">
              <button
                type="button"
                aria-controls={advancedSectionId}
                aria-expanded={isAdvancedOpen}
                onClick={() => setIsAdvancedOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
                    Gelismis PDF ayarlari
                  </div>
                  <div className="mt-1 text-sm text-[var(--ink-soft)]">
                    Format, yon, margin ve render davranisini burada yonetin.
                  </div>
                </div>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink)]">
                  {isAdvancedOpen ? "Kapat" : "Ac"}
                </span>
              </button>

              {isAdvancedOpen ? (
                <div
                  id={advancedSectionId}
                  className="mt-4 grid gap-4 md:grid-cols-2"
                >
                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      Format
                    </span>
                    <select
                      value={options.format}
                      onChange={(event) =>
                        updateOption(
                          "format",
                          event.target.value as PdfOptionsInput["format"],
                        )
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      Yon
                    </span>
                    <select
                      value={options.orientation}
                      onChange={(event) =>
                        updateOption(
                          "orientation",
                          event.target.value as PdfOptionsInput["orientation"],
                        )
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      Margin (mm)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={options.marginMm}
                      onChange={(event) =>
                        updateOption("marginMm", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      Olcek
                    </span>
                    <input
                      type="number"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={options.scale ?? 1}
                      onChange={(event) =>
                        updateOption("scale", Number(event.target.value))
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:border-[var(--accent)]"
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-4">
                    <input
                      type="checkbox"
                      checked={options.printBackground}
                      onChange={(event) =>
                        updateOption("printBackground", event.target.checked)
                      }
                      className="size-4 accent-[var(--accent)]"
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--ink)]">
                        Arka planlari yazdir
                      </div>
                      <div className="text-sm text-[var(--ink-soft)]">
                        Arka plan renkleri ve gorseller PDF&apos;e dahil olsun.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-4">
                    <input
                      type="checkbox"
                      checked={options.preferCssPageSize}
                      onChange={(event) =>
                        updateOption("preferCssPageSize", event.target.checked)
                      }
                      className="size-4 accent-[var(--accent)]"
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--ink)]">
                        CSS page size&apos;i kullan
                      </div>
                      <div className="text-sm text-[var(--ink-soft)]">
                        Belge kendi `@page` boyutlarini tanimliyorsa onceliklendir.
                      </div>
                    </div>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                data-testid="submit-button"
                type="submit"
                disabled={isSubmitting}
                className="metal-button min-h-14 rounded-full bg-[var(--ink)] px-7 text-sm font-semibold text-white"
              >
                {isSubmitting ? "PDF hazirlaniyor..." : "PDF olarak indir"}
              </button>
            </div>

            {notice ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </form>
        </div>

        <div className="section-panel rounded-[2rem] p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Canli onizleme
              </div>
              <h2 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[var(--ink)]">
                Sanitize edilmis belge gorunumu
              </h2>
            </div>
            <div className="grid gap-2 text-right text-sm text-[var(--ink-soft)]">
              <span>{mode === "html" ? "Editor kaynakli" : "URL kaynakli"} akis</span>
              <span>{downloadCount} basarili indirme</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <StatCard
              label="Varsayilan"
              value={`${options.format} / ${options.orientation}`}
            />
            <StatCard label="Margin" value={`${options.marginMm} mm`} />
            <StatCard label="Scale" value={`${options.scale ?? 1}x`} />
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)]">
            <iframe
              title="PDF onizleme"
              className="preview-frame"
              sandbox=""
              srcDoc={previewDocument}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard
              title="Ne korunur?"
              body="Style, layout ve public asset cagrilari korunur. Script ve riskli embed etiketleri temizlenir."
            />
            <InfoCard
              title="Ne saklanmaz?"
              body="PDF diske yazilmaz, paylasim linki olusmaz ve oturum gecmisi tutulmaz."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[var(--ink)] text-white shadow-[0_14px_28px_rgba(17,24,39,0.14)]"
          : "border border-[var(--line)] bg-white/70 text-[var(--ink)] hover:border-[var(--accent)]"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/72 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
        {label}
      </div>
      <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
        {value}
      </div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/72 p-5">
      <div className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{body}</p>
    </div>
  );
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
