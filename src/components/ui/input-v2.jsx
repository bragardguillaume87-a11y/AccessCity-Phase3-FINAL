import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * InputV2 - Design System v2 Input Component
 *
 * Features:
 * - WCAG AA compliant (high contrast borders - 2px thickness for 3:1 contrast)
 * - Error/success states with semantic colors
 * - Icon support (left/right)
 * - Full keyboard navigation
 * - Accessible error messages via aria-describedby
 * - Focus indicators (WCAG 2.2 AA - 2px ring + 1px offset)
 *
 * Based on design tokens in src/styles/tokens.css
 *
 * @example
 * <InputV2 placeholder="Enter text..." />
 * <InputV2 state="error" error="This field is required" />
 * <InputV2 iconLeft={<Search />} placeholder="Search..." />
 */

const inputVariantsV2 = cva(
  [
    "flex h-10 w-full rounded-md-v2 border-2 bg-background-v2",
    "px-3 py-2 text-base-v2 text-foreground-v2",
    "transition-colors duration-base-v2 ease-in-out-v2",
    "placeholder:text-muted-foreground-v2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-v2 focus-visible:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted-v2",
    "file:border-0 file:bg-transparent file:text-sm-v2 file:font-medium",
  ],
  {
    variants: {
      state: {
        default: "border-border-v2 focus-visible:border-primary-v2",
        error: "border-danger-v2 focus-visible:ring-danger-v2",
        success: "border-success-v2 focus-visible:ring-success-v2",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

const InputV2 = React.forwardRef(
  (
    {
      className,
      type = "text",
      state = "default",
      error,
      iconLeft,
      iconRight,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = `${inputId}-error`;
    const hasError = state === "error" || error;

    return (
      <div className="relative w-full">
        {iconLeft && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-v2 pointer-events-none"
            aria-hidden="true"
          >
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            inputVariantsV2({ state: hasError ? "error" : state }),
            iconLeft && "pl-10",
            iconRight && "pr-10",
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          {...props}
        />
        {iconRight && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground-v2 pointer-events-none"
            aria-hidden="true"
          >
            {iconRight}
          </span>
        )}
        {hasError && error && (
          <p
            id={errorId}
            className="mt-1 text-sm-v2 text-danger-v2"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputV2.displayName = "InputV2";

export { InputV2, inputVariantsV2 };
