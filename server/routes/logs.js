import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/logs (Query system activity logs with optional filters)
router.get('/', (req, res) => {
  const { userId, action, limit = 100 } = req.query;
  const maxLimit = Math.min(parseInt(limit, 10) || 100, 500);

  if (userId && action) {
    const rows = db.prepare('SELECT * FROM activity_logs WHERE userId = ? AND action = ? ORDER BY createdAt DESC LIMIT ?')
      .all(userId, action, maxLimit);
    return res.json(rows);
  }
  if (userId) {
    const rows = db.prepare('SELECT * FROM activity_logs WHERE userId = ? ORDER BY createdAt DESC LIMIT ?')
      .all(userId, maxLimit);
    return res.json(rows);
  }
  if (action) {
    const rows = db.prepare('SELECT * FROM activity_logs WHERE action = ? ORDER BY createdAt DESC LIMIT ?')
      .all(action, maxLimit);
    return res.json(rows);
  }

  const rows = db.prepare('SELECT * FROM activity_logs ORDER BY createdAt DESC LIMIT ?').all(maxLimit);
  res.json(rows);
});

// POST /api/logs (Log new system action manually if needed)
router.post('/', (req, res) => {
  const { action, details } = req.body;
  if (!action) return res.status(400).json({ error: 'Action is required' });

  const userId = req.user ? req.user.id : (req.body.userId || 'system');
  const now = new Date().toISOString();

  const result = db.prepare('INSERT INTO activity_logs (action, userId, details, createdAt) VALUES (?, ?, ?, ?)')
    .run(action, userId, details || null, now);

  const newLog = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newLog);
});

export default router;
