console.log('=== AccessCity 5.0 Integration Test ===\n');

import { EventBus } from '../core/eventBus.js';
import { validateSchema } from '../core/schema.js';
import { sanitizeObject } from '../core/sanitizer.js';
import { StateJournal } from '../core/stateJournal.js';

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${description}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ ${description}`, err.message);
    }
}

test('EventBus emits and receives events', () => {
    const bus = new EventBus();
    let received = false;
    bus.on('test', () => { received = true; });
    bus.emit('test');
    if (!received) throw new Error('Event not received');
});

test('Schema validates nested scenes structure', () => {
    const schema = {
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
    const data = { scenes: [{ id: 's1', title: 'Test' }] };
    const errors = validateSchema(data, schema);
    if (errors.length > 0) throw new Error('Valid data failed validation');
});

test('Sanitizer handles ASCII-only content', () => {
    const clean = sanitizeObject({ title: 'Test Scene', id: 's1' });
    if (clean.title !== 'Test Scene') throw new Error('Sanitization failed');
});

test('StateJournal records and retrieves history', () => {
    const journal = new StateJournal();
    journal.record('test:action', { data: 'test' });
    const history = journal.getHistory();
    if (history.length !== 1) throw new Error('History not recorded');
    if (history[0].action !== 'test:action') throw new Error('Wrong action recorded');
});

test('StateJournal supports undo/redo', () => {
    const journal = new StateJournal();
    journal.record('action1', { value: 1 });
    journal.record('action2', { value: 2 });
    if (!journal.canUndo()) throw new Error('Cannot undo');
    journal.undo();
    if (!journal.canRedo()) throw new Error('Cannot redo');
});

test('StateJournal export/import preserves data', () => {
    const journal1 = new StateJournal();
    journal1.record('test', { data: 'export' });
    const exported = journal1.exportToJson();
    
    const journal2 = new StateJournal();
    journal2.importFromJson(exported);
    if (journal2.getHistory().length !== 1) throw new Error('Import failed');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
    console.log('✅ All integration tests passed!');
} else {
    console.log(`❌ ${totalTests - passedTests} test(s) failed`);
    process.exit(1);
}
