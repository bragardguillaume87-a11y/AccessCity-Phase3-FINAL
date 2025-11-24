import { validateSchema } from '../core/schema.js';

console.log("🧪 Starting Schema Tests...");

let passed = 0;
let failed = 0;

function assert(desc, condition) {
    if (condition) {
        console.log(`✅ ${desc}`);
        passed++;
    } else {
        console.error(`❌ ${desc}`);
        failed++;
    }
}

// Test 1: Simple Type
const schemaString = { type: 'string' };
assert('String validates string', validateSchema('hello', schemaString).length === 0);
assert('String rejects number', validateSchema(123, schemaString).length > 0);

// Test 2: Multi Type
const schemaMulti = { type: ['string', 'number'] };
assert('Multi validates string', validateSchema('hello', schemaMulti).length === 0);
assert('Multi validates number', validateSchema(123, schemaMulti).length === 0);
assert('Multi rejects boolean', validateSchema(true, schemaMulti).length > 0);

// Test 3: Array
const schemaArray = { type: 'array', items: { type: 'number' } };
assert('Array validates [1, 2]', validateSchema([1, 2], schemaArray).length === 0);
assert('Array rejects [1, "2"]', validateSchema([1, "2"], schemaArray).length > 0);

console.log(`\n🎉 Schema Tests: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);