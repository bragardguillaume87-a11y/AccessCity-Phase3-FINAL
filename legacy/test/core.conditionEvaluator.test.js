// test/core.conditionEvaluator.test.js
import { evaluateCondition, evaluateConditions } from '../core/conditionEvaluator.js';
import { VariableManager } from '../core/variableManager.js';

console.log("🧪 Starting ConditionEvaluator Tests...");

const vm = new VariableManager();

// Setup variables
vm.define('score', 'number', 50);
vm.define('isHappy', 'boolean', true);
vm.define('name', 'string', 'Alice');

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

// --- Test 1: Single Conditions (Numbers) ---
console.log("\n--- Test 1: Numbers ---");
assert('50 > 40', evaluateCondition({ variable: 'score', operator: '>', value: 40 }, vm) === true);
assert('50 >= 50', evaluateCondition({ variable: 'score', operator: '>=', value: 50 }, vm) === true);
assert('50 < 60', evaluateCondition({ variable: 'score', operator: '<', value: 60 }, vm) === true);
assert('50 == 50', evaluateCondition({ variable: 'score', operator: '==', value: 50 }, vm) === true);
assert('50 != 100', evaluateCondition({ variable: 'score', operator: '!=', value: 100 }, vm) === true);
assert('50 > 100 (False)', evaluateCondition({ variable: 'score', operator: '>', value: 100 }, vm) === false);

// --- Test 2: Single Conditions (Booleans) ---
console.log("\n--- Test 2: Booleans ---");
assert('true == true', evaluateCondition({ variable: 'isHappy', operator: '==', value: true }, vm) === true);
assert('true == "true" (String conv)', evaluateCondition({ variable: 'isHappy', operator: '==', value: 'true' }, vm) === true);
assert('true != false', evaluateCondition({ variable: 'isHappy', operator: '!=', value: false }, vm) === true);

// --- Test 3: Single Conditions (Strings) ---
console.log("\n--- Test 3: Strings ---");
assert('Alice == Alice', evaluateCondition({ variable: 'name', operator: '==', value: 'Alice' }, vm) === true);
assert('Alice != Bob', evaluateCondition({ variable: 'name', operator: '!=', value: 'Bob' }, vm) === true);

// --- Test 4: Multiple Conditions (AND Logic) ---
console.log("\n--- Test 4: Multiple Conditions (AND) ---");
const conditionsPass = [
    { variable: 'score', operator: '>', value: 10 },
    { variable: 'isHappy', operator: '==', value: true }
];
assert('All Pass', evaluateConditions(conditionsPass, vm) === true);

const conditionsFail = [
    { variable: 'score', operator: '>', value: 10 },
    { variable: 'isHappy', operator: '==', value: false } // Fails
];
assert('One Fails', evaluateConditions(conditionsFail, vm) === false);

const emptyConditions = [];
assert('Empty conditions = True', evaluateConditions(emptyConditions, vm) === true);

// --- Test 5: Edge Cases ---
console.log("\n--- Test 5: Edge Cases ---");
assert('Unknown variable returns false', evaluateCondition({ variable: 'unknown', operator: '==', value: 1 }, vm) === false);
assert('Invalid operator returns false', evaluateCondition({ variable: 'score', operator: '???', value: 50 }, vm) === false);

// --- Summary ---
console.log(`\n🎉 Tests Completed: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
