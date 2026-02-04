import { useEffect, useCallback, useRef } from 'react';
import type { Node } from '@xyflow/react';

/**
 * useGraphKeyboardNav - Hook for keyboard navigation in dialogue graph
 *
 * PHASE 5.1 - Accessibilité: Navigation clavier complète
 *
 * Raccourcis:
 * - Tab / Shift+Tab: Navigate entre nodes séquentiellement
 * - Arrow Up/Down/Left/Right: Navigation spatiale dans le graphe
 * - Enter: Select node (confirm selection)
 * - Space: Open properties panel
 * - E: Edit node (open wizard)
 * - Delete: Delete selected node
 * - Ctrl+D: Duplicate selected node
 * - Escape: Deselect / Close modal
 */

interface UseGraphKeyboardNavOptions {
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
  isEnabled?: boolean;
}

interface Announcement {
  id: number;
  message: string;
}

export function useGraphKeyboardNav({
  nodes,
  selectedNodeId,
  onSelectNode,
  onEditNode,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  isEnabled = true
}: UseGraphKeyboardNavOptions) {
  // Ref for live region announcements
  const announcementIdRef = useRef(0);
  const announcementsRef = useRef<Announcement[]>([]);

  /**
   * Announce message to screen readers via live region
   */
  const announce = useCallback((message: string) => {
    const id = ++announcementIdRef.current;
    announcementsRef.current = [{ id, message }];
    // Clear after announcement is read
    setTimeout(() => {
      announcementsRef.current = announcementsRef.current.filter(a => a.id !== id);
    }, 1000);
  }, []);

  /**
   * Find adjacent node in specified direction
   * Uses node positions for spatial navigation
   */
  const findAdjacentNode = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right'): string | null => {
      if (!selectedNodeId || nodes.length === 0) return null;

      const currentNode = nodes.find(n => n.id === selectedNodeId);
      if (!currentNode) return nodes[0]?.id ?? null;

      const currentX = currentNode.position.x;
      const currentY = currentNode.position.y;

      // Filter nodes based on direction
      let candidates: Node[] = [];

      switch (direction) {
        case 'up':
          candidates = nodes.filter(n => n.position.y < currentY - 10);
          break;
        case 'down':
          candidates = nodes.filter(n => n.position.y > currentY + 10);
          break;
        case 'left':
          candidates = nodes.filter(n => n.position.x < currentX - 10);
          break;
        case 'right':
          candidates = nodes.filter(n => n.position.x > currentX + 10);
          break;
      }

      if (candidates.length === 0) return null;

      // Find closest node in that direction
      let closest: Node | null = null;
      let minDistance = Infinity;

      for (const node of candidates) {
        const dx = node.position.x - currentX;
        const dy = node.position.y - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          closest = node;
        }
      }

      return closest?.id ?? null;
    },
    [nodes, selectedNodeId]
  );

  /**
   * Navigate to next/previous node sequentially (Tab order)
   */
  const navigateSequential = useCallback(
    (direction: 'next' | 'prev'): string | null => {
      if (nodes.length === 0) return null;

      const currentIndex = selectedNodeId
        ? nodes.findIndex(n => n.id === selectedNodeId)
        : -1;

      let newIndex: number;
      if (direction === 'next') {
        newIndex = currentIndex < nodes.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : nodes.length - 1;
      }

      return nodes[newIndex]?.id ?? null;
    },
    [nodes, selectedNodeId]
  );

  /**
   * Main keyboard event handler
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return;

      // Don't intercept if typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        // Tab navigation (sequential)
        case 'Tab':
          event.preventDefault();
          const nextId = navigateSequential(event.shiftKey ? 'prev' : 'next');
          if (nextId) {
            onSelectNode(nextId);
            const nodeIndex = nodes.findIndex(n => n.id === nextId) + 1;
            announce(`Dialogue ${nodeIndex} selectionne`);
          }
          break;

        // Arrow key navigation (spatial)
        case 'ArrowUp':
          event.preventDefault();
          const upId = findAdjacentNode('up');
          if (upId) {
            onSelectNode(upId);
            announce('Navigation vers le haut');
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          const downId = findAdjacentNode('down');
          if (downId) {
            onSelectNode(downId);
            announce('Navigation vers le bas');
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          const leftId = findAdjacentNode('left');
          if (leftId) {
            onSelectNode(leftId);
            announce('Navigation vers la gauche');
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          const rightId = findAdjacentNode('right');
          if (rightId) {
            onSelectNode(rightId);
            announce('Navigation vers la droite');
          }
          break;

        // Enter: Confirm selection (focus node)
        case 'Enter':
          if (selectedNodeId) {
            event.preventDefault();
            announce('Dialogue confirme');
          }
          break;

        // Space: Open properties panel
        case ' ':
          if (selectedNodeId) {
            event.preventDefault();
            announce('Panneau proprietes ouvert');
          }
          break;

        // E: Edit node (open wizard)
        case 'e':
        case 'E':
          if (selectedNodeId && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onEditNode(selectedNodeId);
            announce('Mode edition active');
          }
          break;

        // Delete: Delete selected node
        case 'Delete':
          if (selectedNodeId) {
            event.preventDefault();
            onDeleteNode(selectedNodeId);
            announce('Dialogue supprime');
            onSelectNode(null);
          }
          break;

        // Ctrl+D: Duplicate node
        case 'd':
        case 'D':
          if ((event.ctrlKey || event.metaKey) && selectedNodeId) {
            event.preventDefault();
            onDuplicateNode(selectedNodeId);
            announce('Dialogue duplique');
          }
          break;

        // Escape: Deselect or close modal
        case 'Escape':
          event.preventDefault();
          if (selectedNodeId) {
            onSelectNode(null);
            announce('Selection annulee');
          } else {
            onClose();
          }
          break;

        default:
          break;
      }
    },
    [
      isEnabled,
      nodes,
      selectedNodeId,
      onSelectNode,
      onEditNode,
      onDeleteNode,
      onDuplicateNode,
      onClose,
      findAdjacentNode,
      navigateSequential,
      announce
    ]
  );

  // Attach/detach keyboard listener
  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, handleKeyDown]);

  return {
    announcements: announcementsRef.current,
    announce
  };
}

/**
 * LiveRegion component for screen reader announcements
 * Include this in your graph modal
 */
export function GraphLiveRegion({
  announcements
}: {
  announcements: Announcement[];
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {announcements.map(a => (
        <p key={a.id}>{a.message}</p>
      ))}
    </div>
  );
}
