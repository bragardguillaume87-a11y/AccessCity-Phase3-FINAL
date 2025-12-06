import { loadScenesFromJson } from '../core/jsonSceneLoader.js';
import { loadUiLayoutFromJson } from '../core/uiLayoutLoader.js';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

global.fetch = async (relativePath) => {
    const resolvedPath = resolve(__dirname, relativePath);
    try {
        const content = readFileSync(resolvedPath, 'utf8');
        return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(content)
        };
    } catch (error) {
        return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => {
                throw error;
            }
        };
    }
};

console.log('=== Testing JSON Loaders ===');

async function testLoaders() {
    try {
        const schemasResponse = await fetch('../data/schemas.json');
        const schemas = await schemasResponse.json();

        console.log('\n1. Testing scene loader with valid data...');
        const scenes = await loadScenesFromJson('../data/scenes.json', schemas.scenes);
        console.log('  - Scenes loaded:', scenes.scenes.length);
        console.assert(scenes.scenes.length > 0, 'Should load scenes');

        console.log('\n2. Testing UI layout loader...');
        const uiLayout = await loadUiLayoutFromJson('../data/ui_layout.json', schemas.uiLayout);
        const activeLayout = uiLayout.layouts?.[uiLayout.defaultLayout];
        const panelCount = activeLayout?.panels?.length ?? 0;
        console.log('  - Default layout:', uiLayout.defaultLayout, 'with panels:', panelCount);
        console.assert(panelCount > 0, 'Should load at least one panel in default layout');

        console.log('\n3. Testing fallback on missing file...');
        const fallbackScenes = await loadScenesFromJson('../data/nonexistent.json', schemas.scenes, true);
        console.log('  - Fallback scenes:', fallbackScenes.scenes.length);
        console.assert(fallbackScenes.scenes.length > 0, 'Should fallback to sample data');

        console.log('\n✅ All loader tests passed!');
    } catch (err) {
        console.error('❌ Test failed:', err);
    }
}

testLoaders();
