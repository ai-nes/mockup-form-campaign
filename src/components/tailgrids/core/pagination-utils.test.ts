import { describe, expect, it } from "vitest";

import { getPaginationItems, normalizePagination } from "./pagination-utils";

describe("pagination helpers", () => {
  it("keeps every page when the page count is small", () => {
    expect(getPaginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the first and last page when the current page is in the middle", () => {
    expect(getPaginationItems(10, 20)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });

  it("moves the visible window toward the current edge", () => {
    expect(getPaginationItems(1, 20)).toEqual([1, 2, 3, "ellipsis", 20]);
    expect(getPaginationItems(20, 20)).toEqual([
      1,
      "ellipsis",
      18,
      19,
      20,
    ]);
  });

  it("clamps invalid page values to a usable range", () => {
    expect(normalizePagination(0, 0)).toEqual({
      currentPage: 1,
      totalPages: 1,
    });
    expect(normalizePagination(99, 20)).toEqual({
      currentPage: 20,
      totalPages: 20,
    });
  });
});
