import * as React from "react"
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary"
import { logger } from "@/utils/logger"

/**
 * Error Fallback UI Component
 *
 * Displayed when an unhandled error occurs in the component tree
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Type guards for TypeScript strict mode
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-6"
    >
      <div className="max-w-2xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-red-400 mb-2">
              Une erreur inattendue s'est produite
            </h1>

            <p className="text-gray-300 mb-4">
              L'application a rencontré un problème. Vous pouvez essayer de recharger la page ou de réinitialiser l'état.
            </p>

            <details className="mb-6">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                Détails de l'erreur (pour les développeurs)
              </summary>
              <pre className="bg-gray-950 border border-gray-800 rounded p-4 text-xs text-red-400 overflow-auto max-h-64">
                {errorMessage}
                {errorStack && "\n\n" + errorStack}
              </pre>
            </details>

            <div className="flex gap-3">
              <button
                onClick={resetErrorBoundary}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Réessayer
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error handler for logging errors
 */
function handleError(error: Error, info: React.ErrorInfo): void {
  logger.error("[ErrorBoundary] Component error caught:", {
    error: error.message,
    stack: error.stack,
    componentStack: info.componentStack
  })
}

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to protect */
  children: React.ReactNode
}

/**
 * Application Error Boundary
 *
 * Wraps the application to catch and handle React errors gracefully.
 * Prevents the entire app from crashing on component errors.
 *
 * Features:
 * - User-friendly error UI
 * - Error logging for debugging
 * - Reset capability to recover from errors
 * - Production-grade error handling
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Optionally reset application state here
        logger.info("[ErrorBoundary] Error boundary reset")
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
