"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /** Set to false when inside a Dialog to avoid React 19 focus trap issues */
    portal?: boolean;
  }
>(({ className, align = "center", sideOffset = 4, portal = true, onPointerDownOutside, onInteractOutside, ...props }, ref) => {
  // Event handlers to prevent Dialog from capturing events when portal={false}
  const handlePointerDownOutside = portal ? onPointerDownOutside : (e: Event) => {
    e.preventDefault();
    onPointerDownOutside?.(e as Parameters<NonNullable<typeof onPointerDownOutside>>[0]);
  };

  const handleInteractOutside = portal ? onInteractOutside : (e: Event) => {
    e.preventDefault();
    onInteractOutside?.(e as Parameters<NonNullable<typeof onInteractOutside>>[0]);
  };

  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-popover-v2 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      onPointerDownOutside={handlePointerDownOutside}
      onInteractOutside={handleInteractOutside}
      {...props}
    />
  );

  // When portal={false}, render without Portal to avoid React 19 focus trap issues
  if (!portal) {
    return content;
  }

  return <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal>;
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
