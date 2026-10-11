"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search1 } from "@tailgrids/icons";
import { Dialog, DialogTrigger, Header, ListBox, ListBoxSection, Popover } from "react-aria-components";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { SelectItem } from "@/components/tailgrids/core/select";
import { cn } from "@/utils/cn";
import { getOptionGroups, getOptionPage, type SearchableOption } from "@/utils/searchable-options";

interface SearchableSelectProps {
  options: readonly SearchableOption[];
  value?: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  isDisabled?: boolean;
  className?: string;
  triggerClassName?: string;
  isGrouped?: boolean;
  searchPlaceholder?: string;
}

const PAGE_SIZE = 25;

/** Shared public-form picker. Catalogs are fetched once; options appear in batches. */
export function SearchableSelect({
  options, value, onChange, ariaLabel, placeholder, isDisabled, className, triggerClassName,
  isGrouped = false, searchPlaceholder = "Tìm theo tên hoặc mã...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const page = useMemo(() => getOptionPage(options, query, visibleCount, isGrouped), [options, query, visibleCount, isGrouped]);
  const groups = useMemo(() => isGrouped ? getOptionGroups(page.items) : [], [isGrouped, page.items]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setQuery("");
    setVisibleCount(PAGE_SIZE);
  };
  const loadMore = () => {
    if (page.hasMore) setVisibleCount((count) => Math.min(count + PAGE_SIZE, page.total));
  };
  const renderOption = (option: SearchableOption) => (
    <SelectItem
      key={option.value}
      id={option.value}
      textValue={`${option.label} ${option.groupLabel ?? ""}`}
      className={cn("min-w-0 py-2 pl-2", isGrouped && "pl-4")}
      onFocus={() => {
        // Keyboard navigation can continue past the current batch too.
        if (option.value === page.items.at(-1)?.value) loadMore();
      }}
    >
      <span className="min-w-0 truncate" title={option.label}>{option.label}</span>
    </SelectItem>
  );

  return (
    <div className={cn("w-full min-w-0", className)}>
      <DialogTrigger isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Button
          type="button"
          appearance="outline"
          isDisabled={isDisabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full min-w-0 justify-between border-card-border bg-button-primary-outline-background pr-2.5 pl-3 text-sm font-normal shadow-xs",
            triggerClassName,
          )}
        >
          <span className={cn("min-w-0 truncate", !selectedOption && "text-input-placeholder-text")}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
        </Button>
        <Popover
          placement="bottom start"
          maxHeight={320}
          className="flex w-(--trigger-width) flex-col overflow-hidden rounded-lg border border-card-border bg-background-white-secondary shadow-md"
        >
          <Dialog aria-label={`Chọn ${ariaLabel.toLocaleLowerCase("vi-VN")}`} className="flex min-h-0 max-h-[inherit] flex-col outline-none">
            <div className="relative shrink-0 border-b border-card-border p-2">
              <Search1 aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                autoFocus
                aria-label={`Tìm ${ariaLabel.toLocaleLowerCase("vi-VN")}`}
                placeholder={searchPlaceholder}
                value={query}
                className="h-9 w-full py-1 pl-8 text-sm"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                  if (listRef.current) listRef.current.scrollTop = 0;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault();
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    listRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus();
                  }
                }}
              />
            </div>
            <ListBox
              ref={listRef}
              aria-label={`Danh sách ${ariaLabel.toLocaleLowerCase("vi-VN")}`}
              items={isGrouped ? undefined : page.items}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={value ? new Set([value]) : new Set()}
              className="min-h-0 max-h-64 overflow-y-auto overflow-x-hidden p-1.5 outline-none"
              onScroll={(event) => {
                const list = event.currentTarget;
                if (list.scrollHeight - list.scrollTop - list.clientHeight <= 48) loadMore();
              }}
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                const key = keys.values().next().value;
                if (key === undefined) return;
                onChange(String(key));
                handleOpenChange(false);
              }}
              renderEmptyState={() => <p className="px-3 py-5 text-center text-sm text-text-tertiary">Không tìm thấy kết quả phù hợp.</p>}
            >
              {isGrouped ? groups.map((group) => (
                <ListBoxSection key={group.label} aria-label={group.label}>
                  <Header className="px-1.5 py-1 text-xs font-bold text-text-primary">{group.label}</Header>
                  {group.items.map(renderOption)}
                </ListBoxSection>
              )) : renderOption}
            </ListBox>
            {page.hasMore && <p role="status" className="shrink-0 border-t border-card-border px-3 py-2 text-center text-xs text-text-tertiary">Cuộn để xem thêm ({page.items.length}/{page.total})</p>}
          </Dialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
