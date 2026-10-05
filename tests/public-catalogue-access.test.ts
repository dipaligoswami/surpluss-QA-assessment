import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(),
}));

import { getPrisma } from "@/lib/prisma";
import { GET } from "@/app/api/catalogues/[slug]/search/route";

const prisma = {
  catalogue: {
    findUnique: vi.fn(),
  },
  catalogueListing: {
    findMany: vi.fn(),
  },
};

describe("GET /api/catalogues/[slug]/search - catalogue access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPrisma).mockReturnValue(prisma as never);
  });

  it("should not expose a draft catalogue to a signed-out user", async () => {
    prisma.catalogue.findUnique.mockResolvedValue({
      id: "catalogue-1",
      status: "draft",
      expiresAt: null,
    });

    prisma.catalogueListing.findMany.mockResolvedValue([]);

    const request = new Request(
      "http://localhost:3001/api/catalogues/test-catalogue/search?q=phone",
    );

    const response = await GET(request, {
      params: Promise.resolve({ slug: "test-catalogue" }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).not.toBe(200);
    expect(prisma.catalogueListing.findMany).not.toHaveBeenCalled();
  });

  it("should not expose an expired catalogue", async () => {
    prisma.catalogue.findUnique.mockResolvedValue({
      id: "catalogue-1",
      status: "published",
      expiresAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    prisma.catalogueListing.findMany.mockResolvedValue([]);

    const request = new Request(
      "http://localhost:3001/api/catalogues/test-catalogue/search?q=phone",
    );

    const response = await GET(request, {
      params: Promise.resolve({ slug: "test-catalogue" }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).not.toBe(200);
    expect(prisma.catalogueListing.findMany).not.toHaveBeenCalled();
  });
});