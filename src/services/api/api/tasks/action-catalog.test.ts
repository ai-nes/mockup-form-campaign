import { describe, expect, it } from "vitest";

import {
  TASK_ACTION_CATALOG,
  TASK_ACTION_OPTIONS,
} from "./action-catalog";

describe("CRM task action catalog", () => {
  it("exposes the 79 canonical task types without duplicates", () => {
    const codes = TASK_ACTION_OPTIONS.map((option) => option.code);

    expect(codes).toHaveLength(79);
    expect(new Set(codes).size).toBe(79);
    expect(codes.every((code) => TASK_ACTION_CATALOG[code])).toBe(true);
  });
});
