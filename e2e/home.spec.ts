import { expect, test } from "@playwright/test";

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
);

test("HTML flow downloads a PDF", async ({ page }) => {
  let capturedPayload: Record<string, unknown> | null = null;

  await page.route("**/api/v1/pdf-conversions", async (route) => {
    capturedPayload = route.request().postDataJSON() as Record<string, unknown>;

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="preview.pdf"',
      },
      body: SAMPLE_PDF,
    });
  });

  await page.goto("/");
  await expect(page.getByText("Premium kaliteyle HTML'i")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("submit-button").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("preview.pdf");
  expect(capturedPayload?.source).toMatchObject({ type: "html" });
});

test("URL flow sends advanced options in the API payload", async ({ page }) => {
  let capturedPayload: Record<string, unknown> | null = null;

  await page.route("**/api/v1/pdf-conversions", async (route) => {
    capturedPayload = route.request().postDataJSON() as Record<string, unknown>;

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="link.pdf"',
      },
      body: SAMPLE_PDF,
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Link ver" }).click();
  await page.getByTestId("url-input").fill("https://example.com/report");
  await page.getByLabel("Format").selectOption("Legal");
  await page.getByLabel("Yon").selectOption("landscape");
  await page.getByLabel("Margin (mm)").fill("20");
  await page.getByLabel("Olcek").fill("1.2");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("submit-button").click();
  await downloadPromise;

  expect(capturedPayload?.source).toMatchObject({
    type: "url",
    url: "https://example.com/report",
  });
  expect(capturedPayload?.options).toMatchObject({
    format: "Legal",
    orientation: "landscape",
    marginMm: 20,
    scale: 1.2,
  });
});

test("mobile viewport keeps the primary action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByTestId("submit-button")).toBeVisible();
  await expect(page.getByText("Gelistirme modu aktif")).toBeVisible();
});
