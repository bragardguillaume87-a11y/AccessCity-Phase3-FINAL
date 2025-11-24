import { validateSchema } from '../core/schema.js';
const schema = { type: 'string' };
if (validateSchema(123, schema).length === 0) throw new Error('Schema failed');
console.log('Schema Test OK');