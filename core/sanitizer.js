// core/sanitizer.js
// Sanitization securisee contre XSS, injection HTML, ReDoS
// Version 3.1 - Phase 3 (corrections QA)
// ASCII strict : ' et " uniquement

  /**
 * Sanitizer - Protection contre XSS et injection HTML
 * 
 * Nouveautes v3.1:
 * - FIX: Regex ReDoS safe (limite repetitions [^>]{0,100})
 * - Limite longueur input (10000 chars max) -> protection ReDoS
 * - sanitizeForExport() pour JSON export
 * - Documentation limites
 * - Regex lineaires (pas de nested quantifiers)
 * 
 * Limites:
 * - Longueur max input: 10000 caracteres
 * - Regex complexite O(n) lineaire
 * - Pas de timeout async (KISS Phase 3)
 * 
 * @example
 * import sanitizer from './core/sanitizer.js';
 * 
 * const safe = sanitizer.sanitize('<script>alert("XSS")</script>');
 * console.log(safe); // &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
 * 
 * const jsonSafe = sanitizer.sanitizeForExport('Line 1\nLine 2');
 * console.log(jsonSafe); // Line 1\\nLine 2
 */
  class Sanitizer {
  constructor() {
    // Limite longueur input (protection ReDoS + DoS memoire)
    this.MAX_INPUT_LENGTH = 10000;
    
    // Map de remplacement HTML entities (regex lineaire safe)
    this.htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    // Caracteres JSON a echapper pour export
    this.jsonEscapes = {
      '\\': '\\\\',
      '"': '\\"',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t'
    };
  }
  
  /**
   * Sanitize texte contre XSS/injection HTML
   * @param {string} text - Texte a sanitizer
   * @returns {string} Texte securise
   * @throws {Error} Si texte depasse MAX_INPUT_LENGTH
   */
  sanitize(text) {
    // Validation type
    if (typeof text !== 'string') {
      return '';
    }
    
    // Protection ReDoS: limiter longueur input
    if (text.length > this.MAX_INPUT_LENGTH) {
      throw new Error(`[Sanitizer] Texte depasse limite ${this.MAX_INPUT_LENGTH} caracteres`);
    }
    
    // Echappement HTML entities (regex lineaire O(n))
    // Pattern [&<>"'/] est safe (pas de nested quantifiers)
    return text.replace(/[&<>"'\/]/g, (char) => {
      return this.htmlEntities[char] || char;
    });
  }
  
  /**
   * Sanitize pour export JSON (echappe \, ", newlines, tabs)
   * Utilise pour eviter corruption JSON lors export
   * @param {string} text - Texte a sanitizer
   * @returns {string} Texte securise pour JSON
   * @throws {Error} Si texte depasse MAX_INPUT_LENGTH
   */
  sanitizeForExport(text) {
    // Validation type
    if (typeof text !== 'string') {
      return '';
    }
    
    // Protection ReDoS: limiter longueur input
    if (text.length > this.MAX_INPUT_LENGTH) {
      throw new Error(`[Sanitizer] Texte depasse limite ${this.MAX_INPUT_LENGTH} caracteres`);
    }
    
    // Echappement JSON special chars (regex lineaire O(n))
    // Pattern [\\"\n\r\t] est safe
    return text.replace(/[\\"\n\r\t]/g, (char) => {
      return this.jsonEscapes[char] || char;
    });
  }
  
  /**
   * Tester si texte contient patterns HTML dangereux
   * CORRECTION QA: Regex ReDoS safe avec limite repetitions {0,100}
   * @param {string} text - Texte a tester
   * @returns {boolean} True si patterns dangereux detectes
   */
  containsDangerousPatterns(text) {
    if (typeof text !== 'string') {
      return false;
    }
    
    // Protection longueur
    if (text.length > this.MAX_INPUT_LENGTH) {
      return true;
    }
    
    // Patterns dangereux (regex lineaires SAFE avec limites)
    // CORRECTION: [^>]{0,100} au lieu de [^>]* pour eviter ReDoS
    const dangerousPatterns = [
      /<script[^>]{0,100}>/i,    // <script> (limite 100 chars attributs)
      /<\/script>/i,              // </script>
      /javascript:/i,             // javascript:
      /on\w{1,20}\s*=/i,          // onclick=, onload= (limite 20 chars nom event)
      /<iframe[^>]{0,100}>/i,     // <iframe>
      /<embed[^>]{0,100}>/i,      // <embed>
      /<object[^>]{0,100}>/i      // <object>
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Obtenir longueur max input autorisee
   * @returns {number} Longueur max
   */
  getMaxInputLength() {
    return this.MAX_INPUT_LENGTH;
  }
  }

// Singleton
  const sanitizer = new Sanitizer();

  export default sanitizer;
