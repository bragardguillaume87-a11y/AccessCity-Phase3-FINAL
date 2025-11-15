// test/test-phase3.js
// Runner principal tests Phase 3
// Importe et execute tous les tests Phase 3
// ASCII strict : ' et " uniquement

  import { runSanitizerTests } from './core.sanitizer.test.js';
  import { runEventBusTests } from './core.eventBus.test.js';
  import { runSchemaTests } from './core.schema.test.js';

  /**
 * Runner principal Phase 3
 * Execute tous les tests et affiche recap global
 */
  async function runAllPhase3Tests() {
  console.log('========================================');
  console.log('   ACCESSCITY SCENE EDITOR - PHASE 3   ');
  console.log('         TESTS AUTOMATIQUES            ');
  console.log('========================================\n');
  
  const startTime = performance.now();
  
  // Accumulateurs
  let totalPass = 0;
  let totalFail = 0;
  
  // Test 1: Sanitizer
  try {
    const { passCount, failCount } = runSanitizerTests();
    totalPass += passCount;
    totalFail += failCount;
  } catch (err) {
    console.error('[ERROR] Sanitizer tests crash:', err);
    totalFail++;
  }
  
  // Test 2: EventBus
  try {
    const { passCount, failCount } = runEventBusTests();
    totalPass += passCount;
    totalFail += failCount;
  } catch (err) {
    console.error('[ERROR] EventBus tests crash:', err);
    totalFail++;
  }
  
  // Test 3: Schema
  try {
    const { passCount, failCount } = runSchemaTests();
    totalPass += passCount;
    totalFail += failCount;
  } catch (err) {
    console.error('[ERROR] Schema tests crash:', err);
    totalFail++;
  }
  
  // Duree totale
  const duration = performance.now() - startTime;
  
  // Recap global
  console.log('\n========================================');
  console.log('          RECAP GLOBAL PHASE 3         ');
  console.log('========================================');
  console.log(`Tests executes: ${totalPass + totalFail}`);
  console.log(`PASS: ${totalPass}`);
  console.log(`FAIL: ${totalFail}`);
  console.log(`Duree: ${duration.toFixed(2)}ms`);
  console.log('========================================\n');
  
  if (totalFail === 0) {
    console.log('%cTOUS LES TESTS PHASE 3 REUSSIS', 'color: #4ec9b0; font-weight: bold; font-size: 16px;');
  } else {
    console.log(`%c${totalFail} TEST(S) ECHOUE(S)`, 'color: #f48771; font-weight: bold; font-size: 16px;');
  }
  }

// Lancer tests
  runAllPhase3Tests();
