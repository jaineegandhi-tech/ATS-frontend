import { Router } from 'express';
import db from '../db.js';

const router = Router();

function generateId(prefix, table) {
  const rows = db.prepare(`SELECT id FROM ${table} WHERE id LIKE '${prefix}%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace(prefix, ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

// GET /api/leaves
router.get('/', (req, res) => {
  const { employeeId } = req.query;
  let rows;
  if (employeeId) {
    rows = db.prepare('SELECT * FROM leaves WHERE employeeId = ? ORDER BY createdAt DESC').all(employeeId);
  } else {
    rows = db.prepare('SELECT * FROM leaves ORDER BY createdAt DESC').all();
  }
  res.json(rows);
});

// GET /api/leaves/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Leave not found' });
  res.json(row);
});

// POST /api/leaves
router.post('/', (req, res) => {
  const data = req.body;
  const id = data.id || generateId('LV', 'leaves');
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO leaves (id, employeeId, leaveType, startDate, endDate, days, reason, status, approvedBy, approvedAt, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.employeeId, data.leaveType||'', data.startDate||'', data.endDate||'',
    data.days||1, data.reason||'', data.status||'Pending',
    data.approvedBy||null, data.approvedAt||null, now);

  res.status(201).json(db.prepare('SELECT * FROM leaves WHERE id = ?').get(id));
});

// PUT /api/leaves/:id
router.put('/:id', (req, res) => {
  const data = req.body;
  const existing = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Leave not found' });

  db.prepare(`
    UPDATE leaves SET leaveType=?, startDate=?, endDate=?, days=?, reason=?, status=?, approvedBy=?, approvedAt=?
    WHERE id=?
  `).run(
    data.leaveType ?? existing.leaveType, data.startDate ?? existing.startDate,
    data.endDate ?? existing.endDate, data.days ?? existing.days,
    data.reason ?? existing.reason, data.status ?? existing.status,
    data.approvedBy ?? existing.approvedBy, data.approvedAt ?? existing.approvedAt,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id));
});

// DELETE /api/leaves/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM leaves WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/leaves/balances/:employeeId
router.get('/balances/:employeeId', (req, res) => {
  const rows = db.prepare('SELECT leaveType, balance FROM leave_balances WHERE employeeId = ?').all(req.params.employeeId);
  const result = {};
  for (const r of rows) result[r.leaveType] = r.balance;
  res.json(result);
});

// PUT /api/leaves/balances/:employeeId
router.put('/balances/:employeeId', (req, res) => {
  const balances = req.body; // { Annual: 15, Sick: 10, ... }
  const upsert = db.prepare(`
    INSERT INTO leave_balances (employeeId, leaveType, balance) VALUES (?,?,?)
    ON CONFLICT(employeeId, leaveType) DO UPDATE SET balance=excluded.balance
  `);
  const upsertMany = db.transaction(() => {
    for (const [leaveType, balance] of Object.entries(balances)) {
      upsert.run(req.params.employeeId, leaveType, balance);
    }
  });
  upsertMany();
  const rows = db.prepare('SELECT leaveType, balance FROM leave_balances WHERE employeeId = ?').all(req.params.employeeId);
  const result = {};
  for (const r of rows) result[r.leaveType] = r.balance;
  res.json(result);
});

// GET /api/leaves/all-balances
router.get('/all-balances', (req, res) => {
  const rows = db.prepare('SELECT * FROM leave_balances').all();
  const result = {};
  for (const r of rows) {
    if (!result[r.employeeId]) result[r.employeeId] = {};
    result[r.employeeId][r.leaveType] = r.balance;
  }
  res.json(result);
});

export default router;
