import { describe, expect, it } from "vitest";
import { discountPercent, needsPricesForSale } from "@/lib/pricing";

describe("pricing", () => {
  it("calculates discount percentage correctly", () => {
    expect(
      discountPercent({
        priceOnRequest: false,
        mrp: 5999,
        offerPrice: 2499,
      }),
    ).toBe(58);
  });

  it("does not show a discount for price-on-request products", () => {
    expect(
      discountPercent({
        priceOnRequest: true,
        mrp: 5999,
        offerPrice: 2499,
      }),
    ).toBe(0);
  });

  it("identifies products with missing prices", () => {
    expect(
      needsPricesForSale({
        priceOnRequest: false,
        mrp: 5999,
        offerPrice: null,
      }),
    ).toBe(true);
  });
});
