import { sanitizeString } from '../core/sanitizer.js';
const test = 'Hello World';
if (sanitizeString(test) !== test) throw new Error('Sanitizer failed');
console.log('Sanitizer Test OK');