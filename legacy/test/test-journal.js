import { StateJournal } from '../core/stateJournal.js';

console.log('=== Testing StateJournal ===');

const journal = new StateJournal();

console.log('\n1. Testing record()...');
journal.record('scene:add', { id: 's1', title: 'Test Scene' });
journal.record('scene:update', { id: 's1', title: 'Updated Scene' });
console.assert(journal.getHistory().length === 2, 'Should have 2 entries');

console.log('\n2. Testing undo()...');
console.assert(journal.canUndo(), 'Should be able to undo');
const undoEntry = journal.undo();
console.assert(undoEntry.action === 'scene:add', 'Should undo to first action');

console.log('\n3. Testing redo()...');
console.assert(journal.canRedo(), 'Should be able to redo');
const redoEntry = journal.redo();
console.assert(redoEntry.action === 'scene:update', 'Should redo to second action');

console.log('\n4. Testing export/import...');
const exported = journal.exportToJson();
console.assert(exported.history.length === 2, 'Export should contain history');

const newJournal = new StateJournal();
newJournal.importFromJson(exported);
console.assert(newJournal.getHistory().length === 2, 'Import should restore history');

console.log('\n✅ All journal tests passed!');
