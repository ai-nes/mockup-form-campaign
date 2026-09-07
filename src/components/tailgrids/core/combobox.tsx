"use client";

import { cn } from "@/utils/cn";
import { Check, ChevronDown, Search1 } from "@tailgrids/icons";
import type { ReactNode } from "react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  type Key,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  type PopoverProps,
} from "react-aria-components";

import { Input } from "./input";

export interface ComboboxProps
  extends Omit<
    AriaComboBoxProps<object>,
    "children" | "items" | "selectedKey" | "onSelectionChange" | "className"
  > {
  value?: Key | null;
  onChange?: (value: Key | null) => void;
  placeholder?: string;
  emptyMessage?: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: PopoverProps["className"];
  children: ReactNode;
}

export function Combobox({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả phù hợp.",
  className,
  triggerClassName,
  contentClassName,
  children,
  ...props
}: ComboboxProps) {
  return (
    <AriaComboBox
      className={cn("group flex w-full flex-col gap-1.5", className)}
      selectedKey={value ?? null}
      onSelectionChange={(key) => onChange?.(key)}
      allowsEmptyCollection
      menuTrigger="focus"
      {...props}
    >
      <div className="relative flex items-center">
        <Search1
          size={14}
          className="pointer-events-none absolute left-3 shrink-0 text-icon-tertiary"
          aria-hidden="true"
        />
        <Input
          placeholder={placeholder}
          className={cn("h-9 w-full pr-8 pl-8.5 text-sm", triggerClassName)}
        />
        <Button className="absolute right-2.5 flex shrink-0 items-center justify-center text-icon-tertiary outline-none">
          <ChevronDown
            size={14}
            className="transition-transform group-data-open:rotate-180"
            aria-hidden="true"
          />
        </Button>
      </div>
      <Popover
        className={cn(
          "w-(--trigger-width) overflow-hidden rounded-lg border border-card-border bg-background-white-secondary shadow-md",
          "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
          contentClassName,
        )}
      >
        <ListBox
          className="max-h-64 overflow-auto p-1.5 outline-none"
          renderEmptyState={() => (
            <div className="px-3 py-6 text-center text-xs text-text-tertiary">{emptyMessage}</div>
          )}
        >
          {children}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export function ComboboxItem({ className, children, ...props }: ListBoxItemProps) {
  return (
    <ListBoxItem
      className={cn(
        "group/item relative flex w-full cursor-pointer items-center gap-3 rounded-md py-1.5 pr-7 pl-2 text-sm text-text-secondary outline-hidden select-none focus:bg-background-gray-secondary_alt focus:text-text-primary",
        "data-disabled:pointer-events-none data-disabled:text-input-disabled-text",
        className,
      )}
      {...props}
    >
      {(renderProps) => (
        <>
          {typeof children === "function" ? children(renderProps) : children}
          {renderProps.isSelected && (
            <span className="absolute right-1.5 flex size-5 items-center justify-center">
              <Check size={14} aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </ListBoxItem>
  );
}
