import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function generateId() {
  const rows = db.prepare(`SELECT id FROM candidate_documents WHERE id LIKE 'DOC%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('DOC', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `DOC${String(next).padStart(3, '0')}`;
}

// GET /api/documents (Optional query parameter: ?candidateId=...)
router.get('/', (req, res) => {
  const { candidateId } = req.query;
  if (candidateId) {
    const rows = db.prepare('SELECT * FROM candidate_documents WHERE candidateId = ? ORDER BY createdAt DESC').all(candidateId);
    return res.json(rows);
  }
  const rows = db.prepare('SELECT * FROM candidate_documents ORDER BY createdAt DESC').all();
  res.json(rows);
});

// GET /api/documents/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM candidate_documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Document not found' });
  res.json(row);
});

// POST /api/documents
router.post('/', (req, res) => {
  const d = req.body;
  if (!d.candidateId) return res.status(400).json({ error: 'candidateId is required' });

  const id = d.id || generateId();
  const now = new Date().toISOString();
  const uploadedBy = req.user ? req.user.username : (d.uploadedBy || null);

  db.prepare(`
    INSERT INTO candidate_documents (id, candidateId, name, type, filePath, fileSize, mimeType, uploadedBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    d.candidateId,
    d.name || 'Untitled Document',
    d.type || 'Resume',
    d.filePath || null,
    d.fileSize || 0,
    d.mimeType || 'application/pdf',
    uploadedBy,
    now
  );

  res.status(201).json(db.prepare('SELECT * FROM candidate_documents WHERE id = ?').get(id));
});

// DELETE /api/documents/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM candidate_documents WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true, message: 'Document deleted successfully' });
});

export default router;
