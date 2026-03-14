import { describe, expect, it } from "vitest";

import { assertPublicHttpUrl, isPublicIp } from "@/lib/url-safety";

describe("assertPublicHttpUrl", () => {
  it("accepts a public https URL", async () => {
    const result = await assertPublicHttpUrl("https://example.com/report", async () => [
      "93.184.216.34",
    ]);

    expect(result.hostname).toBe("example.com");
  });

  it("rejects localhost and private targets", async () => {
    await expect(assertPublicHttpUrl("http://localhost:3000")).rejects.toMatchObject({
      code: "private_url",
    });

    await expect(
      assertPublicHttpUrl("https://internal.example.com", async () => [
        "10.0.0.8",
      ]),
    ).rejects.toMatchObject({
      code: "private_resolution",
    });
  });
});

describe("isPublicIp", () => {
  it("flags public and reserved addresses correctly", () => {
    expect(isPublicIp("1.1.1.1")).toBe(true);
    expect(isPublicIp("10.0.0.1")).toBe(false);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
    expect(isPublicIp("fc00::1")).toBe(false);
  });
});
