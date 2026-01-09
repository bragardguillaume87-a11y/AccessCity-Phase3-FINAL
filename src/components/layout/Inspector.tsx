import * as React from "react"

/**
 * Props for Inspector component
 */
export interface InspectorProps {
  /** Children to render inside the inspector */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Inspector - Properties panel for selected elements
 *
 * Features:
 * - role="complementary" for ARIA landmark
 * - Wraps PropertiesPanel with proper semantics
 * - Displays properties and actions for selected scene/character/dialogue
 */
export default function Inspector({
  children,
  className = ""
}: InspectorProps) {
  return (
    <aside
      role="complementary"
      aria-label="Scene properties and actions"
      className={className}
    >
      {children}
    </aside>
  )
}
