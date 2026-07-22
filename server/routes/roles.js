import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function parseRole(r) {
  if (!r) return null;
  return {
    ...r,
    isSystem: !!r.isSystem,
    permissions: parseJSON(r.permissions, {}),
  };
}

// GET /api/roles
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM custom_roles ORDER BY createdAt').all();
  res.json(rows.map(parseRole));
});

// POST /api/roles (Create or Update Custom Role)
router.post('/', (req, res) => {
  const d = req.body;
  if (!d.id || !d.label) return res.status(400).json({ error: 'Role id and label are required' });
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO custom_roles (id, label, isSystem, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    d.id,
    d.label,
    d.isSystem ? 1 : 0,
    typeof d.permissions === 'object' ? JSON.stringify(d.permissions) : (d.permissions || '{}'),
    d.createdAt || now
  );

  res.status(201).json(parseRole(db.prepare('SELECT * FROM custom_roles WHERE id = ?').get(d.id)));
});

// DELETE /api/roles/:id
router.delete('/:id', (req, res) => {
  const role = db.prepare('SELECT * FROM custom_roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(403).json({ error: 'Cannot delete system default roles' });

  db.prepare('DELETE FROM custom_roles WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Custom role deleted successfully' });
});

export default router;
