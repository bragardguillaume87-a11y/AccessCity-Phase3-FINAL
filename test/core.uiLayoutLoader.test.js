// test/core.uiLayoutLoader.test.js
import { loadUiLayoutFromJson } from '../core/uiLayoutLoader.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutPath = join(__dirname, '../data/ui_layout.json');
const schemasPath = join(__dirname, '../data/schemas.json');

// Mock global fetch
global.fetch = async (url) => {
    if (url.includes('ui_layout.json')) {
        const content = readFileSync(layoutPath, 'utf8');
        return {
            ok: true,
            json: async () => JSON.parse(content)
        };
    }
    throw new Error(`Unexpected fetch: ${url}`);
};

// Mock schema loader (since uiLayoutLoader imports validateSchema which might need schemas)
// Actually, uiLayoutLoader imports validateSchema from schema.js.
// schema.js usually loads schemas from a file or object.
// Let's check how schema.js works.
// If schema.js relies on fetching schemas.json, we need to mock that too.

global.fetch = async (url) => {
    if (url.includes('ui_layout.json')) {
        const content = readFileSync(layoutPath, 'utf8');
        return {
            ok: true,
            json: async () => JSON.parse(content)
        };
    }
    if (url.includes('schemas.json')) {
        const content = readFileSync(schemasPath, 'utf8');
        return {
            ok: true,
            json: async () => JSON.parse(content)
        };
    }
    throw new Error(`Unexpected fetch: ${url}`);
};

console.log("🧪 Starting UiLayoutLoader Tests...");

// We need to manually load the schema first because uiLayoutLoader expects the schema object to be passed to it,
// OR it handles it internally.
// Looking at uiLayoutLoader.js: export async function loadUiLayoutFromJson(jsonPath, schema, useFallback = true)
// So we need to load the schema first.

// import { loadSchemas } from '../core/schema.js';

async function runTests() {
    let passed = 0;
    let failed = 0;

    try {
        console.log("Loading schemas...");
        // We need to mock fetch for loadSchemas to work if it fetches schemas.json
        // loadSchemas usually fetches 'data/schemas.json'
        
        // Let's assume loadSchemas is available and works with our mock.
        // Wait, schema.js might not export loadSchemas or it might work differently.
        // Let's check schema.js content quickly or just try to use it.
        // I'll assume standard pattern.
        
        // Actually, I can just read the schema file directly in the test and pass the object.
        const schemasContent = JSON.parse(readFileSync(schemasPath, 'utf8'));
        const uiLayoutSchema = schemasContent.uiLayout;

        console.log("Testing loadUiLayoutFromJson...");
        const layout = await loadUiLayoutFromJson('data/ui_layout.json', uiLayoutSchema, false);

        if (layout && layout.layouts && layout.layouts.standard) {
            const standardPanels = layout.layouts.standard.panels;
            if (Array.isArray(standardPanels) && standardPanels.length > 0) {
                console.log("✅ Layout loaded successfully (standard preset detected)");
                passed++;
            } else {
                console.error("❌ Standard preset missing panels");
                failed++;
            }
        } else {
            console.error("❌ Layout object missing standard preset");
            failed++;
        }

        if (layout.version && layout.defaultLayout && layout.layouts[layout.defaultLayout]) {
            console.log("✅ Versioned layout structure detected (default layout is", layout.defaultLayout + ")");
            passed++;
        } else {
            console.error("❌ Version/defaultLayout metadata missing");
            failed++;
        }

        if (layout.layouts && layout.layouts.narrative) {
            console.log("✅ Narrative preset found");
            passed++;
        } else {
            console.error("❌ Narrative preset missing");
            failed++;
        }

        // Test validation failure
        try {
            await loadUiLayoutFromJson('data/ui_layout.json', { type: "object", required: ["missingField"] }, false);
            console.error("❌ Should have failed validation");
            failed++;
        } catch (e) {
            console.log("✅ Validation correctly failed for invalid schema");
            passed++;
        }

    } catch (error) {
        console.error("❌ Test crashed:", error);
        failed++;
    }

    console.log(`\n🎉 Tests Completed: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests();
