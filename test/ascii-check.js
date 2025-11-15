// test/ascii-check.js
// ASCII strict checker for AccessCity Phase 3
// Scanne uniquement les fichiers .js dans core/ et test/
// Usage : node test/ascii-check.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossiers a scanner (uniquement code, pas la documentation)
const DIRS_TO_SCAN = ['core', 'test'];

// Extensions cibles
const EXTENSIONS = ['.js'];

// Retourne true si la chaine ne contient que des caracteres ASCII (code <= 127)
function isAscii(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

// Scan un fichier et retourne la liste des caracteres non-ASCII
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch.charCodeAt(0) > 127) {
        violations.push({
          line: index + 1,
          column: i + 1,
          char: ch,
          code: ch.charCodeAt(0)
        });
      }
    }
  });

  return violations;
}

// Parcours recursif d'un dossier
function walkDir(dirPath, results) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`[WARN] Dossier inexistant: ${dirPath}`);
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
}

console.log('========================================');
console.log('     ASCII CHECK - AccessCity          ');
console.log('   Node.js script - Pas navigateur     ');
console.log('========================================\n');

const filesToScan = [];
for (const dir of DIRS_TO_SCAN) {
  const dirPath = path.join(__dirname, '..', dir);
  console.log(`Scanning ${dir}/...`);
  walkDir(dirPath, filesToScan);
}

let totalErrors = 0;
const allViolations = [];

for (const filePath of filesToScan) {
  const relPath = path.relative(path.join(__dirname, '..'), filePath);
  const violations = scanFile(filePath);
  if (violations.length > 0) {
    allViolations.push({ file: relPath, violations });
    totalErrors += violations.length;
  }
}

if (totalErrors === 0) {
  console.log('\n PASS: Tous les fichiers .js de core/ et test/ sont ASCII strict');
  process.exit(0);
} else {
  console.log('\n FAIL: Caracteres non-ASCII detectes :\n');
  for (const entry of allViolations) {
    console.log(`Fichier: ${entry.file}`);
    for (const v of entry.violations) {
      console.log(`  Ligne ${v.line}, Colonne ${v.column}: '${v.char}' (code ${v.code})`);
    }
    console.log('');
  }
  console.log(`Total erreurs: ${totalErrors}`);
  process.exit(1);
}
