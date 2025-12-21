import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility pour merger les classes Tailwind intelligemment
 * Combine clsx (conditional classes) + twMerge (override Tailwind conflicts)
 *
 * Usage:
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
