// test/core.characterLoader.test.js
// Simulation de fetch pour tester le loader sans réseau

console.log('🧪 Testing CharacterLoader...');

let errors = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        errors++;
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

// Mock global fetch
global.fetch = async (url) => {
    if (url === 'valid_characters.json') {
        return {
            ok: true,
            json: async () => ({
                version: "1.0.0",
                characters: [
                    { id: "p1", name: "Player", sprites: {}, moods: ["neutral"] }
                ]
            })
        };
    }
    if (url === 'invalid_characters.json') {
        return {
            ok: true,
            json: async () => ({
                version: "1.0.0",
                characters: [
                    { id: "p1" } // Missing name, sprites, moods
                ]
            })
        };
    }
    if (url === 'missing.json') {
        return { ok: false, status: 404 };
    }
};

// Import dynamique pour utiliser le mock
import { loadCharactersFromJson } from '../core/characterLoader.js';

async function runTests() {
    try {
        // Test 1: Load valid JSON
        const validData = await loadCharactersFromJson('valid_characters.json', null, false);
        assert(validData.characters.length === 1, 'Loaded valid characters');
        assert(validData.characters[0].name === 'Player', 'Character name correct');

        // Test 2: Fallback on missing file
        const fallbackData = await loadCharactersFromJson('missing.json', null, true);
        assert(fallbackData.characters.length === 0, 'Fallback returns empty list');

        // Test 3: Validation error (mock schema validation logic)
        // Note: In a real unit test we would mock validateSchema too, but here we rely on the loader's error handling
        // Since we passed null schema in Test 1, let's try with a schema that fails
        const mockSchema = {
            type: 'object',
            required: ['characters'],
            properties: {
                characters: {
                    type: 'array',
                    items: {
                        required: ['name']
                    }
                }
            }
        };
        
        try {
            await loadCharactersFromJson('invalid_characters.json', mockSchema, false);
            assert(false, 'Should have thrown validation error');
        } catch (e) {
            assert(e.message.includes('validation failed'), 'Caught validation error');
        }

    } catch (err) {
        console.error('❌ CRITICAL ERROR in tests:', err);
        errors++;
    }

    if (errors === 0) {
        console.log('🎉 All CharacterLoader tests passed!');
        process.exit(0);
    } else {
        console.error(`💀 ${errors} tests failed.`);
        process.exit(1);
    }
}

runTests();
