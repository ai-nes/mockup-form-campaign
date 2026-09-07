"use client";

import { cn } from "@/utils/cn";
import { buttonStyles } from "./button-styles";
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  composeRenderProps,
} from "react-aria-components";

export { buttonStyles } from "./button-styles";

export type ButtonProps = RACButtonProps & {
  variant?: "primary" | "danger" | "success" | "ghost";
  appearance?: "fill" | "outline" | "ghost";
  iconOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  focused?: boolean;
  isLoading?: boolean;
};

export function Button({
  variant,
  appearance,
  iconOnly,
  size,
  focused,
  isLoading = false,
  children,
  className,
  isDisabled,
  ...props
}: ButtonProps) {
  let normalizedVariant = variant;
  let normalizedAppearance = appearance;

  if (variant === "ghost") {
    normalizedVariant = "primary";
    normalizedAppearance = "ghost";
  }

  return (
    <RACButton
      data-focused={focused ? "true" : undefined}
      className={composeRenderProps(className, (className) =>
        cn(
          buttonStyles({
            variant: normalizedVariant,
            appearance: normalizedAppearance,
            iconOnly,
            size,
          }),
          className,
        ),
      )}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? "true" : undefined}
      isDisabled={isLoading || isDisabled}
      {...props}
    >
      {children}
    </RACButton>
  );
}
