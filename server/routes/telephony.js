import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function generateId() {
  const rows = db.prepare(`SELECT id FROM telephony_interviews WHERE id LIKE 'TEL%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('TEL', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `TEL${String(next).padStart(3, '0')}`;
}

// GET /api/telephony
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM telephony_interviews ORDER BY createdAt DESC').all();
  res.json(rows);
});

// GET /api/telephony/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM telephony_interviews WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Telephonic interview record not found' });
  res.json(row);
});

// POST /api/telephony
router.post('/', (req, res) => {
  const d = req.body;
  const id = d.id || generateId();
  const now = new Date().toISOString();
  const createdBy = req.user ? req.user.username : (d.createdBy || null);

  db.prepare(`
    INSERT INTO telephony_interviews (
      id, candidateName, contactNumber, position, department, callDate, callTime,
      calledBy, duration, outcome, currentCTC, expectedCTC, noticePeriod,
      immediateJoiner, notes, candidateId, createdBy, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, d.candidateName || '', d.contactNumber || '', d.position || '', d.department || '',
    d.callDate || '', d.callTime || '', d.calledBy || '', d.duration || '',
    d.outcome || 'Positive', d.currentCTC || null, d.expectedCTC || null,
    d.noticePeriod || null, d.immediateJoiner ? 1 : 0, d.notes || null,
    d.candidateId || null, createdBy, now, now
  );

  res.status(201).json(db.prepare('SELECT * FROM telephony_interviews WHERE id = ?').get(id));
});

// PUT /api/telephony/:id
router.put('/:id', (req, res) => {
  const d = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM telephony_interviews WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Telephonic interview record not found' });

  db.prepare(`
    UPDATE telephony_interviews SET
      candidateName = ?, contactNumber = ?, position = ?, department = ?,
      callDate = ?, callTime = ?, calledBy = ?, duration = ?, outcome = ?,
      currentCTC = ?, expectedCTC = ?, noticePeriod = ?, immediateJoiner = ?,
      notes = ?, candidateId = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    d.candidateName ?? existing.candidateName,
    d.contactNumber ?? existing.contactNumber,
    d.position ?? existing.position,
    d.department ?? existing.department,
    d.callDate ?? existing.callDate,
    d.callTime ?? existing.callTime,
    d.calledBy ?? existing.calledBy,
    d.duration ?? existing.duration,
    d.outcome ?? existing.outcome,
    d.currentCTC ?? existing.currentCTC,
    d.expectedCTC ?? existing.expectedCTC,
    d.noticePeriod ?? existing.noticePeriod,
    d.immediateJoiner !== undefined ? (d.immediateJoiner ? 1 : 0) : existing.immediateJoiner,
    d.notes ?? existing.notes,
    d.candidateId ?? existing.candidateId,
    now,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM telephony_interviews WHERE id = ?').get(req.params.id));
});

// DELETE /api/telephony/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM telephony_interviews WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Telephonic interview record not found' });
  res.json({ success: true, message: 'Record deleted successfully' });
});

export default router;
