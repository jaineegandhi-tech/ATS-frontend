import { Router } from 'express';
import db from '../db.js';

const router = Router();

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function parseCandidate(c) {
  if (!c) return null;
  return {
    ...c,
    timeline: parseJSON(c.timeline, []),
    skills: parseJSON(c.skills, c.skills),
    education: parseJSON(c.education, c.education),
  };
}

function generateId() {
  const rows = db.prepare(`SELECT id FROM candidates WHERE id LIKE 'CAND%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('CAND', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `CAND${String(next).padStart(3, '0')}`;
}

// GET /api/candidates
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM candidates ORDER BY createdAt DESC').all();
  res.json(rows.map(parseCandidate));
});

// GET /api/candidates/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Candidate not found' });
  res.json(parseCandidate(row));
});

// POST /api/candidates
router.post('/', (req, res) => {
  const data = req.body;
  const id = data.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO candidates (id, firstName, lastName, email, mobile, location, appliedPosition,
    department, employmentType, status, currentRound, resumeFile, resumeText, experience, skills,
    education, linkedIn, portfolio, expectedSalary, noticePeriod, source, notes, timeline, createdAt, createdBy, updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.firstName||'', data.lastName||'', data.email||'', data.mobile||'',
    data.location||'', data.appliedPosition||'', data.department||'', data.employmentType||'',
    data.status||'New Candidate', data.currentRound||null,
    data.resumeFile||null, data.resumeText||null, data.experience||null,
    typeof data.skills === 'object' ? JSON.stringify(data.skills) : (data.skills||null),
    typeof data.education === 'object' ? JSON.stringify(data.education) : (data.education||null),
    data.linkedIn||null, data.portfolio||null, data.expectedSalary||null,
    data.noticePeriod||null, data.source||null, data.notes||null,
    Array.isArray(data.timeline) ? JSON.stringify(data.timeline) : (data.timeline||'[]'),
    now, data.createdBy||null, now);

  const created = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  res.status(201).json(parseCandidate(created));
});

// PUT /api/candidates/:id
router.put('/:id', (req, res) => {
  const data = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });

  const fields = ['firstName','lastName','email','mobile','location','appliedPosition','department',
    'employmentType','status','currentRound','resumeFile','resumeText','experience',
    'linkedIn','portfolio','expectedSalary','noticePeriod','source','notes','createdBy'];
  const jsonFields = ['timeline','skills','education'];

  const updates = [];
  const values = [];

  for (const f of fields) {
    if (data[f] !== undefined) {
      updates.push(`${f}=?`);
      values.push(data[f]);
    }
  }
  for (const f of jsonFields) {
    if (data[f] !== undefined) {
      updates.push(`${f}=?`);
      values.push(typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
    }
  }
  updates.push('updatedAt=?');
  values.push(now, req.params.id);

  if (updates.length > 1) {
    db.prepare(`UPDATE candidates SET ${updates.join(', ')} WHERE id=?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  res.json(parseCandidate(updated));
});

// DELETE /api/candidates/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/candidates/sync-statuses
router.post('/sync-statuses', (req, res) => {
  const candidates = db.prepare('SELECT * FROM candidates').all();
  const interviews = db.prepare('SELECT * FROM interviews').all();
  let changed = 0;
  const update = db.prepare(`UPDATE candidates SET status=?, currentRound=? WHERE id=?`);
  const updateMany = db.transaction(() => {
    for (const c of candidates) {
      if (c.status === 'Interview Scheduled') {
        const hasActive = interviews.some(i => i.candidateId === c.id && i.status !== 'cancelled');
        if (!hasActive) {
          update.run('New Candidate', null, c.id);
          changed++;
        }
      }
    }
  });
  updateMany();
  res.json({ success: true, changed });
});

export default router;
