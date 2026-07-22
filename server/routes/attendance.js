import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function generateId() {
  const rows = db.prepare(`SELECT id FROM attendance WHERE id LIKE 'ATT%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('ATT', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `ATT${String(next).padStart(3, '0')}`;
}

// GET /api/attendance
router.get('/', (req, res) => {
  const { employeeId, date } = req.query;
  let query = 'SELECT * FROM attendance';
  const params = [];
  const conditions = [];
  if (employeeId) { conditions.push('employeeId = ?'); params.push(employeeId); }
  if (date) { conditions.push('date = ?'); params.push(date); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY date DESC, createdAt DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/attendance/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Attendance record not found' });
  res.json(row);
});

// POST /api/attendance
router.post('/', (req, res) => {
  const data = req.body;
  const id = data.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO attendance (id, employeeId, date, checkIn, checkOut, status, workHours, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, data.employeeId, data.date||'', data.checkIn||null, data.checkOut||null,
    data.status||'Present', data.workHours||0, data.notes||null, now);
  res.status(201).json(db.prepare('SELECT * FROM attendance WHERE id = ?').get(id));
});

// PUT /api/attendance/:id
router.put('/:id', (req, res) => {
  const data = req.body;
  const existing = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  db.prepare(`
    UPDATE attendance SET checkIn=?, checkOut=?, status=?, workHours=?, notes=? WHERE id=?
  `).run(
    data.checkIn ?? existing.checkIn, data.checkOut ?? existing.checkOut,
    data.status ?? existing.status, data.workHours ?? existing.workHours,
    data.notes ?? existing.notes, req.params.id
  );
  res.json(db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id));
});

// DELETE /api/attendance/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
