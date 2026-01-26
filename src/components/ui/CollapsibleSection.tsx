import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * CollapsibleSection - Accordion component for organizing properties
 *
 * Inspiration: Unity/Godot Inspector, Carbon Design System
 *
 * Features:
 * - Smooth expand/collapse animation
 * - Keyboard accessible (Enter/Space to toggle)
 * - Custom icon support
 * - Preview text in header when collapsed
 * - Open/Collapsed state management
 *
 * Usage:
 * <CollapsibleSection title="Basic Info" defaultOpen={true}>
 *   <input ... />
 * </CollapsibleSection>
 */
export interface CollapsibleSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
  preview?: string
  headerClassName?: string
  contentClassName?: string
  onToggle?: (isOpen: boolean) => void
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  preview,
  className,
  headerClassName,
  contentClassName,
  onToggle,
  ...props
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card/50",
        className
      )}
      {...props}
    >
      {/* Header (always visible) */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors",
          "hover:bg-muted/50 active:bg-muted",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
          headerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {/* Expand/Collapse indicator */}
        <span
          className={cn(
            "flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
          aria-hidden="true"
        >
          ▶
        </span>

        {/* Icon (optional) */}
        {icon && (
          <span className="flex-shrink-0 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-white">
          {title}
        </span>

        {/* Preview text when collapsed */}
        {!isOpen && preview && (
          <span className="flex-shrink-0 text-xs text-muted-foreground truncate max-w-[150px]">
            {preview}
          </span>
        )}
      </button>

      {/* Content (collapsible) */}
      <div
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className={cn("p-3 space-y-3 border-t border-border", contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * CollapsibleGroup - Wrapper for multiple CollapsibleSections with "Expand All" button
 *
 * Usage:
 * <CollapsibleGroup>
 *   <CollapsibleSection title="Section 1">...</CollapsibleSection>
 *   <CollapsibleSection title="Section 2">...</CollapsibleSection>
 * </CollapsibleGroup>
 */
export interface CollapsibleGroupProps {
  children: React.ReactNode
  className?: string
  showExpandAll?: boolean
}

export function CollapsibleGroup({ children, className, showExpandAll = true }: CollapsibleGroupProps) {
  const [expandAll, setExpandAll] = useState(false)

  // Clone children and inject expandAll state
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type === CollapsibleSection) {
      return React.cloneElement(child, {
        key: (child.props as CollapsibleSectionProps).title,
        defaultOpen: expandAll || (child.props as CollapsibleSectionProps).defaultOpen,
      } as Partial<CollapsibleSectionProps>)
    }
    return child
  })

  return (
    <div className={cn("space-y-3", className)}>
      {/* Expand All / Collapse All button */}
      {showExpandAll && (
        <div className="flex justify-end">
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-muted rounded-lg transition-colors"
          >
            {expandAll ? '⏶ Collapse All' : '⏷ Expand All'}
          </button>
        </div>
      )}

      {enhancedChildren}
    </div>
  )
}

/**
 * FormField - Reusable form field with label, error, and description
 * Works great inside CollapsibleSection
 */
export interface FormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-muted-foreground"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input/Select/Textarea */}
      {children}

      {/* Description or Error */}
      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
