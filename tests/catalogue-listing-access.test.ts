import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/admin/catalogues/[id]/listings/[listingId]/route";

const catalogueA = "11111111-1111-4111-8111-111111111111";
const listingFromCatalogueB = "22222222-2222-4222-8222-222222222222";

describe("PATCH listing - catalogue ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not modify a listing belonging to another catalogue", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@example.com",
        role: "admin",
      },
    } as never);

    const prisma = {
      catalogue: {
        findUnique: vi.fn().mockResolvedValue({
          slug: "catalogue-a",
        }),
      },
      catalogueListing: {
        updateMany: vi.fn().mockResolvedValue({
          count: 1,
        }),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(prisma as never);

    const request = new Request(
      `http://localhost:3001/api/admin/catalogues/${catalogueA}/listings/${listingFromCatalogueB}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isVisible: false,
        }),
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: catalogueA,
        listingId: listingFromCatalogueB,
      }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).not.toBe(200);
    expect(prisma.catalogueListing.updateMany).not.toHaveBeenCalled();
  });
});
