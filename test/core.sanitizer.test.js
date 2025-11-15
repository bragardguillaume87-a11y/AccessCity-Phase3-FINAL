// test/core.sanitizer.test.js
// Tests unitaires pour core/sanitizer.js v3.0
// Version Phase 3
// ASCII strict : ' et " uniquement

  import sanitizer from '../core/sanitizer.js';

  /**
 * Tests Sanitizer v3.0
 * Couvre:
 * - Echappement HTML basique
 * - Caracteres speciaux
 * - Limite longueur (anti-ReDoS)
 * - sanitizeForExport()
 * - containsDangerousPatterns()
 */
  export function runSanitizerTests() {
  console.log('\n========================================');
  console.log('[TEST] Sanitizer v3.0 Tests');
  console.log('========================================\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // Test 1: Echappement HTML basique
  try {
    const input = '<script>alert("XSS")</script>';
    const result = sanitizer.sanitize(input);
    const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
    if (result === expected) {
      console.log('PASS: Echappement HTML <script>');
      passCount++;
    } else {
      console.error(`FAIL: Echappement HTML - attendu ${expected}, recu ${result}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Echappement HTML -', err.message);
    failCount++;
  }
  
  // Test 2: Caracteres speciaux
  try {
    const input = '& < > " \' /';
    const result = sanitizer.sanitize(input);
    const expected = '&amp; &lt; &gt; &quot; &#x27; &#x2F;';
    if (result === expected) {
      console.log('PASS: Caracteres speciaux');
      passCount++;
    } else {
      console.error(`FAIL: Caracteres speciaux - attendu ${expected}, recu ${result}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Caracteres speciaux -', err.message);
    failCount++;
  }
  
  // Test 3: Input vide
  try {
    const result = sanitizer.sanitize('');
    if (result === '') {
      console.log('PASS: Input vide');
      passCount++;
    } else {
      console.error('FAIL: Input vide - devrait retourner chaine vide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Input vide -', err.message);
    failCount++;
  }
  
  // Test 4: Type invalide (non-string)
  try {
    const result = sanitizer.sanitize(123);
    if (result === '') {
      console.log('PASS: Type invalide retourne chaine vide');
      passCount++;
    } else {
      console.error('FAIL: Type invalide - devrait retourner chaine vide');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Type invalide -', err.message);
    failCount++;
  }
  
  // Test 5: Limite longueur (10000 chars)
  try {
    const longInput = 'a'.repeat(10001);
    sanitizer.sanitize(longInput);
    console.error('FAIL: Limite longueur - devrait throw Error');
    failCount++;
  } catch (err) {
    if (err.message.includes('depasse limite')) {
      console.log('PASS: Limite longueur 10000 chars');
      passCount++;
    } else {
      console.error('FAIL: Limite longueur - mauvais message erreur');
      failCount++;
    }
  }
  
  // Test 6: Longueur exacte limite (10000 chars OK)
  try {
    const input = 'b'.repeat(10000);
    const result = sanitizer.sanitize(input);
    if (result.length === 10000) {
      console.log('PASS: Longueur 10000 chars exacte acceptee');
      passCount++;
    } else {
      console.error('FAIL: Longueur 10000 - devrait accepter');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Longueur 10000 -', err.message);
    failCount++;
  }
  
  // Test 7: sanitizeForExport() - Escape JSON
  try {
    const input = 'Line 1\nLine 2\tTab\r\nWindows';
    const result = sanitizer.sanitizeForExport(input);
    const expected = 'Line 1\\nLine 2\\tTab\\r\\nWindows';
    if (result === expected) {
      console.log('PASS: sanitizeForExport() escape JSON');
      passCount++;
    } else {
      console.error(`FAIL: sanitizeForExport - attendu ${expected}, recu ${result}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: sanitizeForExport -', err.message);
    failCount++;
  }
  
  // Test 8: sanitizeForExport() - Escape backslash et quotes
  try {
    const input = 'Path: C:\\Users\\"Admin"';
    const result = sanitizer.sanitizeForExport(input);
    if (result.includes('\\\\') && result.includes('\\"')) {
      console.log('PASS: sanitizeForExport() escape \\ et "');
      passCount++;
    } else {
      console.error('FAIL: sanitizeForExport - backslash/quotes non echappes');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: sanitizeForExport backslash -', err.message);
    failCount++;
  }
  
  // Test 9: containsDangerousPatterns() - <script>
  try {
    const result = sanitizer.containsDangerousPatterns('<script>alert(1)</script>');
    if (result === true) {
      console.log('PASS: containsDangerousPatterns detecte <script>');
      passCount++;
    } else {
      console.error('FAIL: containsDangerousPatterns - devrait detecter <script>');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: containsDangerousPatterns <script> -', err.message);
    failCount++;
  }
  
  // Test 10: containsDangerousPatterns() - javascript:
  try {
    const result = sanitizer.containsDangerousPatterns('javascript:alert(1)');
    if (result === true) {
      console.log('PASS: containsDangerousPatterns detecte javascript:');
      passCount++;
    } else {
      console.error('FAIL: containsDangerousPatterns - devrait detecter javascript:');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: containsDangerousPatterns javascript: -', err.message);
    failCount++;
  }
  
  // Test 11: containsDangerousPatterns() - onclick=
  try {
    const result = sanitizer.containsDangerousPatterns('<div onclick="alert(1)">');
    if (result === true) {
      console.log('PASS: containsDangerousPatterns detecte onclick=');
      passCount++;
    } else {
      console.error('FAIL: containsDangerousPatterns - devrait detecter onclick=');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: containsDangerousPatterns onclick -', err.message);
    failCount++;
  }
  
  // Test 12: containsDangerousPatterns() - Texte safe
  try {
    const result = sanitizer.containsDangerousPatterns('Texte safe sans danger');
    if (result === false) {
      console.log('PASS: containsDangerousPatterns texte safe');
      passCount++;
    } else {
      console.error('FAIL: containsDangerousPatterns - texte safe devrait etre false');
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: containsDangerousPatterns safe -', err.message);
    failCount++;
  }
  
  // Test 13: getMaxInputLength()
  try {
    const maxLength = sanitizer.getMaxInputLength();
    if (maxLength === 10000) {
      console.log('PASS: getMaxInputLength() retourne 10000');
      passCount++;
    } else {
      console.error(`FAIL: getMaxInputLength - attendu 10000, recu ${maxLength}`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: getMaxInputLength -', err.message);
    failCount++;
  }
  
  // Test 14: Performance - Texte 5000 chars
  try {
    const input = '<script>'.repeat(625);
    const start = performance.now();
    sanitizer.sanitize(input);
    const duration = performance.now() - start;
    if (duration < 50) {
      console.log(`PASS: Performance 5000 chars (${duration.toFixed(2)}ms)`);
      passCount++;
    } else {
      console.error(`FAIL: Performance - ${duration.toFixed(2)}ms trop lent`);
      failCount++;
    }
  } catch (err) {
    console.error('FAIL: Performance -', err.message);
    failCount++;
  }
  
  // Recap
  console.log('\n========================================');
  console.log(`[SANITIZER] Tests termines: ${passCount} PASS, ${failCount} FAIL`);
  console.log('========================================\n');
  
  return { passCount, failCount };
  }
