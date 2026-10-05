import { describe, expect, it } from "vitest";
import { effectiveStatus } from "@/lib/catalogue-status";

describe("effective catalogue status", () => {
  it("keeps a draft catalogue as draft", () => {
    expect(effectiveStatus("draft", null)).toBe("draft");
  });

  it("keeps a published catalogue live when its validity date is in the future", () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    expect(effectiveStatus("published", futureDate)).toBe("published");
  });

  it("marks a published catalogue past its expiry as expired", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(effectiveStatus("published", pastDate)).toBe("expired");
  });
});