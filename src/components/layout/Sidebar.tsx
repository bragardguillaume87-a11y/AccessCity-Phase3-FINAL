import * as React from "react"

/**
 * Props for Sidebar component
 */
export interface SidebarProps {
  /** Children to render inside the sidebar */
  children?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Sidebar - Navigation panel for project explorer
 *
 * Features:
 * - role="navigation" for ARIA landmark
 * - Wraps ExplorerPanel with proper semantics
 * - Accessible navigation for scenes, characters, dialogues
 */
export default function Sidebar({
  children,
  className = ""
}: SidebarProps) {
  return (
    <nav
      role="navigation"
      aria-label="Project navigation"
      className={className}
    >
      {children}
    </nav>
  )
}
