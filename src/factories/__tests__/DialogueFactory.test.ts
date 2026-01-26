/**
 * DialogueFactory Tests
 *
 * Tests for the DialogueFactory following the Factory pattern.
 * Validates both creation logic and Zod validation integration.
 */

import { describe, it, expect } from 'vitest';
import { DialogueFactory } from '../DialogueFactory';
import type { Dialogue, DialogueChoice } from '@/types';
import { z } from 'zod';

describe('DialogueFactory', () => {
  describe('createText', () => {
    it('should create a simple text dialogue', () => {
      const dialogue = DialogueFactory.createText('Character1', 'Hello world!');

      expect(dialogue).toBeDefined();
      expect(dialogue.id).toBeDefined();
      expect(dialogue.speaker).toBe('Character1');
      expect(dialogue.text).toBe('Hello world!');
      expect(dialogue.choices).toEqual([]);
      expect(dialogue.sfx).toBeUndefined();
    });

    it('should trim whitespace from speaker and text', () => {
      const dialogue = DialogueFactory.createText('  Character1  ', '  Hello!  ');

      expect(dialogue.speaker).toBe('Character1');
      expect(dialogue.text).toBe('Hello!');
    });

    it('should throw ZodError for empty speaker', () => {
      expect(() => {
        DialogueFactory.createText('', 'Hello!');
      }).toThrow(z.ZodError);
    });

    it('should throw ZodError for empty text', () => {
      expect(() => {
        DialogueFactory.createText('Character1', '');
      }).toThrow(z.ZodError);
    });

    it('should throw ZodError for whitespace-only speaker', () => {
      expect(() => {
        DialogueFactory.createText('   ', 'Hello!');
      }).toThrow(z.ZodError);
    });

    it('should throw ZodError for whitespace-only text', () => {
      expect(() => {
        DialogueFactory.createText('Character1', '   ');
      }).toThrow(z.ZodError);
    });
  });

  describe('createWithChoices', () => {
    it('should create a dialogue with choices', () => {
      const choices: DialogueChoice[] = [
        {
          id: 'choice-1',
          text: 'Option A',
          effects: [],
          nextDialogueId: 'dialogue-2',
        },
        {
          id: 'choice-2',
          text: 'Option B',
          effects: [],
          nextSceneId: 'scene-2',
        },
      ];

      const dialogue = DialogueFactory.createWithChoices(
        'Character1',
        'What do you want to do?',
        choices
      );

      expect(dialogue).toBeDefined();
      expect(dialogue.speaker).toBe('Character1');
      expect(dialogue.text).toBe('What do you want to do?');
      expect(dialogue.choices).toEqual(choices);
      expect(dialogue.choices).toHaveLength(2);
    });

    it('should create a dialogue with empty choices array', () => {
      const dialogue = DialogueFactory.createWithChoices('Character1', 'No choices here', []);

      expect(dialogue.choices).toEqual([]);
    });
  });

  describe('createWithSoundEffect', () => {
    it('should create a dialogue with sound effect', () => {
      const dialogue = DialogueFactory.createWithSoundEffect(
        'Character1',
        'Hello!',
        '/assets/sfx/hello.wav',
        0.8
      );

      expect(dialogue).toBeDefined();
      expect(dialogue.sfx).toBeDefined();
      expect(dialogue.sfx?.url).toBe('/assets/sfx/hello.wav');
      expect(dialogue.sfx?.volume).toBe(0.8);
    });

    it('should use default volume when not specified', () => {
      const dialogue = DialogueFactory.createWithSoundEffect(
        'Character1',
        'Hello!',
        '/assets/sfx/hello.wav'
      );

      expect(dialogue.sfx?.volume).toBe(0.7);
    });
  });

  describe('clone', () => {
    it('should clone a dialogue with new ID', () => {
      const original = DialogueFactory.createText('Character1', 'Original text');
      const cloned = DialogueFactory.clone(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.speaker).toBe(original.speaker);
      expect(cloned.text).toBe(original.text);
    });

    it('should clone with overrides', () => {
      const original = DialogueFactory.createText('Character1', 'Original text');
      const cloned = DialogueFactory.clone(original, {
        speaker: 'Character2',
        text: 'New text',
      });

      expect(cloned.speaker).toBe('Character2');
      expect(cloned.text).toBe('New text');
      expect(cloned.id).not.toBe(original.id);
    });

    it('should deep copy choices array', () => {
      const choices: DialogueChoice[] = [
        {
          id: 'choice-1',
          text: 'Option A',
          effects: [],
        },
      ];

      const original = DialogueFactory.createWithChoices('Character1', 'Question?', choices);
      const cloned = DialogueFactory.clone(original);

      // Modify original choices
      original.choices.push({
        id: 'choice-2',
        text: 'Option B',
        effects: [],
      });

      // Cloned should not be affected
      expect(cloned.choices).toHaveLength(1);
      expect(original.choices).toHaveLength(2);
    });
  });

  describe('createEmpty', () => {
    it('should create an empty dialogue with default speaker', () => {
      const dialogue = DialogueFactory.createEmpty();

      expect(dialogue.speaker).toBe('Narrator');
      expect(dialogue.text).toBe('');
      expect(dialogue.choices).toEqual([]);
    });

    it('should create an empty dialogue with custom speaker', () => {
      const dialogue = DialogueFactory.createEmpty('CustomSpeaker');

      expect(dialogue.speaker).toBe('CustomSpeaker');
    });

    // Note: Empty text is allowed in createEmpty() but will fail validation
    it('should allow empty text in createEmpty()', () => {
      const dialogue = DialogueFactory.createEmpty();

      // Created successfully, but validation will fail
      expect(dialogue.text).toBe('');
      expect(DialogueFactory.validate(dialogue)).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate a valid dialogue', () => {
      const dialogue = DialogueFactory.createText('Character1', 'Valid dialogue');

      expect(DialogueFactory.validate(dialogue)).toBe(true);
    });

    it('should fail validation for dialogue with empty speaker', () => {
      const invalidDialogue: Dialogue = {
        id: 'test-id',
        speaker: '',
        text: 'Some text',
        choices: [],
      };

      expect(DialogueFactory.validate(invalidDialogue)).toBe(false);
    });

    it('should fail validation for dialogue with empty text', () => {
      const invalidDialogue: Dialogue = {
        id: 'test-id',
        speaker: 'Character1',
        text: '',
        choices: [],
      };

      expect(DialogueFactory.validate(invalidDialogue)).toBe(false);
    });

    it('should pass validation for dialogue with sfx', () => {
      const dialogue = DialogueFactory.createWithSoundEffect(
        'Character1',
        'Hello!',
        '/sfx/hello.wav'
      );

      expect(DialogueFactory.validate(dialogue)).toBe(true);
    });
  });

  describe('Zod validation integration', () => {
    it('should throw ZodError with clear error message for empty speaker', () => {
      try {
        DialogueFactory.createText('', 'Valid text');
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          const errorMessages = error.issues.map((issue) => issue.message);
          expect(errorMessages.some((msg) => msg.includes('speaker'))).toBe(true);
        }
      }
    });

    it('should throw ZodError with clear error message for text too long', () => {
      const longText = 'x'.repeat(6000); // Max is 5000

      try {
        DialogueFactory.createText('Character1', longText);
        expect.fail('Should have thrown ZodError');
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          const errorMessages = error.issues.map((issue) => issue.message);
          expect(errorMessages.some((msg) => msg.includes('trop long'))).toBe(true);
        }
      }
    });
  });
});
