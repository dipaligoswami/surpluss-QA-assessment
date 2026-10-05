import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/server", async () => {
  const actual =
    await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    after: vi.fn((callback: () => void) => callback()),
  };
});

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  notifyTeam: vi.fn(),
}));

import { POST } from "@/app/api/enquiries/route";
import { getPrisma } from "@/lib/prisma";

const catalogueId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const listingId = "33333333-3333-4333-8333-333333333333";

const validRequest = {
  catalogueId,
  name: "Rahul Mehta",
  company: "Northstar Retail",
  countryCode: "+91",
  phone: "9876543210",
  email: "rahul@example.com",
  items: [
    {
      productId,
      quantity: 50,
    },
  ],
};

function createRequest(body: unknown) {
  return new Request("http://localhost/api/enquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function mockDatabase({
  quantity = 100,
  moq = 10,
  listings = true,
}: {
  quantity?: number;
  moq?: number;
  listings?: boolean;
} = {}) {
  const prisma = {
    catalogueListing: {
      findMany: vi.fn().mockResolvedValue(
        listings
          ? [
              {
                id: listingId,
                productId,
                product: {
                  name: "Studio wireless headphones",
                  sku: "AUD-0842",
                  brand: "Soundcore",
                  offerPrice: 1899,
                  priceOnRequest: false,
                  moq,
                  quantity,
                },
              },
            ]
          : [],
      ),
    },

    catalogue: {
      findUnique: vi.fn().mockResolvedValue({
        notifyNumber: "+919999999999",
      }),
    },

    enquiry: {
      create: vi.fn().mockResolvedValue({
        id: "enquiry-1",
      }),
    },
  };

  vi.mocked(getPrisma).mockReturnValue(prisma as never);

  return prisma;
}

describe("POST /api/enquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an enquiry without phone or email", async () => {
    const prisma = mockDatabase();

    const body = {
      ...validRequest,
      phone: "",
      email: "",
    };

    const response = await POST(createRequest(body));
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe("Please check the enquiry details.");

    expect(prisma.enquiry.create).not.toHaveBeenCalled();
  });

  it("rejects an enquiry when the requested quantity is below MOQ", async () => {
    const prisma = mockDatabase({
      quantity: 100,
      moq: 25,
    });

    const body = {
      ...validRequest,
      items: [
        {
          productId,
          quantity: 10,
        },
      ],
    };

    const response = await POST(createRequest(body));
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "A requested quantity is outside the allowed range.",
    );

    expect(prisma.enquiry.create).not.toHaveBeenCalled();
  });

  it("rejects an enquiry when the requested quantity exceeds available stock", async () => {
    const prisma = mockDatabase({
      quantity: 100,
      moq: 10,
    });

    const body = {
      ...validRequest,
      items: [
        {
          productId,
          quantity: 101,
        },
      ],
    };

    const response = await POST(createRequest(body));
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe(
      "A requested quantity is outside the allowed range.",
    );

    expect(prisma.enquiry.create).not.toHaveBeenCalled();
  });

  it("rejects an enquiry when the product is unavailable in the catalogue", async () => {
    const prisma = mockDatabase({
      listings: false,
    });

    const response = await POST(createRequest(validRequest));
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.error).toBe("One or more products are unavailable.");

    expect(prisma.enquiry.create).not.toHaveBeenCalled();
  });

  it("creates an enquiry when valid details and quantities are provided", async () => {
    const prisma = mockDatabase({
      quantity: 100,
      moq: 10,
    });

    const response = await POST(createRequest(validRequest));
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.ok).toBe(true);
    expect(result.reference).toMatch(/^ENQ-\d{7}$/);

    expect(prisma.enquiry.create).toHaveBeenCalledTimes(1);

    expect(prisma.enquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          catalogueId,
          buyerName: "Rahul Mehta",
          company: "Northstar Retail",
          phone: "9876543210",
          email: "rahul@example.com",
        }),
      }),
    );
  });
});
