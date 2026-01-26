import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_FILE = path.join(__dirname, '../public/assets-manifest.json');

// Image and audio extensions
const supportedExtensions = [
  // Images
  '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif',
  // Audio
  '.mp3', '.wav', '.ogg', '.m4a', '.flac'
];

function scanDirectory(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Directory not found: ${dir}`);
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (supportedExtensions.includes(path.extname(entry.name).toLowerCase())) {
      const stats = fs.statSync(fullPath);
      const category = relativePath.split('/')[0]; // 'backgrounds', 'characters', etc.

      results.push({
        id: relativePath.replace(/\\/g, '/').replace(/\.\w+$/, ''),
        name: entry.name.replace(/\.\w+$/, '').replace(/_/g, ' '),
        path: `/assets/${relativePath}`,
        type: path.extname(entry.name).slice(1),
        category: category,
        size: stats.size,
        modified: stats.mtime.toISOString()
      });
    }
  }

  return results;
}

try {
  // Creer le dossier assets s'il n'existe pas
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    console.log(`📁 Created assets directory: ${ASSETS_DIR}`);
  }

  const assets = scanDirectory(ASSETS_DIR);

  // Grouper par categorie
  const byCategory = assets.reduce((acc, asset) => {
    if (!acc[asset.category]) acc[asset.category] = [];
    acc[asset.category].push(asset);
    return acc;
  }, {});

  const manifest = {
    generated: new Date().toISOString(),
    version: '1.0.0',
    totalAssets: assets.length,
    categories: Object.keys(byCategory),
    assets: byCategory
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`✅ Assets manifest generated successfully`);
  } catch (writeError) {
    if (writeError.code === 'EBADF' && fs.existsSync(OUTPUT_FILE)) {
      console.warn(`⚠️  Manifest file locked, using existing version`);
    } else {
      throw writeError;
    }
  }
  console.log(`📊 Total: ${manifest.totalAssets} files`);
  console.log(`📂 Categories: ${manifest.categories.join(', ') || 'none'}`);
  console.log(`💾 Output: ${OUTPUT_FILE}`);
} catch (error) {
  console.error('❌ Error generating manifest:', error);
  process.exit(1);
}
