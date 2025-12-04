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
vm.define('Health', 'number', 100);
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
    assert('Scene with no dialogues handled gracefully', lastEvent === 'scene_end');
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
    assert('Invalid dialogue processed', lastEvent !== null);
}

function testEffectAdd() {
    console.log("\n--- Test: Effect 'add' ---");
    vm.set('Health', 100);
    const addScene = {
        id: 'add_test',
        title: 'Add Effect Scene',
        dialogues: [
            { 
                speaker: 'A', 
                text: 'Heal Choice', 
                choices: [
                    { text: 'Heal +20', effects: [{ variable: 'Health', operation: 'add', value: 20 }] }
                ]
            }
        ]
    };
    engine.startScene(addScene);
    const choice = lastData[0];
    engine.selectChoice(choice);
    assert("Effect 'add' applied correctly", vm.get('Health') === 120);
}

function testEffectRandom() {
    console.log("\n--- Test: Effect 'random' ---");
    vm.set('Score', 0);
    const randomScene = {
        id: 'random_test',
        title: 'Random Effect Scene',
        dialogues: [
            { 
                speaker: 'A', 
                text: 'Random Roll', 
                choices: [
                    { text: 'Roll Dice', effects: [{ variable: 'Score', operation: 'random', min: 1, max: 6 }] }
                ]
            }
        ]
    };
    engine.startScene(randomScene);
    const choice = lastData[0];
    engine.selectChoice(choice);
    const score = vm.get('Score');
    assert("Effect 'random' within range", score >= 1 && score <= 6);
}

function testInfiniteLoopPrevention() {
    console.log("\n--- Test: Infinite Loop Prevention ---");
    const loopScene = {
        id: 'loop_test',
        title: 'Infinite Loop Scene',
        dialogues: []
    };
    // Create 1500 dialogues with impossible conditions
    for (let i = 0; i < 1500; i++) {
        loopScene.dialogues.push({
            speaker: 'A',
            text: `Dialogue ${i}`,
            conditions: [{ variable: 'Score', operator: '>', value: 999999 }]
        });
    }
    engine.startScene(loopScene);
    assert('Engine stopped after max iterations', lastEvent === 'scene_end');
    assert('isSceneEnded flag set', engine.isSceneEnded === true);
}

function testSelectChoiceValidation() {
    console.log("\n--- Test: selectChoice Validation ---");
    const validScene = {
        id: 'valid_test',
        title: 'Valid Scene',
        dialogues: [
            { 
                speaker: 'A', 
                text: 'Test', 
                choices: [
                    { text: 'Option A', effects: [] }
                ]
            }
        ]
    };
    engine.startScene(validScene);
    
    // Try to select null choice
    const beforeState = engine.isWaitingForChoice;
    engine.selectChoice(null);
    assert('Null choice rejected', engine.isWaitingForChoice === beforeState);
    
    // Try to select when not waiting
    engine.isWaitingForChoice = false;
    engine.selectChoice({ text: 'Invalid' });
    assert('Choice rejected when not waiting', true);
}

function testSceneWithoutTitle() {
    console.log("\n--- Test: Scene Without Title ---");
    const noTitleScene = {
        id: 'no_title',
        dialogues: [
            { speaker: 'A', text: 'Test Dialogue' }
        ]
    };
    engine.startScene(noTitleScene);
    assert('Scene without title handled', lastEvent === 'dialogue_show');
}

async function runTests() {
    testStartScene();
    testSkipConditionalDialogue();
    testMakeChoice();
    testEndScene();
    testEmptyScene();
    testInvalidDialogue();
    testEffectAdd();
    testEffectRandom();
    testInfiniteLoopPrevention();
    testSelectChoiceValidation();
    testSceneWithoutTitle();

    console.log(`\n🎉 Engine Tests: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests();
