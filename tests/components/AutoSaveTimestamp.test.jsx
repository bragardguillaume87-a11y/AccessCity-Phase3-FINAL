/**
 * AutoSaveIndicator Component Tests
 *
 * Note: Le composant s'appelait AutoSaveTimestamp + useUndoRedoStore (pré-Phase 3).
 * Renommé AutoSaveIndicator avec API props (lastSaved, isSaving, error) post-Phase 3.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoSaveIndicator } from '../../src/components/ui/AutoSaveIndicator.jsx';

describe('AutoSaveIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show idle state when no lastSaved and not saving', () => {
    const { container } = render(<AutoSaveIndicator />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show saving state when isSaving is true', () => {
    render(<AutoSaveIndicator isSaving={true} />);
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('should show saved state when lastSaved is provided', () => {
    const lastSaved = new Date(Date.now() - 30_000); // 30s ago
    render(<AutoSaveIndicator lastSaved={lastSaved} />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('should show error state when error is provided', () => {
    render(<AutoSaveIndicator error="Erreur réseau" />);
    expect(screen.getByText(/erreur réseau/i)).toBeInTheDocument();
  });

  it('should show retry button in error state when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<AutoSaveIndicator error="Save failed" onRetry={onRetry} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should not show retry button in error state without onRetry', () => {
    render(<AutoSaveIndicator error="Save failed" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should have accessible role=status', () => {
    render(<AutoSaveIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
