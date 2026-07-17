import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ─── Recruitment Notifications ────────────────────────────────────────────────

// GET /api/notifications/recruitment?userId=
router.get('/recruitment', (req, res) => {
  const { userId } = req.query;
  let rows;
  if (userId) {
    rows = db.prepare('SELECT * FROM recruitment_notifications WHERE toUserId=? ORDER BY timestamp DESC LIMIT 200').all(userId);
  } else {
    rows = db.prepare('SELECT * FROM recruitment_notifications ORDER BY timestamp DESC LIMIT 200').all();
  }
  res.json(rows.map(r => ({ ...r, read: !!r.read })));
});

// POST /api/notifications/recruitment
router.post('/recruitment', (req, res) => {
  const { toUserId, message, type, relatedId } = req.body;
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO recruitment_notifications (toUserId, message, type, relatedId, read, timestamp)
    VALUES (?,?,?,?,0,?)
  `).run(toUserId, message, type||'info', relatedId||null, now);
  res.status(201).json({ id: result.lastInsertRowid, toUserId, message, type: type||'info', relatedId: relatedId||null, read: false, timestamp: now });
});

// PUT /api/notifications/recruitment/:id/read
router.put('/recruitment/:id/read', (req, res) => {
  db.prepare('UPDATE recruitment_notifications SET read=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/notifications/recruitment/:id
router.delete('/recruitment/:id', (req, res) => {
  db.prepare('DELETE FROM recruitment_notifications WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Holiday Notifications ────────────────────────────────────────────────────

// GET /api/notifications/holiday?userId=
router.get('/holiday', (req, res) => {
  const { userId } = req.query;
  let rows;
  if (userId) {
    rows = db.prepare('SELECT * FROM holiday_notifications WHERE toUserId=? ORDER BY timestamp DESC LIMIT 200').all(userId);
  } else {
    rows = db.prepare('SELECT * FROM holiday_notifications ORDER BY timestamp DESC LIMIT 200').all();
  }
  res.json(rows.map(r => ({ ...r, read: !!r.read })));
});

// POST /api/notifications/holiday
router.post('/holiday', (req, res) => {
  const { toUserId, message, holidayId } = req.body;
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO holiday_notifications (toUserId, message, holidayId, read, timestamp) VALUES (?,?,?,0,?)
  `).run(toUserId, message, holidayId||null, now);
  res.status(201).json({ id: result.lastInsertRowid, toUserId, message, holidayId: holidayId||null, read: false, timestamp: now });
});

// PUT /api/notifications/holiday/:id/read
router.put('/holiday/:id/read', (req, res) => {
  db.prepare('UPDATE holiday_notifications SET read=1 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

export default router;
