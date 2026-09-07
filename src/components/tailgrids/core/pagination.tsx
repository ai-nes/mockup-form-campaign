"use client";

import { cn } from "@/utils/cn";
import { ArrowLeft, ArrowRight } from "@tailgrids/icons";
import { cva } from "class-variance-authority";
import { Button } from "./button";
import { getPaginationItems, normalizePagination } from "./pagination-utils";

const wrapperStyles = cva(
  "mx-auto flex w-full items-center justify-center max-sm:gap-5",
  {
    variants: {
      variant: {
        default: "gap-0.5",
        compact: "max-w-fit sm:divide-x sm:divide-button-outline-border",
      },
    },
  },
);

const sideButtonStyles = cva(
  "hover:bg-background-gray-secondary disabled:border-border-secondary disabled:bg-background-gray-secondary_alt disabled:text-text-100 max-sm:size-10 sm:h-10",
  {
    variants: {
      sideLayout: {
        full: "py-2 pr-4 pl-3.5",
        label: "px-4 py-2",
        icon: "p-2",
      },
      variant: {
        default: "",
        compact: "",
      },
    },
  },
);

type PropsType = {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
  variant?: "default" | "compact";
  sideLayout?: "full" | "label" | "icon";
  isDisabled?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  variant = "default",
  sideLayout = "full",
  isDisabled = false,
}: PropsType) {
  const { currentPage: safeCurrentPage, totalPages: safeTotalPages } =
    normalizePagination(currentPage, totalPages);
  const paginationItems = getPaginationItems(safeCurrentPage, safeTotalPages);

  const handlePageChange = (page: number) => {
    if (isDisabled || page === safeCurrentPage) return;
    onPageChange?.(page);
  };

  return (
    <nav
      role="navigation"
      aria-label="Phân trang"
      aria-busy={isDisabled || undefined}
      className="w-full text-sm font-medium text-text-50"
    >
      <ul className={cn(wrapperStyles({ variant }), className)}>
        <li className="mr-auto">
          <Button
            appearance="outline"
            size="sm"
            type="button"
            isDisabled={isDisabled || safeCurrentPage === 1}
            aria-label="Trang trước"
            onPress={() => handlePageChange(safeCurrentPage - 1)}
            className={cn(sideButtonStyles({ sideLayout, variant }), {
              "sm:rounded-r-none sm:border-r-0": variant === "compact",
            })}
          >
            <ArrowLeft
              aria-hidden="true"
              className={cn("shrink-0", sideLayout === "label" && "sm:hidden")}
            />

            {sideLayout !== "icon" && (
              <span className="max-sm:hidden">Trước</span>
            )}
          </Button>
        </li>

        {/* Only for mobile view */}
        <li className="sm:hidden">
          Trang {safeCurrentPage} / {safeTotalPages}
        </li>

        {paginationItems.map((item, index) => (
          <li
            key={item === "ellipsis" ? `ellipsis-${index}` : item}
            className="max-sm:hidden"
          >
            {item === "ellipsis" ? (
              <PaginationEllipsis paginationVariant={variant} />
            ) : (
              <PaginationButton
                page={item}
                isActive={safeCurrentPage === item}
                onPageChange={handlePageChange}
                paginationVariant={variant}
                isDisabled={isDisabled}
              />
            )}
          </li>
        ))}

        <li className="ml-auto">
          <Button
            size="sm"
            appearance="outline"
            type="button"
            isDisabled={isDisabled || safeCurrentPage === safeTotalPages}
            aria-label="Trang sau"
            onPress={() => handlePageChange(safeCurrentPage + 1)}
            className={cn(sideButtonStyles({ sideLayout, variant }), {
              "sm:rounded-l-none sm:border-l-0": variant === "compact",
            })}
          >
            {sideLayout !== "icon" && (
              <span className="max-sm:hidden">Sau</span>
            )}

            <ArrowRight
              aria-hidden="true"
              className={cn("shrink-0", sideLayout === "label" && "sm:hidden")}
            />
          </Button>
        </li>
      </ul>
    </nav>
  );
}

function PaginationButton({
  page,
  isActive,
  onPageChange,
  paginationVariant,
  isDisabled,
}: {
  page: number;
  isActive: boolean;
  onPageChange?: (page: number) => void;
  paginationVariant: PropsType["variant"];
  isDisabled: boolean;
}) {
  return (
    <Button
      variant="primary"
      appearance="ghost"
      size="lg"
      type="button"
      isDisabled={isDisabled}
      aria-label={`Đến trang ${page}`}
      aria-current={isActive ? "page" : undefined}
      onPress={() => onPageChange?.(page)}
      className={cn(
        "size-10 shrink-0 rounded-lg hover:bg-background-gray-secondary_alt aria-[current=page]:bg-background-gray-secondary_alt",
        paginationVariant === "compact" &&
          "rounded-none border-y border-button-outline-border bg-button-outline-background",
      )}
    >
      {page}
    </Button>
  );
}

function PaginationEllipsis({
  paginationVariant,
}: {
  paginationVariant: PropsType["variant"];
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-10 shrink-0 items-center justify-center", {
        "border-y border-button-outline-border bg-button-outline-background":
          paginationVariant === "compact",
      })}
    >
      …
    </span>
  );
}
