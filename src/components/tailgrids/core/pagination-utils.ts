export type PaginationItem = number | "ellipsis";

const PAGE_LINK_WINDOW = 3;

export interface NormalizedPagination {
  currentPage: number;
  totalPages: number;
}

export function normalizePagination(
  currentPage: number,
  totalPages: number,
): NormalizedPagination {
  const normalizedTotalPages = Number.isFinite(totalPages)
    ? Math.max(1, Math.floor(totalPages))
    : 1;
  const normalizedCurrentPage = Number.isFinite(currentPage)
    ? Math.floor(currentPage)
    : 1;

  return {
    currentPage: Math.min(
      Math.max(1, normalizedCurrentPage),
      normalizedTotalPages,
    ),
    totalPages: normalizedTotalPages,
  };
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  const normalized = normalizePagination(currentPage, totalPages);

  if (normalized.totalPages <= PAGE_LINK_WINDOW + 2) {
    return Array.from(
      { length: normalized.totalPages },
      (_, index) => index + 1,
    );
  }

  const halfWindow = Math.floor(PAGE_LINK_WINDOW / 2);
  let startPage = Math.max(1, normalized.currentPage - halfWindow);
  const endPage = Math.min(
    normalized.totalPages,
    startPage + PAGE_LINK_WINDOW - 1,
  );

  // Keep a full window when the current page is close to the last page.
  startPage = Math.max(1, endPage - PAGE_LINK_WINDOW + 1);

  const items: PaginationItem[] = [];

  if (startPage > 1) {
    items.push(1);
    if (startPage > 2) items.push("ellipsis");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push(page);
  }

  if (endPage < normalized.totalPages) {
    if (endPage < normalized.totalPages - 1) items.push("ellipsis");
    items.push(normalized.totalPages);
  }

  return items;
}
