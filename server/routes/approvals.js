import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function parseApproval(row) {
  if (!row) return null;
  return {
    ...row,
    data: parseJSON(row.data, {}),
  };
}

function generateId() {
  const rows = db.prepare(`SELECT id FROM approvals WHERE id LIKE 'APP%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('APP', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `APP${String(next).padStart(3, '0')}`;
}

// GET /api/approvals
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM approvals ORDER BY createdAt DESC').all();
  res.json(rows.map(parseApproval));
});

// GET /api/approvals/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Approval request not found' });
  res.json(parseApproval(row));
});

// POST /api/approvals
router.post('/', (req, res) => {
  const d = req.body;
  const id = d.id || generateId();
  const now = new Date().toISOString();
  const requestedBy = req.user ? req.user.username : (d.requestedBy || null);

  db.prepare(`
    INSERT INTO approvals (id, type, candidateId, requestedBy, status, notes, reviewedBy, reviewedAt, data, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    d.type || 'Offer Letter',
    d.candidateId || null,
    requestedBy,
    d.status || 'Pending',
    d.notes || null,
    d.reviewedBy || null,
    d.reviewedAt || null,
    typeof d.data === 'object' ? JSON.stringify(d.data) : (d.data || '{}'),
    now
  );

  res.status(201).json(parseApproval(db.prepare('SELECT * FROM approvals WHERE id = ?').get(id)));
});

// PUT /api/approvals/:id (Review / Update Status)
router.put('/:id', (req, res) => {
  const d = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Approval request not found' });

  const reviewedBy = req.user ? req.user.username : (d.reviewedBy || existing.reviewedBy);
  const reviewedAt = (d.status && d.status !== existing.status) ? now : existing.reviewedAt;

  db.prepare(`
    UPDATE approvals SET
      type = ?, candidateId = ?, status = ?, notes = ?,
      reviewedBy = ?, reviewedAt = ?, data = ?
    WHERE id = ?
  `).run(
    d.type ?? existing.type,
    d.candidateId ?? existing.candidateId,
    d.status ?? existing.status,
    d.notes ?? existing.notes,
    reviewedBy,
    reviewedAt,
    typeof d.data === 'object' ? JSON.stringify(d.data) : (d.data ?? existing.data),
    req.params.id
  );

  res.json(parseApproval(db.prepare('SELECT * FROM approvals WHERE id = ?').get(req.params.id)));
});

// DELETE /api/approvals/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM approvals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Approval request not found' });
  res.json({ success: true, message: 'Approval request deleted successfully' });
});

export default router;
