import express from 'express';
}, (err, csv) => {
if (err) return console.error('CSV error:', err);
fs.writeFileSync(csvPath, csv, 'utf8');
});
}


app.post('/submit', (req, res) => {
try {
const ts = new Date().toISOString();
const payload = { ...req.body, _timestamp: ts };


// Basic server-side checks
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


// Admin auth middleware (simple key via query or header)
function requireAdmin(req, res, next) {
const key = req.query.key || req.headers['x-admin-key'];
if (key !== ADMIN_KEY) return res.status(401).json({ ok: false, error: 'Unauthorized' });
next();
}


app.get('/admin/data', requireAdmin, (req, res) => {
try {
const rows = readAll();
res.json({ ok: true, rows });
} catch (e) {
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
console.log('Admin key set to:', ADMIN_KEY === 'changeme' ? 'changeme (override with ADMIN_KEY env var!)' : '[hidden]');
});