export interface SearchableOption {
  value: string;
  label: string;
  code?: string | null;
  groupLabel?: string | null;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN").trim();
}

function getGroupLabel(option: SearchableOption) {
  return option.groupLabel?.trim() || "Chưa phân nhóm";
}

export function getOptionGroups<T extends SearchableOption>(options: readonly T[]) {
  const groups = new Map<string, T[]>();
  for (const option of options) {
    const label = getGroupLabel(option);
    const items = groups.get(label) ?? [];
    items.push(option);
    groups.set(label, items);
  }
  return Array.from(groups, ([label, items]) => ({ label, items }));
}

/** Filter and group before paging so search is complete and loaded rows never move. */
export function getOptionPage<T extends SearchableOption>(options: readonly T[], query: string, visibleCount: number, isGrouped = false) {
  const normalizedQuery = normalizeSearch(query);
  const filtered = normalizedQuery
    ? options.filter((option) => normalizeSearch(`${option.label} ${option.code ?? ""} ${isGrouped ? getGroupLabel(option) : option.groupLabel ?? ""}`).includes(normalizedQuery))
    : options;
  const ordered = isGrouped ? getOptionGroups(filtered).flatMap((group) => group.items) : filtered;
  const items = ordered.slice(0, visibleCount);
  return { items, total: filtered.length, hasMore: items.length < filtered.length };
}
