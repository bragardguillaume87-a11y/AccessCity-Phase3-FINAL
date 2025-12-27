import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * ButtonV2 - Design System v2 Button Component
 *
 * Features:
 * - WCAG AA compliant colors (4.5:1 contrast minimum)
 * - CVA-based variants: primary, secondary, danger, ghost, outline
 * - Loading state with spinner
 * - Icon support (left/right)
 * - Disabled state
 * - Size variants: sm, md, lg
 * - Full keyboard navigation & focus indicators (WCAG 2.2 AA)
 *
 * Based on design tokens in src/styles/tokens.css
 *
 * @example
 * <ButtonV2 variant="primary">Click me</ButtonV2>
 * <ButtonV2 variant="danger" loading>Saving...</ButtonV2>
 * <ButtonV2 iconLeft={<Save />} size="lg">Save</ButtonV2>
 */

const buttonVariantsV2 = cva(
  // Base styles (shared by all variants)
  [
    "inline-flex items-center justify-content gap-2",
    "rounded-lg-v2 font-medium",
    "transition-colors duration-base-v2 ease-in-out-v2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-v2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0", // Icon styling
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary-v2 text-white shadow-sm-v2",
          "hover:bg-primary-v2-600 hover:text-white active:bg-primary-v2-700 active:text-white",
          "focus-visible:ring-primary-v2",
        ],
        secondary: [
          "bg-secondary-v2-100 text-secondary-v2-900 shadow-sm-v2",
          "hover:bg-secondary-v2-200 active:bg-secondary-v2-300",
          "focus-visible:ring-secondary-v2",
        ],
        danger: [
          "bg-danger-v2 text-white shadow-sm-v2",
          "hover:bg-danger-v2-dark hover:text-white active:bg-danger-v2-dark active:text-white",
          "focus-visible:ring-danger-v2",
        ],
        ghost: [
          "text-secondary-v2-700",
          "hover:bg-secondary-v2-100 active:bg-secondary-v2-200",
          "focus-visible:ring-secondary-v2",
        ],
        outline: [
          "border-2 border-border-v2 bg-background-v2 text-foreground-v2 shadow-xs-v2",
          "hover:bg-secondary-v2-50 hover:border-border-strong-v2",
          "active:bg-secondary-v2-100",
          "focus-visible:ring-primary-v2",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm-v2 [&_svg]:size-3.5",
        md: "h-10 px-4 text-base-v2 [&_svg]:size-4",
        lg: "h-12 px-6 text-lg-v2 [&_svg]:size-5",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  }
);

const ButtonV2 = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled = false,
      iconLeft,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariantsV2({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin"
            aria-hidden="true"
            role="status"
          />
        )}
        {!loading && iconLeft && (
          <span aria-hidden="true">{iconLeft}</span>
        )}
        <span>{children}</span>
        {!loading && iconRight && (
          <span aria-hidden="true">{iconRight}</span>
        )}
      </Comp>
    );
  }
);

ButtonV2.displayName = "ButtonV2";

export { ButtonV2, buttonVariantsV2 };
