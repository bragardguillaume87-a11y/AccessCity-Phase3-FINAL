import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * CardV2 - Design System v2 Card Component
 *
 * Features:
 * - WCAG AA compliant (clear visual boundaries with proper contrast)
 * - Variants: default, elevated, outlined
 * - Interactive mode for clickable cards (hover + focus ring)
 * - Composable subcomponents (Header, Content, Footer)
 * - Consistent spacing with design tokens
 *
 * Based on design tokens in src/styles/tokens.css
 *
 * @example
 * <CardV2>
 *   <CardHeaderV2>
 *     <CardTitleV2>Card Title</CardTitleV2>
 *     <CardDescriptionV2>Description</CardDescriptionV2>
 *   </CardHeaderV2>
 *   <CardContentV2>Content here</CardContentV2>
 *   <CardFooterV2>
 *     <ButtonV2>Action</ButtonV2>
 *   </CardFooterV2>
 * </CardV2>
 */

const cardVariantsV2 = cva(
  [
    "rounded-xl-v2 bg-background-v2 text-foreground-v2",
    "transition-shadow duration-base-v2 ease-in-out-v2",
  ],
  {
    variants: {
      variant: {
        default: "border border-border-v2 shadow-sm-v2",
        elevated: "shadow-lg-v2",
        outlined: "border-2 border-border-strong-v2",
      },
      interactive: {
        true: [
          "hover:shadow-md-v2 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-v2 focus-visible:ring-offset-2",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
);

const CardV2 = React.forwardRef(
  ({ className, variant, interactive, as: Comp = "div", ...props }, ref) => (
    <Comp
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(cardVariantsV2({ variant, interactive }), className)}
      {...props}
    />
  )
);
CardV2.displayName = "CardV2";

const CardHeaderV2 = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
CardHeaderV2.displayName = "CardHeaderV2";

const CardTitleV2 = React.forwardRef(
  ({ className, as: Comp = "h3", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        "text-xl-v2 font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitleV2.displayName = "CardTitleV2";

const CardDescriptionV2 = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm-v2 text-muted-foreground-v2", className)}
    {...props}
  />
));
CardDescriptionV2.displayName = "CardDescriptionV2";

const CardContentV2 = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContentV2.displayName = "CardContentV2";

const CardFooterV2 = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooterV2.displayName = "CardFooterV2";

export {
  CardV2,
  CardHeaderV2,
  CardFooterV2,
  CardTitleV2,
  CardDescriptionV2,
  CardContentV2,
};
