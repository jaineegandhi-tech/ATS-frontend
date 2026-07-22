import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function parseInterview(iv) {
  if (!iv) return null;
  return {
    ...iv,
    interviewerIds: parseJSON(iv.interviewerIds, []),
    feedback: parseJSON(iv.feedback, iv.feedback),
  };
}

function generateId() {
  const rows = db.prepare(`SELECT id FROM interviews WHERE id LIKE 'IV%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('IV', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `IV${String(next).padStart(3, '0')}`;
}

// GET /api/interviews
router.get('/', (req, res) => {
  const { candidateId } = req.query;
  let rows;
  if (candidateId) {
    rows = db.prepare('SELECT * FROM interviews WHERE candidateId = ? ORDER BY date, time').all(candidateId);
  } else {
    rows = db.prepare('SELECT * FROM interviews ORDER BY date, time').all();
  }
  res.json(rows.map(parseInterview));
});

// GET /api/interviews/conflict — check for scheduling conflict
router.get('/conflict', (req, res) => {
  const { date, time, excludeId } = req.query;
  let row;
  if (excludeId) {
    row = db.prepare(`SELECT * FROM interviews WHERE date=? AND time=? AND status!='cancelled' AND id!=?`).get(date, time, excludeId);
  } else {
    row = db.prepare(`SELECT * FROM interviews WHERE date=? AND time=? AND status!='cancelled'`).get(date, time);
  }
  res.json(row ? parseInterview(row) : null);
});

// GET /api/interviews/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Interview not found' });
  res.json(parseInterview(row));
});

// POST /api/interviews
router.post('/', (req, res) => {
  const data = req.body;
  const id = data.id || generateId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO interviews (id, candidateId, date, time, duration, mode, round, interviewerIds,
    status, feedback, meetingLink, location, notes, createdAt, updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.candidateId, data.date||'', data.time||'', data.duration||'60',
    data.mode||'Online', data.round||'HR Round',
    Array.isArray(data.interviewerIds) ? JSON.stringify(data.interviewerIds) : (data.interviewerIds||'[]'),
    data.status||'scheduled',
    data.feedback ? (typeof data.feedback === 'object' ? JSON.stringify(data.feedback) : data.feedback) : null,
    data.meetingLink||null, data.location||null, data.notes||null, now, now);

  const created = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.status(201).json(parseInterview(created));
});

// PUT /api/interviews/:id
router.put('/:id', (req, res) => {
  const data = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Interview not found' });

  db.prepare(`
    UPDATE interviews SET
      candidateId=?, date=?, time=?, duration=?, mode=?, round=?,
      interviewerIds=?, status=?, feedback=?, meetingLink=?, location=?, notes=?, updatedAt=?
    WHERE id=?
  `).run(
    data.candidateId ?? existing.candidateId,
    data.date ?? existing.date, data.time ?? existing.time,
    data.duration ?? existing.duration, data.mode ?? existing.mode,
    data.round ?? existing.round,
    data.interviewerIds !== undefined
      ? (Array.isArray(data.interviewerIds) ? JSON.stringify(data.interviewerIds) : data.interviewerIds)
      : existing.interviewerIds,
    data.status ?? existing.status,
    data.feedback !== undefined
      ? (typeof data.feedback === 'object' && data.feedback !== null ? JSON.stringify(data.feedback) : data.feedback)
      : existing.feedback,
    data.meetingLink ?? existing.meetingLink,
    data.location ?? existing.location,
    data.notes ?? existing.notes,
    now, req.params.id
  );

  const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  res.json(parseInterview(updated));
});

// DELETE /api/interviews/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM interviews WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
