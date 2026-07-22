import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function parseAsset(a) {
  if (!a) return null;
  return { ...a, history: parseJSON(a.history, []) };
}

function generateId() {
  const rows = db.prepare(`SELECT id FROM assets WHERE id LIKE 'AST%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('AST',''),10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return `AST${String(next).padStart(3,'0')}`;
}

// GET /api/assets
router.get('/', (req, res) => {
  const { employeeId } = req.query;
  let rows;
  if (employeeId) rows = db.prepare('SELECT * FROM assets WHERE assignedEmployeeId=? ORDER BY createdAt DESC').all(employeeId);
  else rows = db.prepare('SELECT * FROM assets ORDER BY createdAt DESC').all();
  res.json(rows.map(parseAsset));
});

// GET /api/assets/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assets WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Asset not found' });
  res.json(parseAsset(row));
});

// POST /api/assets
router.post('/', (req, res) => {
  const d = req.body;
  const id = d.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO assets (id, name, category, brand, model, serialNumber, purchaseDate, purchaseCost,
    warrantyExpiry, condition, status, assignedEmployeeId, assignedEmployeeName, assignedDate,
    expectedReturnDate, history, createdAt, updatedAt, updatedById, updatedByName)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, d.name||'', d.category||'', d.brand||'', d.model||'', d.serialNumber||'',
    d.purchaseDate||'', d.purchaseCost||0, d.warrantyExpiry||'', d.condition||'Good',
    d.status||'Available', d.assignedEmployeeId||null, d.assignedEmployeeName||null,
    d.assignedDate||null, d.expectedReturnDate||null,
    Array.isArray(d.history) ? JSON.stringify(d.history) : (d.history||'[]'),
    now, now, d.updatedById||null, d.updatedByName||null);
  res.status(201).json(parseAsset(db.prepare('SELECT * FROM assets WHERE id=?').get(id)));
});

// PUT /api/assets/:id
router.put('/:id', (req, res) => {
  const d = req.body;
  const now = new Date().toISOString();
  const e = db.prepare('SELECT * FROM assets WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Asset not found' });
  db.prepare(`
    UPDATE assets SET name=?, category=?, brand=?, model=?, serialNumber=?, purchaseDate=?,
    purchaseCost=?, warrantyExpiry=?, condition=?, status=?, assignedEmployeeId=?, assignedEmployeeName=?,
    assignedDate=?, expectedReturnDate=?, history=?, updatedAt=?, updatedById=?, updatedByName=?
    WHERE id=?
  `).run(
    d.name??e.name, d.category??e.category, d.brand??e.brand, d.model??e.model,
    d.serialNumber??e.serialNumber, d.purchaseDate??e.purchaseDate, d.purchaseCost??e.purchaseCost,
    d.warrantyExpiry??e.warrantyExpiry, d.condition??e.condition, d.status??e.status,
    d.assignedEmployeeId!==undefined?d.assignedEmployeeId:e.assignedEmployeeId,
    d.assignedEmployeeName!==undefined?d.assignedEmployeeName:e.assignedEmployeeName,
    d.assignedDate!==undefined?d.assignedDate:e.assignedDate,
    d.expectedReturnDate!==undefined?d.expectedReturnDate:e.expectedReturnDate,
    d.history!==undefined?(Array.isArray(d.history)?JSON.stringify(d.history):d.history):e.history,
    now, d.updatedById??e.updatedById, d.updatedByName??e.updatedByName, req.params.id
  );
  res.json(parseAsset(db.prepare('SELECT * FROM assets WHERE id=?').get(req.params.id)));
});

// DELETE /api/assets/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM assets WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

export default router;
