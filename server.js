// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { stringify as csvStringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme';

// Proper __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'public')));

// Data paths
const dataDir = path.join(__dirname, 'data');
const jsonPath = path.join(dataDir, 'submissions.json');
const csvPath = path.join(dataDir, 'submissions.csv');

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, '[]', 'utf8');
  if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, '', 'utf8');
}

function readAll() {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function writeAll(rows) {
  ensureDataFiles();
  // JSON
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  // CSV (sync, no callbacks)
  const csv = csvStringify(rows, {
    header: true,
    cast: { object: (v) => JSON.stringify(v) },
  });
  fs.writeFileSync(csvPath, csv, 'utf8');
}

// Receive submissions
app.post('/submit', (req, res) => {
  try {
    const ts = new Date().toISOString();
    const payload = { ...req.body, _timestamp: ts };

    // Server-side validations
    if (payload.certify !== 'on') {
      return res.status(400).json({ ok: false, error: 'Certification checkbox must be checked.' });
    }
    if (!payload.signature || !payload.signature.trim()) {
      return res.status(400).json({ ok: false, error: 'Signature is required.' });
    }
    if (!payload.signature_date) {
      return res.status(400).json({ ok: false, error: 'Date is required.' });
    }

    const rows = readAll();
    rows.push(payload);
    writeAll(rows);

    res.json({ ok: true, timestamp: ts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Simple admin-key gate
function requireAdmin(req, res, next) {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

app.get('/admin/data', requireAdmin, (req, res) => {
  try {
    res.json({ ok: true, rows: readAll() });
  } catch {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

app.get('/admin/csv', requireAdmin, (req, res) => {
  ensureDataFiles();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  fs.createReadStream(csvPath).pipe(res);
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  ensureDataFiles();
  console.log(`TD1 form server running on http://localhost:${PORT}`);
  console.log('Admin key:', ADMIN_KEY === 'changeme' ? 'changeme (set ADMIN_KEY!)' : '[hidden]');
});
