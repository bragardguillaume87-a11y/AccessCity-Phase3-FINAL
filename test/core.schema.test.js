// test/core.schema.test.js
// Tests unitaires pour core/schema.js
// Version Phase 3
// ASCII strict : ' et " uniquement

  import { validate, validateScene, validateDialogue, validateChoice, validateCondition, validateCharacter } from '../core/schema.js';

  /**
 * Tests Schema v1.0
 * Couvre:
 * - Validation Scene
 * - Validation Dialogue
 * - Validation Choice
 * - Validation Condition
 * - Validation Character
 */
  export function runSchemaTests() {
  console.log('\n========================================');
  console.log('[TEST] Schema v1.0 Tests');
  console.log('========================================\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // Test 1: validate() - Scene valide
  try {
    const sceneData = {
      id: 'scene1',
      name: 'Introduction',
      dialogues: [],
      createdAt: new Date().toISOString()
    };
    const result = validate('scene', sceneData);
    
    if (result.valid && result.errors.length === 0) {
      console.log('PASS: validate() scene valide');
      passCount++;
    } else {
      console.error('FAIL: validate() scene valide -', result.errors);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() scene valide -', err.message);
    failCount++;
  }
  
  // Test 2: validate() - Scene ID vide
  try {
    const sceneData = {
      id: '',
      name: 'Test'
    };
    const result = validate('scene', sceneData);
    
    if (!result.valid && result.errors.length > 0) {
      console.log('PASS: validate() scene ID vide detecte');
      passCount++;
    } else {
      console.error('FAIL: validate() scene ID vide - devrait etre invalide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() scene ID vide -', err.message);
    failCount++;
  }
  
  // Test 3: validate() - Dialogue valide
  try {
    const dialogueData = {
      id: 'dlg1',
      characterId: 'char1',
      content: 'Bonjour!',
      expression: 'happy',
      choices: [],
      tags: []
    };
    const result = validate('dialogue', dialogueData);
    
    if (result.valid) {
      console.log('PASS: validate() dialogue valide');
      passCount++;
    } else {
      console.error('FAIL: validate() dialogue valide -', result.errors);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() dialogue valide -', err.message);
    failCount++;
  }
  
  // Test 4: validate() - Dialogue content trop long
  try {
    const dialogueData = {
      id: 'dlg1',
      characterId: 'char1',
      content: 'a'.repeat(501),
      expression: 'default'
    };
    const result = validate('dialogue', dialogueData);
    
    if (!result.valid && result.errors.some(e => e.includes('500'))) {
      console.log('PASS: validate() dialogue content trop long');
      passCount++;
    } else {
      console.error('FAIL: validate() dialogue content - devrait detecter longueur');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() dialogue content -', err.message);
    failCount++;
  }
  
  // Test 5: validate() - Dialogue expression invalide
  try {
    const dialogueData = {
      id: 'dlg1',
      characterId: 'char1',
      content: 'Test',
      expression: 'invalid_expression'
    };
    const result = validate('dialogue', dialogueData);
    
    if (!result.valid && result.errors.some(e => e.includes('expression'))) {
      console.log('PASS: validate() dialogue expression invalide');
      passCount++;
    } else {
      console.error('FAIL: validate() dialogue expression - devrait detecter invalide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() dialogue expression -', err.message);
    failCount++;
  }
  
  // Test 6: validate() - Choice valide
  try {
    const choiceData = {
      id: 'choice1',
      text: 'Option 1',
      nextDialogueId: 'dlg2',
      variableImpact: { empathie: 5 }
    };
    const result = validate('choice', choiceData);
    
    if (result.valid) {
      console.log('PASS: validate() choice valide');
      passCount++;
    } else {
      console.error('FAIL: validate() choice valide -', result.errors);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() choice valide -', err.message);
    failCount++;
  }
  
  // Test 7: validate() - Choice text trop long
  try {
    const choiceData = {
      id: 'choice1',
      text: 'a'.repeat(201),
      nextDialogueId: 'dlg2'
    };
    const result = validate('choice', choiceData);
    
    if (!result.valid && result.errors.some(e => e.includes('200'))) {
      console.log('PASS: validate() choice text trop long');
      passCount++;
    } else {
      console.error('FAIL: validate() choice text - devrait detecter longueur');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() choice text -', err.message);
    failCount++;
  }
  
  // Test 8: validate() - Condition valide
  try {
    const conditionData = {
      id: 'cond1',
      variable: 'empathie',
      operator: '>=',
      value: 50
    };
    const result = validate('condition', conditionData);
    
    if (result.valid) {
      console.log('PASS: validate() condition valide');
      passCount++;
    } else {
      console.error('FAIL: validate() condition valide -', result.errors);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() condition valide -', err.message);
    failCount++;
  }
  
  // Test 9: validate() - Condition operateur invalide
  try {
    const conditionData = {
      id: 'cond1',
      variable: 'empathie',
      operator: '===',
      value: 50
    };
    const result = validate('condition', conditionData);
    
    if (!result.valid && result.errors.some(e => e.includes('operator'))) {
      console.log('PASS: validate() condition operateur invalide');
      passCount++;
    } else {
      console.error('FAIL: validate() condition operateur - devrait detecter invalide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() condition operateur -', err.message);
    failCount++;
  }
  
  // Test 10: validate() - Character valide
  try {
    const charData = {
      id: 'char1',
      name: 'Alice',
      age: 25,
      handicap: 'Visuel',
      bio: 'Personnage principal'
    };
    const result = validate('character', charData);
    
    if (result.valid) {
      console.log('PASS: validate() character valide');
      passCount++;
    } else {
      console.error('FAIL: validate() character valide -', result.errors);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() character valide -', err.message);
    failCount++;
  }
  
  // Test 11: validate() - Character age invalide
  try {
    const charData = {
      id: 'char1',
      name: 'Bob',
      age: 200,
      bio: 'Test'
    };
    const result = validate('character', charData);
    
    if (!result.valid && result.errors.some(e => e.includes('age'))) {
      console.log('PASS: validate() character age invalide');
      passCount++;
    } else {
      console.error('FAIL: validate() character age - devrait detecter invalide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() character age -', err.message);
    failCount++;
  }
  
  // Test 12: validate() - Type invalide
  try {
    const result = validate('invalid_type', {});
    
    if (!result.valid && result.errors.some(e => e.includes('Type invalide'))) {
      console.log('PASS: validate() type invalide detecte');
      passCount++;
    } else {
      console.error('FAIL: validate() type invalide - devrait detecter');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: validate() type invalide -', err.message);
    failCount++;
  }
  
  // Recap
  console.log('\n========================================');
  console.log(`[SCHEMA] Tests termines: ${passCount} PASS, ${failCount} FAIL`);
  console.log('========================================\n');
  
  return { passCount, failCount };
  }
