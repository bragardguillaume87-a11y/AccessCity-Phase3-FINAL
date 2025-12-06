// test/core.dialogueEngine.test.js
import { DialogueEngine } from '../core/DialogueEngine.js';
import { VariableManager } from '../core/variableManager.js';
import { EventBus } from '../core/eventBus.js';

console.log("🧪 Starting DialogueEngine Tests...");

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

// Setup
const vm = new VariableManager();
const eb = new EventBus();
const engine = new DialogueEngine(vm, eb);

// Mock Data
vm.define('Score', 'number', 0);
const mockScene = {
    id: 'scene1',
    title: 'Test Scene',
    dialogues: [
        { speaker: 'A', text: 'Hello' }, // 0
        { speaker: 'B', text: 'Conditional', conditions: [{ variable: 'Score', operator: '>', value: 10 }] }, // 1 (Should skip)
        { 
            speaker: 'A', 
            text: 'Choice Time', 
            choices: [
                { text: 'Win', effects: [{ variable: 'Score', operation: 'set', value: 20 }] },
                { text: 'Lose', effects: [{ variable: 'Score', operation: 'set', value: -10 }] }
            ] 
        }, // 2
        { speaker: 'B', text: 'After Choice' } // 3
    ]
};

// Test Flow
let lastEvent = null;
let lastData = null;

eb.on('engine:dialogue_show', (d) => {
    lastEvent = 'dialogue_show';
    lastData = d;
    console.log(`   [Event] Show: ${d.text}`);
});

eb.on('engine:choices_show', (c) => {
    lastEvent = 'choices_show';
    lastData = c;
    console.log(`   [Event] Choices: ${c.length} options`);
});

eb.on('engine:scene_end', () => {
    lastEvent = 'scene_end';
    console.log(`   [Event] Scene End`);
});

function testStartScene() {
    console.log("\n--- Test: Start Scene ---");
    engine.startScene(mockScene);
    assert('First dialogue shown', lastEvent === 'dialogue_show' && lastData.text === 'Hello');
}

function testSkipConditionalDialogue() {
    console.log("\n--- Test: Skip Conditional Dialogue ---");
    engine.next();
    assert('Skipped conditional, landed on Choice', (lastEvent === 'choices_show' || lastData.text === 'Choice Time'));
    assert('Choices presented', engine.isWaitingForChoice === true);
}

function testMakeChoice() {
    console.log("\n--- Test: Make Choice ---");
    const winChoice = lastData[0]; // From the choices_show event data
    engine.selectChoice(winChoice);
    assert('Variable updated', vm.get('Score') === 20);
    assert('Waiting flag cleared', engine.isWaitingForChoice === false);
    assert('Auto-advanced to next dialogue', lastEvent === 'dialogue_show' && lastData.text === 'After Choice');
}

function testEndScene() {
    console.log("\n--- Test: End Scene ---");
    engine.next();
    assert('Scene ended', lastEvent === 'scene_end');
}

function testEmptyScene() {
    console.log("\n--- Test: Empty Scene ---");
    const emptyScene = { id: 'empty', title: 'Empty Scene', dialogues: [] };
    engine.startScene(emptyScene);
    assert('Scene with no dialogues handled gracefully', lastEvent === null);
}

function testInvalidDialogue() {
    console.log("\n--- Test: Invalid Dialogue ---");
    const invalidScene = {
        id: 'invalid',
        title: 'Invalid Scene',
        dialogues: [
            { speaker: 'A', text: '' }, // Empty text
            { speaker: 'B' } // Missing text
        ]
    };
    engine.startScene(invalidScene);
    engine.next();
    assert('Invalid dialogue skipped', lastEvent === null);
}

async function runTests() {
    testStartScene();
    testSkipConditionalDialogue();
    testMakeChoice();
    testEndScene();
    testEmptyScene();
    testInvalidDialogue();

    console.log(`\n🎉 Engine Tests: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests();
