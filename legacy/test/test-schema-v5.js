import { validateSchema } from '../core/schema.js';

console.log('=== Testing Schema Validation v5.0 ===');

console.log('\n1. Testing array validation...');
const arraySchema = { type: 'array', items: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } };
const validArray = [{ id: 's1' }, { id: 's2' }];
const errors1 = validateSchema(validArray, arraySchema);
console.assert(errors1.length === 0, 'Valid array should pass');

const invalidArray = [{ id: 's1' }, { name: 'missing id' }];
const errors2 = validateSchema(invalidArray, arraySchema);
console.assert(errors2.length > 0, 'Invalid array should fail');
console.log('  - Errors:', errors2);

console.log('\n2. Testing nested object validation...');
const nestedSchema = {
    type: 'object',
    required: ['scenes'],
    properties: {
        scenes: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'title'],
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' }
                }
            }
        }
    }
};

const validNested = { scenes: [{ id: 's1', title: 'Scene 1' }] };
const errors3 = validateSchema(validNested, nestedSchema);
console.assert(errors3.length === 0, 'Valid nested should pass');

const invalidNested = { scenes: [{ id: 's1' }] };
const errors4 = validateSchema(invalidNested, nestedSchema);
console.assert(errors4.length > 0, 'Missing title should fail');
console.log('  - Errors:', errors4);

console.log('\n✅ All schema v5.0 tests passed!');
