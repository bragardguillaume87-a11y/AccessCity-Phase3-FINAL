import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AutoSaveTimestamp } from '../../src/components/ui/AutoSaveTimestamp.jsx';
import { useUndoRedoStore } from '../../src/stores/undoRedoStore.js';

// Mock the store
vi.mock('../../src/stores/undoRedoStore.js', () => ({
  useUndoRedoStore: vi.fn(),
}));

describe('AutoSaveTimestamp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when no lastSaved', () => {
    useUndoRedoStore.mockReturnValue(null);

    const { container } = render(<AutoSaveTimestamp />);
    expect(container.firstChild).toBeNull();
  });

  it('should display seconds when less than 60s ago', () => {
    const now = new Date();
    const lastSaved = new Date(now.getTime() - 30 * 1000); // 30 seconds ago

    useUndoRedoStore.mockReturnValue(lastSaved);

    render(<AutoSaveTimestamp />);

    // The component uses Date.now() internally, so we need to check the format
    const timestamp = screen.getByText(/\d+s/);
    expect(timestamp).toBeInTheDocument();
  });

  it('should display minutes when more than 60s ago', () => {
    const now = new Date();
    const lastSaved = new Date(now.getTime() - 150 * 1000); // 2.5 minutes ago

    useUndoRedoStore.mockReturnValue(lastSaved);

    render(<AutoSaveTimestamp />);

    const timestamp = screen.getByText(/\d+min/);
    expect(timestamp).toBeInTheDocument();
  });

  it('should update every second', async () => {
    const now = new Date();
    const lastSaved = new Date(now.getTime() - 1000); // 1 second ago

    useUndoRedoStore.mockReturnValue(lastSaved);

    render(<AutoSaveTimestamp />);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);

    // Component should re-render with updated time
    await waitFor(() => {
      const timestamp = screen.getByText(/\d+s/);
      expect(timestamp).toBeInTheDocument();
    });
  });

  it('should have correct CSS classes', () => {
    const lastSaved = new Date();
    useUndoRedoStore.mockReturnValue(lastSaved);

    const { container } = render(<AutoSaveTimestamp />);
    const span = container.querySelector('span');

    expect(span).toHaveClass('text-slate-400', 'text-xs');
  });

  it('should be memoized (React.memo)', () => {
    const lastSaved = new Date();
    useUndoRedoStore.mockReturnValue(lastSaved);

    const { rerender } = render(<AutoSaveTimestamp />);

    // Component should be memoized
    expect(AutoSaveTimestamp.$$typeof.toString()).toContain('react.memo');
  });
});
