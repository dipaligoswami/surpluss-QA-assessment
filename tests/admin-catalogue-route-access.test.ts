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

vi.mock("@/lib/incomplete", () => ({
  findIncompleteProducts: vi.fn().mockResolvedValue([]),
  incompleteMessage: vi.fn(),
}));

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/admin/catalogues/[id]/route";

const catalogueId = "11111111-1111-4111-8111-111111111111";

const validPayload = {
  name: "Updated Catalogue",
  slug: "updated-catalogue",
  description: "Updated description",
  category: "Electronics",
  notifyNumber: "919999999999",
  status: "draft",
  banners: [],
  validUntil: "2026-12-31",
};

describe("PATCH /api/admin/catalogues/[id] - access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const request = new Request(
      `http://localhost:3001/api/admin/catalogues/${catalogueId}`,
      {
        method: "PATCH",
        body: JSON.stringify(validPayload),
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: catalogueId }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).toBe(401);
    expect(getPrisma).not.toHaveBeenCalled();
  });

  it("checks whether staff can modify a catalogue", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "staff-1",
        email: "staff@example.com",
        role: "staff",
      },
    } as never);

    const prisma = {
      catalogue: {
        findUnique: vi.fn().mockResolvedValue({
          slug: "old-catalogue",
          status: "draft",
        }),

        update: vi.fn().mockResolvedValue({
          id: catalogueId,
          name: "Updated Catalogue",
          slug: "updated-catalogue",
          description: "Updated description",
          category: "Electronics",
          notifyNumber: "+919999999999",
          status: "draft",
          banners: [],
          expiresAt: new Date("2026-12-31"),
        }),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(prisma as never);

    const request = new Request(
      `http://localhost:3001/api/admin/catalogues/${catalogueId}`,
      {
        method: "PATCH",
        body: JSON.stringify(validPayload),
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: catalogueId }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).toBe(403);
    expect(prisma.catalogue.update).not.toHaveBeenCalled();
  });

  it("rejects a tampered payload", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@example.com",
        role: "admin",
      },
    } as never);

    const prisma = {
      catalogue: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(prisma as never);

    const tamperedPayload = {
      ...validPayload,
      name: "",
      slug: "INVALID SLUG!!!",
      status: "admin",
    };

    const request = new Request(
      `http://localhost:3001/api/admin/catalogues/${catalogueId}`,
      {
        method: "PATCH",
        body: JSON.stringify(tamperedPayload),
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({ id: catalogueId }),
    });

    console.log("STATUS:", response.status);
    console.log("BODY:", await response.text());

    expect(response.status).toBe(400);
    expect(prisma.catalogue.update).not.toHaveBeenCalled();
  });
});