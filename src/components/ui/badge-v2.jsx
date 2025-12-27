import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * BadgeV2 - Design System v2 Badge Component
 *
 * Features:
 * - WCAG AA compliant colors (proper contrast ratios)
 * - Variants: primary, secondary, success, warning, danger, outline
 * - Size variants: sm, md
 * - Removable with close button (optional via onRemove prop)
 * - Semantic color coding for status/category indication
 *
 * Based on design tokens in src/styles/tokens.css
 *
 * @example
 * <BadgeV2>Default</BadgeV2>
 * <BadgeV2 variant="success">Active</BadgeV2>
 * <BadgeV2 variant="danger" onRemove={() => handleRemove()}>Removable</BadgeV2>
 */

const badgeVariantsV2 = cva(
  [
    "inline-flex items-center gap-1 rounded-full-v2 font-medium",
    "transition-colors duration-base-v2 ease-in-out-v2",
    "focus:outline-none focus:ring-2 focus:ring-ring-v2 focus:ring-offset-1",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary-v2 text-white shadow-sm-v2",
        secondary: "bg-secondary-v2-100 text-secondary-v2-900",
        success: "bg-success-v2-light text-success-v2-dark border border-success-v2",
        warning: "bg-warning-v2-light text-warning-v2-dark border border-warning-v2",
        danger: "bg-danger-v2-light text-danger-v2-dark border border-danger-v2",
        outline: "border-2 border-border-strong-v2 text-foreground-v2 bg-background-v2",
      },
      size: {
        sm: "px-2 py-0.5 text-xs-v2",
        md: "px-2.5 py-1 text-sm-v2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const BadgeV2 = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariantsV2({ variant, size }), className)}
        {...props}
      >
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center rounded-full-v2 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current ml-0.5 -mr-0.5"
            aria-label="Remove badge"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </span>
    );
  }
);

BadgeV2.displayName = "BadgeV2";

export { BadgeV2, badgeVariantsV2 };
