// test/core.eventBus.test.js
// Tests unitaires pour core/eventBus.js v2.0
// Version Phase 3
// ASCII strict : ' et " uniquement

  import eventBus from '../core/eventBus.js';

  /**
 * Tests EventBus v2.0
 * Couvre:
 * - subscribe/unsubscribe/publish
 * - once() auto-desabonnement
 * - listenerCount()
 * - off() alias
 * - Mode debug
 */
  export function runEventBusTests() {
  console.log('\n========================================');
  console.log('[TEST] EventBus v2.0 Tests');
  console.log('========================================\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // Nettoyer avant tests
  eventBus.clear();
  eventBus.debug = false;
  
  // Test 1: Subscribe et publish basique
  try {
    let received = null;
    const callback = (data) => { received = data; };
    eventBus.subscribe('testEvent', callback);
    eventBus.publish('testEvent', { value: 42 });
    
    if (received && received.value === 42) {
      console.log('PASS: Subscribe et publish basique');
      passCount++;
    } else {
      console.error('FAIL: Subscribe/publish - donnees non recues');
      failCount++;
    }
    
    eventBus.unsubscribe('testEvent', callback);
  } catch (err) {
    console.error('FAIL: Subscribe/publish -', err.message);
    failCount++;
  }
  
  // Test 2: Unsubscribe retire listener
  try {
    let count = 0;
    const callback = () => { count++; };
    eventBus.subscribe('testUnsubscribe', callback);
    eventBus.publish('testUnsubscribe', null);
    eventBus.unsubscribe('testUnsubscribe', callback);
    eventBus.publish('testUnsubscribe', null);
    
    if (count === 1) {
      console.log('PASS: Unsubscribe retire listener');
      passCount++;
    } else {
      console.error(`FAIL: Unsubscribe - count devrait etre 1, recu ${count}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Unsubscribe -', err.message);
    failCount++;
  }
  
  // Test 3: once() auto-desabonnement
  try {
    let count = 0;
    eventBus.once('testOnce', () => { count++; });
    eventBus.publish('testOnce', null);
    eventBus.publish('testOnce', null);
    eventBus.publish('testOnce', null);
    
    if (count === 1) {
      console.log('PASS: once() auto-desabonnement');
      passCount++;
    } else {
      console.error(`FAIL: once() - count devrait etre 1, recu ${count}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: once() -', err.message);
    failCount++;
  }
  
  // Test 4: listenerCount() pour event specifique
  try {
    eventBus.clear();
    const cb1 = () => {};
    const cb2 = () => {};
    eventBus.subscribe('testCount', cb1);
    eventBus.subscribe('testCount', cb2);
    
    const count = eventBus.listenerCount('testCount');
    if (count === 2) {
      console.log('PASS: listenerCount() event specifique');
      passCount++;
    } else {
      console.error(`FAIL: listenerCount - attendu 2, recu ${count}`);
      failCount++;
    }
    
    eventBus.clear();
  } catch (err) {
    console.error('FAIL: listenerCount specifique -', err.message);
    failCount++;
  }
  
  // Test 5: listenerCount() sans parametre (total)
  try {
    eventBus.clear();
    eventBus.subscribe('event1', () => {});
    eventBus.subscribe('event1', () => {});
    eventBus.subscribe('event2', () => {});
    
    const total = eventBus.listenerCount();
    if (total === 3) {
      console.log('PASS: listenerCount() total tous events');
      passCount++;
    } else {
      console.error(`FAIL: listenerCount total - attendu 3, recu ${total}`);
      failCount++;
    }
    
    eventBus.clear();
  } catch (err) {
    console.error('FAIL: listenerCount total -', err.message);
    failCount++;
  }
  
  // Test 6: listenerCount() event inexistant
  try {
    const count = eventBus.listenerCount('eventInexistant');
    if (count === 0) {
      console.log('PASS: listenerCount() event inexistant retourne 0');
      passCount++;
    } else {
      console.error(`FAIL: listenerCount inexistant - attendu 0, recu ${count}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: listenerCount inexistant -', err.message);
    failCount++;
  }
  
  // Test 7: off() alias de unsubscribe
  try {
    let count = 0;
    const callback = () => { count++; };
    eventBus.subscribe('testOff', callback);
    eventBus.publish('testOff', null);
    eventBus.off('testOff', callback);
    eventBus.publish('testOff', null);
    
    if (count === 1) {
      console.log('PASS: off() alias unsubscribe');
      passCount++;
    } else {
      console.error(`FAIL: off() - count devrait etre 1, recu ${count}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: off() -', err.message);
    failCount++;
  }
  
  // Test 8: getEvents() liste evenements
  try {
    eventBus.clear();
    eventBus.subscribe('event1', () => {});
    eventBus.subscribe('event2', () => {});
    
    const events = eventBus.getEvents();
    if (events.length === 2 && events.includes('event1') && events.includes('event2')) {
      console.log('PASS: getEvents() liste evenements');
      passCount++;
    } else {
      console.error('FAIL: getEvents() - liste incorrecte');
      failCount++;
    }
    
    eventBus.clear();
  } catch (err) {
    console.error('FAIL: getEvents() -', err.message);
    failCount++;
  }
  
  // Test 9: clear() vide tous listeners
  try {
    eventBus.subscribe('event1', () => {});
    eventBus.subscribe('event2', () => {});
    eventBus.clear();
    
    const total = eventBus.listenerCount();
    if (total === 0) {
      console.log('PASS: clear() vide tous listeners');
      passCount++;
    } else {
      console.error(`FAIL: clear() - devrait etre 0, recu ${total}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: clear() -', err.message);
    failCount++;
  }
  
  // Test 10: clear(event) vide event specifique
  try {
    eventBus.subscribe('event1', () => {});
    eventBus.subscribe('event2', () => {});
    eventBus.clear('event1');
    
    const count1 = eventBus.listenerCount('event1');
    const count2 = eventBus.listenerCount('event2');
    
    if (count1 === 0 && count2 === 1) {
      console.log('PASS: clear(event) vide event specifique');
      passCount++;
    } else {
      console.error('FAIL: clear(event) - counts incorrects');
      failCount++;
    }
    
    eventBus.clear();
  } catch (err) {
    console.error('FAIL: clear(event) -', err.message);
    failCount++;
  }
  
  // Test 11: Mode debug
  try {
    eventBus.clear();
    eventBus.debug = true;
    
    const originalLog = console.log;
    let logged = false;
    console.log = (...args) => {
      if (args && args.includes('[EventBus:DEBUG]')) {
        logged = true;
      }
      originalLog(...args);
    };
    
    eventBus.subscribe('debugTest', () => {});
    
    console.log = originalLog;
    eventBus.debug = false;
    eventBus.clear();
    
    if (logged) {
      console.log('PASS: Mode debug console.log');
      passCount++;
    } else {
      console.error('FAIL: Mode debug - aucun log detecte');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Mode debug -', err.message);
    failCount++;
  }
  
  // Test 12: Erreur dans callback ne crash pas publish
  try {
    eventBus.clear();
    let called = false;
    eventBus.subscribe('testError', () => { throw new Error('Test error'); });
    eventBus.subscribe('testError', () => { called = true; });
    eventBus.publish('testError', null);
    
    if (called) {
      console.log('PASS: Erreur callback ne crash pas publish');
      passCount++;
    } else {
      console.error('FAIL: Erreur callback - second callback non appele');
      failCount++;
    }
    
    eventBus.clear();
  } catch (err) {
    console.error('FAIL: Erreur callback -', err.message);
    failCount++;
  }
  
  // Recap
  console.log('\n========================================');
  console.log(`[EVENTBUS] Tests termines: ${passCount} PASS, ${failCount} FAIL`);
  console.log('========================================\n');
  
  return { passCount, failCount };
  }
