import { Router } from 'express';
import db from '../db.js';

const router = Router();

function generateId() {
  const rows = db.prepare(`SELECT id FROM holidays WHERE id LIKE 'HOL%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('HOL',''),10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return `HOL${String(next).padStart(3,'0')}`;
}

// GET /api/holidays
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM holidays ORDER BY date ASC').all()
    .map(h => ({ ...h, repeatEveryYear: !!h.repeatEveryYear })));
});

// GET /api/holidays/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM holidays WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Holiday not found' });
  res.json({ ...row, repeatEveryYear: !!row.repeatEveryYear });
});

// POST /api/holidays
router.post('/', (req, res) => {
  const d = req.body;
  const id = d.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO holidays (id, name, date, type, description, repeatEveryYear, status, createdAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, d.name||'', d.date||'', d.type||'', d.description||'', d.repeatEveryYear?1:0, d.status||'active', now);
  const row = db.prepare('SELECT * FROM holidays WHERE id=?').get(id);
  res.status(201).json({ ...row, repeatEveryYear: !!row.repeatEveryYear });
});

// PUT /api/holidays/:id
router.put('/:id', (req, res) => {
  const d = req.body;
  const e = db.prepare('SELECT * FROM holidays WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Holiday not found' });
  db.prepare(`UPDATE holidays SET name=?, date=?, type=?, description=?, repeatEveryYear=?, status=? WHERE id=?`)
    .run(d.name??e.name, d.date??e.date, d.type??e.type, d.description??e.description,
      d.repeatEveryYear!==undefined?(d.repeatEveryYear?1:0):e.repeatEveryYear,
      d.status??e.status, req.params.id);
  const row = db.prepare('SELECT * FROM holidays WHERE id=?').get(req.params.id);
  res.json({ ...row, repeatEveryYear: !!row.repeatEveryYear });
});

// DELETE /api/holidays/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM holidays WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

export default router;
