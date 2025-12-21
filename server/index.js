import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import cors from 'cors';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for Vite dev server (accept multiple ports)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'illustrations';
    const uploadPath = path.join(__dirname, '../public/assets', category);

    // Create directory if doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: lowercase, replace spaces with dashes, remove special chars
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitized = nameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '');

    // Add timestamp to avoid duplicates
    const timestamp = Date.now();
    const finalName = `${sanitized}-${timestamp}${ext}`;

    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed (jpeg, jpg, png, gif, svg, webp).'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AccessCity Asset Server is running' });
});

// Upload endpoint
app.post('/api/assets/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const category = req.body.category || 'illustrations';
    const relativePath = `/assets/${category}/${req.file.filename}`;

    // Regenerate manifest
    console.log('[Asset Upload] Regenerating manifest...');
    try {
      const manifestScript = path.join(__dirname, '../tools/generate-assets-manifest.js');
      const { stdout, stderr } = await execAsync(`node "${manifestScript}"`);

      if (stderr) {
        console.error('[Asset Upload] Manifest generation stderr:', stderr);
      }
      if (stdout) {
        console.log('[Asset Upload] Manifest generation stdout:', stdout);
      }

      res.json({
        success: true,
        path: relativePath,
        file: req.file.filename,
        category,
        size: req.file.size,
        message: 'File uploaded and manifest regenerated successfully'
      });
    } catch (manifestError) {
      console.error('[Asset Upload] Manifest generation failed:', manifestError);

      // Still return success for the upload, but warn about manifest
      res.json({
        success: true,
        path: relativePath,
        file: req.file.filename,
        category,
        size: req.file.size,
        warning: 'File uploaded but manifest regeneration failed',
        manifestError: manifestError.message
      });
    }
  } catch (error) {
    console.error('[Asset Upload] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List assets by category
app.get('/api/assets/:category', (req, res) => {
  const { category } = req.params;
  const assetsPath = path.join(__dirname, '../public/assets', category);

  if (!fs.existsSync(assetsPath)) {
    return res.json({ category, files: [] });
  }

  try {
    const files = fs.readdirSync(assetsPath);
    const fileDetails = files
      .filter(file => !file.startsWith('.'))
      .map(file => {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: `/assets/${category}/${file}`,
          size: stats.size,
          modified: stats.mtime
        };
      });

    res.json({ category, files: fileDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: error.message });
  }

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`✅ AccessCity Asset Upload Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving assets from: ${path.join(__dirname, '../public/assets')}`);
});
