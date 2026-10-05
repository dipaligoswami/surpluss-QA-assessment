import { describe, expect, it, vi } from "vitest";

const { mockAuth, mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  }),
}));

vi.mock("@/lib/incomplete", () => ({
  findIncompleteProducts: vi.fn().mockResolvedValue([]),
  incompleteMessage: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { GET, PATCH } from "@/app/api/admin/catalogues/[id]/route";

describe("catalogue access control", () => {
  it("does not allow staff to publish a catalogue", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "staff-user",
        email: "staff@catalogue.test",
        role: "staff",
      },
    });

    mockFindUnique.mockResolvedValue({
      slug: "test-catalogue",
      status: "draft",
    });

    mockUpdate.mockResolvedValue({
      id: "136e471f-8b59-44f0-99d0-d0c769dccdbe",
      slug: "test-catalogue",
      status: "published",
    });

    const request = new Request(
      "http://localhost:3001/api/admin/catalogues/136e471f-8b59-44f0-99d0-d0c769dccdbe",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Test Catalogue",
          slug: "test-catalogue",
          description: "Test catalogue",
          category: "",
          notifyNumber: "",
          status: "published",
          banners: [],
          validUntil: "2026-12-31",
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: "136e471f-8b59-44f0-99d0-d0c769dccdbe",
      }),
    });

    expect(response.status).toBe(403);
  });

  it("does not allow a signed-out user to access a catalogue", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(
      new Request(
        "http://localhost:3001/api/admin/catalogues/136e471f-8b59-44f0-99d0-d0c769dccdbe",
      ),
      {
        params: Promise.resolve({
          id: "136e471f-8b59-44f0-99d0-d0c769dccdbe",
        }),
      },
    );

    expect(response.status).toBe(401);
  });
});