import { describe, expect, it } from "vitest";
import {
  autoMap,
  parseNumber,
  validateRows,
  type ParsedFile,
} from "@/lib/import-mapping";

describe("product import mapping and validation", () => {
  it("auto-maps common spreadsheet headers", () => {
    expect(
      autoMap([
        "SKU",
        "Product Name",
        "Selling Price",
        "Stock",
        "Minimum Order Qty",
      ]),
    ).toEqual({
      SKU: "sku",
      "Product Name": "name",
      "Selling Price": "offerPrice",
      Stock: "quantity",
      "Minimum Order Qty": "moq",
    });
  });

  it("parses messy currency values from seller spreadsheets", () => {
    expect(parseNumber("₹1,20,000 / piece")).toBe(120000);
    expect(parseNumber("2,499")).toBe(2499);
  });

  it("blocks duplicate SKUs", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: ["SKU", "Product Name", "Available Quantity"],
      rows: [
        {
          SKU: "SKU-1",
          "Product Name": "Product A",
          "Available Quantity": "10",
        },
        {
          SKU: "SKU-1",
          "Product Name": "Product B",
          "Available Quantity": "20",
        },
      ],
    };

    const result = validateRows(file, {
      SKU: "sku",
      "Product Name": "name",
      "Available Quantity": "quantity",
    });

    expect(result.rows).toHaveLength(1);
    expect(result.issues).toContainEqual({
      row: 3,
      message: "SKU SKU-1 appears more than once in the sheet",
      blocking: true,
    });
  });

  it("blocks invalid available quantities", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: ["SKU", "Product Name", "Available Quantity"],
      rows: [
        {
          SKU: "SKU-1",
          "Product Name": "Product A",
          "Available Quantity": "-1",
        },
        {
          SKU: "SKU-2",
          "Product Name": "Product B",
          "Available Quantity": "2.5",
        },
      ],
    };

    const result = validateRows(file, {
      SKU: "sku",
      "Product Name": "name",
      "Available Quantity": "quantity",
    });

    expect(result.rows).toHaveLength(0);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((issue) => issue.blocking)).toBe(true);
  });
});

