import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function generateId() {
  const rows = db.prepare(`SELECT id FROM job_openings WHERE id LIKE 'JOB%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('JOB',''),10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return `JOB${String(next).padStart(3,'0')}`;
}

// GET /api/job-openings
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM job_openings ORDER BY createdAt DESC').all());
});

// GET /api/job-openings/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM job_openings WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Job opening not found' });
  res.json(row);
});

// POST /api/job-openings
router.post('/', (req, res) => {
  const d = req.body;
  const id = d.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`INSERT OR REPLACE INTO job_openings (id, positionName, department, openings, filled, status, description, requirements, updatedAt, updatedBy, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, d.positionName||'', d.department||'', d.openings||1, d.filled||0,
      d.status||'open', d.description||null, d.requirements||null, now, d.updatedBy||null, now);
  res.status(201).json(db.prepare('SELECT * FROM job_openings WHERE id=?').get(id));
});

// PUT /api/job-openings/:id
router.put('/:id', (req, res) => {
  const d = req.body;
  const now = new Date().toISOString();
  const e = db.prepare('SELECT * FROM job_openings WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Job opening not found' });
  db.prepare(`UPDATE job_openings SET positionName=?, department=?, openings=?, filled=?, status=?, description=?, requirements=?, updatedAt=?, updatedBy=? WHERE id=?`)
    .run(d.positionName??e.positionName, d.department??e.department, d.openings??e.openings,
      d.filled??e.filled, d.status??e.status, d.description??e.description,
      d.requirements??e.requirements, now, d.updatedBy??e.updatedBy, req.params.id);
  res.json(db.prepare('SELECT * FROM job_openings WHERE id=?').get(req.params.id));
});

// DELETE /api/job-openings/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM job_openings WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

export default router;
