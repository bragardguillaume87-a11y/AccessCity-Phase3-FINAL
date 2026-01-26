/**
 * useEditorLogic Tests
 *
 * Tests for the useEditorLogic business logic hook.
 * Validates the core editor logic and auto-selection behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorLogic } from '../useEditorLogic';
import type { Scene } from '@/types';

// Mock dependencies
vi.mock('@/stores', () => ({
  useUIStore: vi.fn(() => ({})),
}));

vi.mock('@/facades', () => ({
  useEditorFacade: vi.fn(() => ({
    selectSceneWithAutoDialogue: vi.fn(),
    selectScene: vi.fn(),
    selectDialogue: vi.fn(),
    selectCharacter: vi.fn(),
    clearSelection: vi.fn(),
  })),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useEditorLogic', () => {
  // Test data
  const mockScenes: Scene[] = [
    {
      id: 'scene-1',
      title: 'First Scene',
      description: 'First scene description',
      backgroundUrl: '/bg1.jpg',
      dialogues: [
        {
          id: 'dialogue-1',
          speaker: 'Character1',
          text: 'Hello!',
          choices: [],
        },
      ],
      characters: [],
    },
    {
      id: 'scene-2',
      title: 'Second Scene',
      description: 'Second scene description',
      backgroundUrl: '/bg2.jpg',
      dialogues: [],
      characters: [],
    },
  ];

  let mockSetSelectedSceneForEdit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetSelectedSceneForEdit = vi.fn();
    vi.clearAllMocks();
  });

  describe('Handlers', () => {
    it('should provide all required handlers', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      expect(result.current.handleSceneSelect).toBeDefined();
      expect(result.current.handleDialogueSelect).toBeDefined();
      expect(result.current.handleCharacterSelect).toBeDefined();
      expect(result.current.handleTabChange).toBeDefined();
      expect(result.current.handleNavigateTo).toBeDefined();
    });

    it('should handle scene selection', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleSceneSelect('scene-1');
      });

      expect(mockSetSelectedSceneForEdit).toHaveBeenCalledWith('scene-1');
    });

    it('should handle dialogue selection', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleDialogueSelect('scene-1', 0);
      });

      expect(mockSetSelectedSceneForEdit).toHaveBeenCalledWith('scene-1');
    });

    it('should handle character selection', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleCharacterSelect('character-1');
      });

      // Character selection doesn't set scene for edit
      expect(mockSetSelectedSceneForEdit).not.toHaveBeenCalled();
    });

    it('should handle tab changes', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: 'scene-1',
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleTabChange('scenes');
      });

      expect(mockSetSelectedSceneForEdit).toHaveBeenCalledWith('scene-1');
    });

    it('should handle navigation', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleNavigateTo('scenes', { sceneId: 'scene-2' });
      });

      expect(mockSetSelectedSceneForEdit).toHaveBeenCalledWith('scene-2');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty scenes array', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: [],
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      expect(result.current).toBeDefined();
      expect(result.current.handleSceneSelect).toBeDefined();
    });

    it('should handle tab change with no scenes', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: [],
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleTabChange('scenes');
      });

      // Should not crash
      expect(mockSetSelectedSceneForEdit).not.toHaveBeenCalled();
    });

    it('should handle navigation without sceneId', () => {
      const { result } = renderHook(() =>
        useEditorLogic({
          scenes: mockScenes,
          selectedSceneForEdit: null,
          setSelectedSceneForEdit: mockSetSelectedSceneForEdit,
        })
      );

      act(() => {
        result.current.handleNavigateTo('scenes');
      });

      // Should not crash
      expect(mockSetSelectedSceneForEdit).not.toHaveBeenCalled();
    });
  });
});
