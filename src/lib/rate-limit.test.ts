import { describe, expect, it } from "vitest";

import { MemoryRateLimitStore } from "@/lib/rate-limit";

describe("MemoryRateLimitStore", () => {
  it("enforces a 6 request window per IP", async () => {
    const store = new MemoryRateLimitStore();
    const ip = "198.51.100.20";

    for (let index = 0; index < 6; index += 1) {
      const result = await store.consumeWindow(ip);
      expect(result.allowed).toBe(true);
    }

    const blocked = await store.consumeWindow(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("allows only one active conversion at a time", async () => {
    const store = new MemoryRateLimitStore();
    const first = await store.acquireActive("203.0.113.40", "req-1");
    const second = await store.acquireActive("203.0.113.40", "req-2");

    expect(first.acquired).toBe(true);
    expect(second.acquired).toBe(false);

    await first.release?.();

    const third = await store.acquireActive("203.0.113.40", "req-3");
    expect(third.acquired).toBe(true);
  });
});
