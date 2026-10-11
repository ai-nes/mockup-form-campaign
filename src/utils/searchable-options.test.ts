import { describe, expect, it } from "vitest";
import { getOptionGroups, getOptionPage } from "./searchable-options";

describe("searchable dropdown options", () => {
  const options = Array.from({ length: 80 }, (_, index) => ({
    value: String(index), label: `Campus ${index}`, code: `CS-${index}`,
  }));

  it("starts with a bounded page and reveals subsequent results without duplicates", () => {
    const first = getOptionPage(options, "", 25);
    const next = getOptionPage(options, "", 50);
    expect(first.items).toHaveLength(25);
    expect(first.hasMore).toBe(true);
    expect(next.items.slice(0, 25)).toEqual(first.items);
    expect(new Set(next.items.map((item) => item.value)).size).toBe(50);
    expect(getOptionPage(options, "", 100).hasMore).toBe(false);
  });

  it("searches the entire catalog including entries beyond the first page", () => {
    expect(getOptionPage(options, "Campus 79", 25).items).toEqual([options[79]]);
  });

  it("matches Vietnamese names without accents, including đ, case and whitespace", () => {
    const vietnamese = [{ value: "dn", label: "Đà Nẵng" }, { value: "hn", label: "Hà Nội" }];
    expect(getOptionPage(vietnamese, "  DA NANG  ", 25).items).toEqual([vietnamese[0]]);
  });

  it("also searches catalog codes and reports the filtered total", () => {
    const result = getOptionPage(options, "cs-7", 5);
    expect(result.total).toBe(11);
    expect(result.items).toHaveLength(5);
    expect(result.hasMore).toBe(true);
  });

  it("returns an empty result for an unknown query without altering the catalog", () => {
    expect(getOptionPage(options, "không tồn tại", 25)).toEqual({ items: [], total: 0, hasMore: false });
    expect(options).toHaveLength(80);
  });

  it("finds majors by their Vietnamese group label before paging", () => {
    const majors = [
      { value: "it", label: "Công nghệ thông tin", groupLabel: "Kỹ thuật và công nghệ" },
      { value: "ba", label: "Quản trị kinh doanh", groupLabel: "Kinh tế" },
    ];
    expect(getOptionPage(majors, "KY THUAT", 25).items).toEqual([majors[0]]);
  });

  it("keeps a group's majors together and preserves their order as more pages appear", () => {
    const majors = [
      { value: "a1", label: "A1", groupLabel: "Nhóm A" },
      { value: "b1", label: "B1", groupLabel: "Nhóm B" },
      { value: "a2", label: "A2", groupLabel: "Nhóm A" },
    ];
    const first = getOptionPage(majors, "", 2, true);
    const next = getOptionPage(majors, "", 3, true);
    expect(first.items.map((item) => item.value)).toEqual(["a1", "a2"]);
    expect(next.items.slice(0, 2)).toEqual(first.items);
    expect(next.items.map((item) => item.value)).toEqual(["a1", "a2", "b1"]);
  });

  it("puts missing or blank groups under the same ungrouped heading", () => {
    const majors = [
      { value: "unknown-1", label: "Ngành A", groupLabel: null },
      { value: "unknown-2", label: "Ngành B", groupLabel: "  " },
    ];
    expect(getOptionGroups(majors)).toEqual([{ label: "Chưa phân nhóm", items: majors }]);
    expect(getOptionPage(majors, "chua phan nhom", 25, true).items).toEqual(majors);
  });
});
