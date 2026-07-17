import { Router } from 'express';
import db from '../db.js';

const router = Router();

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}
function genId(prefix, table) {
  const rows = db.prepare(`SELECT id FROM ${table} WHERE id LIKE '${prefix}%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace(prefix,''),10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return `${prefix}${String(next).padStart(3,'0')}`;
}

// ─── Salary Structures ────────────────────────────────────────────────────────

router.get('/salary-structures', (req, res) => {
  const rows = db.prepare('SELECT * FROM salary_structures ORDER BY createdAt DESC').all();
  res.json(rows.map(r => ({ ...r, allowances: parseJSON(r.allowances, {}), deductions: parseJSON(r.deductions, {}) })));
});

router.post('/salary-structures', (req, res) => {
  const d = req.body;
  const id = d.id || genId('SS', 'salary_structures');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO salary_structures (id, name, basic, hra, allowances, deductions, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, d.name||'', d.basic||0, d.hra||0,
      JSON.stringify(d.allowances||{}), JSON.stringify(d.deductions||{}), now, now);
  const row = db.prepare('SELECT * FROM salary_structures WHERE id=?').get(id);
  res.status(201).json({ ...row, allowances: parseJSON(row.allowances,{}), deductions: parseJSON(row.deductions,{}) });
});

router.put('/salary-structures/:id', (req, res) => {
  const d = req.body;
  const now = new Date().toISOString();
  db.prepare(`UPDATE salary_structures SET name=?, basic=?, hra=?, allowances=?, deductions=?, updatedAt=? WHERE id=?`)
    .run(d.name||'', d.basic||0, d.hra||0, JSON.stringify(d.allowances||{}), JSON.stringify(d.deductions||{}), now, req.params.id);
  const row = db.prepare('SELECT * FROM salary_structures WHERE id=?').get(req.params.id);
  res.json({ ...row, allowances: parseJSON(row.allowances,{}), deductions: parseJSON(row.deductions,{}) });
});

router.delete('/salary-structures/:id', (req, res) => {
  db.prepare('DELETE FROM salary_structures WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Employee Salaries ────────────────────────────────────────────────────────

router.get('/employee-salaries', (req, res) => {
  const { employeeId } = req.query;
  if (employeeId) {
    res.json(db.prepare('SELECT * FROM employee_salaries WHERE employeeId=? ORDER BY createdAt DESC').all(employeeId));
  } else {
    res.json(db.prepare('SELECT * FROM employee_salaries ORDER BY createdAt DESC').all());
  }
});

router.post('/employee-salaries', (req, res) => {
  const d = req.body;
  const id = d.id || genId('ES', 'employee_salaries');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO employee_salaries (id, employeeId, structureId, effectiveDate, ctc, createdAt) VALUES (?,?,?,?,?,?)`)
    .run(id, d.employeeId, d.structureId||null, d.effectiveDate||'', d.ctc||0, now);
  res.status(201).json(db.prepare('SELECT * FROM employee_salaries WHERE id=?').get(id));
});

router.put('/employee-salaries/:id', (req, res) => {
  const d = req.body;
  db.prepare(`UPDATE employee_salaries SET structureId=?, effectiveDate=?, ctc=? WHERE id=?`)
    .run(d.structureId||null, d.effectiveDate||'', d.ctc||0, req.params.id);
  res.json(db.prepare('SELECT * FROM employee_salaries WHERE id=?').get(req.params.id));
});

router.delete('/employee-salaries/:id', (req, res) => {
  db.prepare('DELETE FROM employee_salaries WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Payrolls ─────────────────────────────────────────────────────────────────

router.get('/payrolls', (req, res) => {
  const { month, year, employeeId } = req.query;
  let q = 'SELECT * FROM payrolls';
  const c = [], p = [];
  if (month) { c.push('month=?'); p.push(month); }
  if (year) { c.push('year=?'); p.push(year); }
  if (employeeId) { c.push('employeeId=?'); p.push(employeeId); }
  if (c.length) q += ' WHERE ' + c.join(' AND ');
  q += ' ORDER BY createdAt DESC';
  res.json(db.prepare(q).all(...p));
});

router.post('/payrolls', (req, res) => {
  const d = req.body;
  const id = d.id || genId('PAY', 'payrolls');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO payrolls (id, month, year, employeeId, grossPay, deductions, netPay, status, processedAt, processedBy, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, d.month||'', d.year||'', d.employeeId||'', d.grossPay||0, d.deductions||0, d.netPay||0,
      d.status||'Draft', d.processedAt||null, d.processedBy||null, now);
  res.status(201).json(db.prepare('SELECT * FROM payrolls WHERE id=?').get(id));
});

router.put('/payrolls/:id', (req, res) => {
  const d = req.body;
  const e = db.prepare('SELECT * FROM payrolls WHERE id=?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Payroll not found' });
  db.prepare(`UPDATE payrolls SET month=?, year=?, employeeId=?, grossPay=?, deductions=?, netPay=?, status=?, processedAt=?, processedBy=? WHERE id=?`)
    .run(d.month??e.month, d.year??e.year, d.employeeId??e.employeeId, d.grossPay??e.grossPay,
      d.deductions??e.deductions, d.netPay??e.netPay, d.status??e.status,
      d.processedAt??e.processedAt, d.processedBy??e.processedBy, req.params.id);
  res.json(db.prepare('SELECT * FROM payrolls WHERE id=?').get(req.params.id));
});

router.delete('/payrolls/:id', (req, res) => {
  db.prepare('DELETE FROM payrolls WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Bonuses ──────────────────────────────────────────────────────────────────

router.get('/bonuses', (req, res) => {
  const { employeeId } = req.query;
  if (employeeId) res.json(db.prepare('SELECT * FROM bonuses WHERE employeeId=?').all(employeeId));
  else res.json(db.prepare('SELECT * FROM bonuses ORDER BY createdAt DESC').all());
});

router.post('/bonuses', (req, res) => {
  const d = req.body;
  const id = d.id || genId('BON', 'bonuses');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO bonuses (id, employeeId, type, amount, month, year, description, createdAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, d.employeeId, d.type||'', d.amount||0, d.month||'', d.year||'', d.description||'', now);
  res.status(201).json(db.prepare('SELECT * FROM bonuses WHERE id=?').get(id));
});

router.delete('/bonuses/:id', (req, res) => {
  db.prepare('DELETE FROM bonuses WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ─── Deductions ───────────────────────────────────────────────────────────────

router.get('/deductions', (req, res) => {
  const { employeeId } = req.query;
  if (employeeId) res.json(db.prepare('SELECT * FROM deductions WHERE employeeId=?').all(employeeId));
  else res.json(db.prepare('SELECT * FROM deductions ORDER BY createdAt DESC').all());
});

router.post('/deductions', (req, res) => {
  const d = req.body;
  const id = d.id || genId('DED', 'deductions');
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO deductions (id, employeeId, type, amount, month, year, description, createdAt) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, d.employeeId, d.type||'', d.amount||0, d.month||'', d.year||'', d.description||'', now);
  res.status(201).json(db.prepare('SELECT * FROM deductions WHERE id=?').get(id));
});

router.delete('/deductions/:id', (req, res) => {
  db.prepare('DELETE FROM deductions WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

export default router;
