import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Gaming variants (AccessCity theme) - WCAG AA compliant
        "gaming-primary":
          "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105 transition-all",
        "gaming-accent":
          "bg-gradient-to-br from-cyan-600 to-purple-600 text-white shadow-lg hover:from-cyan-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 transition-all",
        "gaming-success":
          "bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700",
        "gaming-danger":
          "bg-gradient-to-br from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700",
        // Token-based variants (using CSS variables from tokens.css)
        "token-primary":
          "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg hover:shadow-[var(--shadow-game-glow)] hover:scale-105 transition-all focus-visible:ring-4 focus-visible:ring-[var(--color-border-focus)]",
        "token-accent":
          "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)] text-white shadow-lg hover:shadow-[var(--shadow-game-glow)] hover:scale-105 transition-all focus-visible:ring-4 focus-visible:ring-[var(--color-border-focus)]",
        "token-success":
          "bg-[var(--color-success)] hover:bg-[var(--color-success-hover)] text-white focus-visible:ring-4 focus-visible:ring-[var(--color-success)]",
        "token-danger":
          "bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white focus-visible:ring-4 focus-visible:ring-[var(--color-danger)]",
        // Utility variants
        "toolbar":
          "h-8 px-2 bg-transparent hover:bg-accent/50 active:bg-accent text-muted-foreground hover:text-foreground",
        "panel-action":
          "justify-start bg-transparent hover:bg-accent/80 text-foreground font-normal",
        "danger-ghost":
          "text-destructive hover:bg-destructive/10 hover:text-destructive",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
