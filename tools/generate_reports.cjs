/**
 * Génère les rapports de couverture (lcov + HTML) à partir du fichier coverage-final.json
 */
const { createCoverageMap } = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const fs = require('fs');
const path = require('path');

const coverageFinalPath = path.resolve(__dirname, '../coverage/merged/coverage-final.json');
const outputDir = path.resolve(__dirname, '../coverage/merged');

if (!fs.existsSync(coverageFinalPath)) {
  console.error(`❌ Fichier coverage-final.json introuvable: ${coverageFinalPath}`);
  process.exit(1);
}

console.log('📊 Génération des rapports de couverture...');

// Charger la couverture mergée
const coverageData = JSON.parse(fs.readFileSync(coverageFinalPath, 'utf-8'));
const coverageMap = createCoverageMap(coverageData);

// Créer le contexte pour les rapports
// Créer le contexte avec la coverageMap
const context = libReport.createContext({
  dir: outputDir,
  coverageMap: coverageMap,
  defaultSummarizer: 'nested',
  watermarks: {
    statements: [50, 80],
    functions: [50, 80],
    branches: [50, 80],
    lines: [50, 80]
  }
});

// Générer rapport LCOV
console.log('  → Génération coverage/merged/lcov.info...');
const lcovReport = reports.create('lcov', { file: 'lcov.info' });
lcovReport.execute(context);

// Générer rapport HTML
console.log('  → Génération coverage/merged/html/...');
const htmlReport = reports.create('html', { subdir: 'html' });
htmlReport.execute(context);

console.log('✅ Rapports de couverture générés:');
console.log(`   - LCOV: ${path.join(outputDir, 'lcov.info')}`);
console.log(`   - HTML: ${path.join(outputDir, 'html', 'index.html')}`);
