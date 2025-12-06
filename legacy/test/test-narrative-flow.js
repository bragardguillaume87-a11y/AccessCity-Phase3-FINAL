// test/test-narrative-flow.js
import { VariableManager } from '../core/variableManager.js';
import { evaluateConditions } from '../core/conditionEvaluator.js';
import { loadScenesFromJson } from '../core/jsonSceneLoader.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenesPath = join(__dirname, '../data/scenes.json');
const schemasPath = join(__dirname, '../data/schemas.json');

// Mock fetch
global.fetch = async (url) => {
    if (url.includes('scenes.json')) {
        return { ok: true, json: async () => JSON.parse(readFileSync(scenesPath, 'utf8')) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
};

console.log("🎬 Starting Narrative Flow Test...");

async function runTest() {
    let passed = 0;
    let failed = 0;

    try {
        // 1. Setup
        const vm = new VariableManager();
        vm.define('Empathie', 'number', 50, 0, 100);
        
        // Load Schema manually for loader
        const schemas = JSON.parse(readFileSync(schemasPath, 'utf8'));
        
        // 2. Load Scene
        console.log("Loading scene...");
        const scenesData = await loadScenesFromJson('data/scenes.json', schemas.scenes);
        const scene = scenesData.scenes[0];
        
        if (scene.id === 'scene_test_01') {
            console.log("✅ Scene loaded: " + scene.title);
            passed++;
        } else {
            console.error("❌ Wrong scene loaded");
            failed++;
        }

        // 3. Simulate Flow
        console.log("\n--- Simulating Dialogue Flow ---");
        
        for (const dialogue of scene.dialogues) {
            // Check conditions
            if (dialogue.conditions) {
                const canShow = evaluateConditions(dialogue.conditions, vm);
                if (!canShow) {
                    console.log(`[Skipped] ${dialogue.speaker}: ${dialogue.text.substring(0, 20)}...`);
                    continue;
                }
            }

            console.log(`[Shown] ${dialogue.speaker}: ${dialogue.text}`);

            // Handle Choices (Simulate Player picking option 1)
            if (dialogue.choices) {
                console.log("   ❓ Choices detected:");
                dialogue.choices.forEach((c, i) => console.log(`      ${i}: ${c.text}`));
                
                // Simulate picking choice 0 ("Bonjour, je suis tres motive !")
                const choice = dialogue.choices[0];
                console.log(`   👉 Player picks: "${choice.text}"`);
                
                if (choice.effects) {
                    choice.effects.forEach(eff => {
                        if (eff.operation === 'set') {
                            vm.set(eff.variable, eff.value);
                            console.log(`      ✨ Effect: ${eff.variable} = ${eff.value}`);
                        }
                    });
                }
            }
        }

        // 4. Verify Final State
        console.log("\n--- Verification ---");
        const finalEmpathy = vm.get('Empathie');
        if (finalEmpathy === 60) {
            console.log("✅ Empathie is 60 (Correctly updated by choice)");
            passed++;
        } else {
            console.error(`❌ Empathie is ${finalEmpathy} (Expected 60)`);
            failed++;
        }

    } catch (err) {
        console.error("❌ Test Crashed:", err);
        failed++;
    }

    console.log(`\n🎉 Narrative Test Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTest();
