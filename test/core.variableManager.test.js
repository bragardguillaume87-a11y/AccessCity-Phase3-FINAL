// test/core.variableManager.test.js
import { VariableManager } from '../core/variableManager.js';

console.log('🧪 Testing VariableManager...');

let errors = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        errors++;
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

try {
    // Test 1: Define and get variable
    const vm = new VariableManager();
    vm.define('Empathie', 'number', 50, 0, 100);
    const empathie = vm.get('Empathie');
    assert(empathie === 50, `Expected Empathie = 50, got ${empathie}`);

    // Test 2: Set with clamp (Max)
    vm.set('Empathie', 150); // Should clamp to 100
    const clampedMax = vm.get('Empathie');
    assert(clampedMax === 100, `Expected clamped max value 100, got ${clampedMax}`);

    // Test 3: Set with clamp (Min)
    vm.set('Empathie', -10); // Should clamp to 0
    const clampedMin = vm.get('Empathie');
    assert(clampedMin === 0, `Expected clamped min value 0, got ${clampedMin}`);

    // Test 4: Increment
    vm.set('Empathie', 50);
    vm.increment('Empathie', 10);
    const incremented = vm.get('Empathie');
    assert(incremented === 60, `Expected 60, got ${incremented}`);

    // Test 5: Reset
    vm.reset('Empathie');
    const reset = vm.get('Empathie');
    assert(reset === 50, `Expected reset to 50, got ${reset}`);

    // Test 6: Boolean type
    vm.define('visited_mairie', 'boolean', false);
    vm.set('visited_mairie', true);
    assert(vm.get('visited_mairie') === true, 'Boolean set true works');
    vm.set('visited_mairie', 'true'); // Loose typing check
    assert(vm.get('visited_mairie') === true, 'Boolean string "true" conversion works');

    // Test 7: String type
    vm.define('playerName', 'string', 'Hero');
    vm.set('playerName', 'AccessCityUser');
    assert(vm.get('playerName') === 'AccessCityUser', 'String set works');

    // Test 8: Export/Import JSON
    const exported = vm.exportToJSON();
    const vm2 = new VariableManager();
    vm2.importFromJSON(exported);
    
    assert(vm2.get('Empathie') === 50, 'Imported Empathie value correct');
    assert(vm2.get('visited_mairie') === true, 'Imported boolean value correct');
    assert(vm2.get('playerName') === 'AccessCityUser', 'Imported string value correct');

    // Test 9: Invalid definition (should throw)
    try {
        vm.define('BadVar', 'invalid_type', 0);
        assert(false, 'Should have thrown error for invalid type');
    } catch (e) {
        assert(true, 'Correctly threw error for invalid type');
    }

} catch (err) {
    console.error('❌ CRITICAL ERROR in tests:', err);
    errors++;
}

if (errors === 0) {
    console.log('🎉 All VariableManager tests passed!');
    process.exit(0);
} else {
    console.error(`💀 ${errors} tests failed.`);
    process.exit(1);
}
