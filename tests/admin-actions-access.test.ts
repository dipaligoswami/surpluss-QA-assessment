import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/auth-guards", () => ({
  currentActor: vi.fn(),
  isAdmin: vi.fn(),
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

import { currentActor, isAdmin } from "@/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { deleteCatalogue, setCatalogueStatus } from "@/app/admin/actions";

const catalogueId = "11111111-1111-4111-8111-111111111111";

describe("admin server actions - access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not allow a signed-out user to publish a catalogue", async () => {
    vi.mocked(currentActor).mockResolvedValue(null);

    const result = await setCatalogueStatus(catalogueId, "published");

    expect(result).toEqual({
      error: "You need to sign in again.",
    });

    expect(isAdmin).not.toHaveBeenCalled();
  });

  it("does not allow staff to publish a catalogue", async () => {
    vi.mocked(currentActor).mockResolvedValue({
      id: "staff-1",
      email: "staff@example.com",
      role: "staff",
    });

    vi.mocked(isAdmin).mockReturnValue(false);

    const result = await setCatalogueStatus(catalogueId, "published");

    expect(result).toEqual({
      error: "Only an admin can change what is published.",
    });
  });

  it("allows an admin to publish a catalogue", async () => {
    vi.mocked(currentActor).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });

    vi.mocked(isAdmin).mockReturnValue(true);

    const prisma = {
      catalogue: {
        update: vi.fn().mockResolvedValue({
          slug: "test-catalogue",
          name: "Test Catalogue",
        }),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(prisma as never);

    const result = await setCatalogueStatus(catalogueId, "published");

    expect(result).toEqual({
      ok: true,
      name: "Test Catalogue",
    });

    expect(prisma.catalogue.update).toHaveBeenCalled();
  });

  it("does not allow a signed-out user to delete a catalogue", async () => {
    vi.mocked(currentActor).mockResolvedValue(null);

    const result = await deleteCatalogue(catalogueId);

    expect(result).toEqual({
      error: "You need to sign in again.",
    });

    expect(getPrisma).not.toHaveBeenCalled();
  });

  it("does not allow staff to delete a catalogue", async () => {
    vi.mocked(currentActor).mockResolvedValue({
      id: "staff-1",
      email: "staff@example.com",
      role: "staff",
    });

    const prisma = {
      catalogue: {
        delete: vi.fn(),
      },
    };

    vi.mocked(getPrisma).mockReturnValue(prisma as never);

    const result = await deleteCatalogue(catalogueId);

    expect(result).not.toEqual({
      ok: true,
      name: "Test Catalogue",
    });

    expect(prisma.catalogue.delete).not.toHaveBeenCalled();
  });
});
