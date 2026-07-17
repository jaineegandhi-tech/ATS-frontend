import { Router } from 'express';
import db from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const emp = db.prepare('SELECT * FROM employees WHERE username = ? AND password = ?').get(username, password);
  if (!emp) return res.status(401).json({ error: 'Invalid username or password.' });
  if (emp.status === 'inactive') return res.status(403).json({ error: 'Your account has been deactivated. Please contact HR.' });

  // Parse JSON fields
  emp.emergencyContact = parseJSON(emp.emergencyContact, {});

  // Log activity
  db.prepare(`INSERT INTO activity_logs (action, userId, details, timestamp) VALUES (?, ?, ?, ?)`)
    .run('Login', emp.id, `${emp.firstName} ${emp.lastName} logged in`, new Date().toISOString());

  res.json({ success: true, user: emp, needsProfile: !emp.profileCompleted });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { userId, name } = req.body;
  if (userId) {
    db.prepare(`INSERT INTO activity_logs (action, userId, details, timestamp) VALUES (?, ?, ?, ?)`)
      .run('Logout', userId, `${name || userId} logged out`, new Date().toISOString());
  }
  res.json({ success: true });
});

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

export default router;
