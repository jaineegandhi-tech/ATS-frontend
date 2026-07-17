import { Router } from 'express';
import db from '../db.js';

const router = Router();

function parseEmployee(emp) {
  if (!emp) return null;
  return {
    ...emp,
    emergencyContact: parseJSON(emp.emergencyContact, {}),
    profileCompleted: !!emp.profileCompleted,
  };
}

function parseJSON(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

function generateEmpId() {
  const rows = db.prepare(`SELECT id FROM employees WHERE id LIKE 'EMP%'`).all();
  const nums = rows.map(r => parseInt(r.id.replace('EMP', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `EMP${String(next).padStart(3, '0')}`;
}

// GET /api/employees
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM employees ORDER BY id').all();
  res.json(rows.map(parseEmployee));
});

// GET /api/employees/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Employee not found' });
  res.json(parseEmployee(row));
});

// POST /api/employees
router.post('/', (req, res) => {
  const data = req.body;
  const id = data.id || generateEmpId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO employees (id, username, password, role, status, firstName, lastName, middleName,
    email, department, designation, joiningDate, employmentType, gender, dob, bloodGroup, maritalStatus,
    nationality, mobile, alternateMobile, personalEmail, currentAddress, permanentAddress, city, state,
    country, postalCode, reportingManager, emergencyContact, profilePicture, profileCompleted, createdAt, updatedAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.username||'', data.password||'password123', data.role||'employee',
    data.status||'active', data.firstName||'', data.lastName||'', data.middleName||'',
    data.email||'', data.department||'', data.designation||'', data.joiningDate||'',
    data.employmentType||'', data.gender||'', data.dob||'', data.bloodGroup||'',
    data.maritalStatus||'', data.nationality||'', data.mobile||'', data.alternateMobile||'',
    data.personalEmail||'', data.currentAddress||'', data.permanentAddress||'',
    data.city||'', data.state||'', data.country||'', data.postalCode||'',
    data.reportingManager||'',
    typeof data.emergencyContact === 'object' ? JSON.stringify(data.emergencyContact) : (data.emergencyContact||'{}'),
    data.profilePicture||null, data.profileCompleted ? 1 : 0, now, now);

  const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  res.status(201).json(parseEmployee(created));
});

// PUT /api/employees/:id
router.put('/:id', (req, res) => {
  const data = req.body;
  const now = new Date().toISOString();
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  db.prepare(`
    UPDATE employees SET
      username=?, password=?, role=?, status=?, firstName=?, lastName=?, middleName=?,
      email=?, department=?, designation=?, joiningDate=?, employmentType=?, gender=?, dob=?,
      bloodGroup=?, maritalStatus=?, nationality=?, mobile=?, alternateMobile=?, personalEmail=?,
      currentAddress=?, permanentAddress=?, city=?, state=?, country=?, postalCode=?,
      reportingManager=?, emergencyContact=?, profilePicture=?, profileCompleted=?, updatedAt=?
    WHERE id=?
  `).run(
    data.username ?? emp.username, data.password ?? emp.password,
    data.role ?? emp.role, data.status ?? emp.status,
    data.firstName ?? emp.firstName, data.lastName ?? emp.lastName, data.middleName ?? emp.middleName,
    data.email ?? emp.email, data.department ?? emp.department, data.designation ?? emp.designation,
    data.joiningDate ?? emp.joiningDate, data.employmentType ?? emp.employmentType,
    data.gender ?? emp.gender, data.dob ?? emp.dob, data.bloodGroup ?? emp.bloodGroup,
    data.maritalStatus ?? emp.maritalStatus, data.nationality ?? emp.nationality,
    data.mobile ?? emp.mobile, data.alternateMobile ?? emp.alternateMobile,
    data.personalEmail ?? emp.personalEmail, data.currentAddress ?? emp.currentAddress,
    data.permanentAddress ?? emp.permanentAddress, data.city ?? emp.city,
    data.state ?? emp.state, data.country ?? emp.country, data.postalCode ?? emp.postalCode,
    data.reportingManager ?? emp.reportingManager,
    data.emergencyContact !== undefined
      ? (typeof data.emergencyContact === 'object' ? JSON.stringify(data.emergencyContact) : data.emergencyContact)
      : emp.emergencyContact,
    data.profilePicture !== undefined ? data.profilePicture : emp.profilePicture,
    data.profileCompleted !== undefined ? (data.profileCompleted ? 1 : 0) : emp.profileCompleted,
    now, req.params.id
  );

  const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(parseEmployee(updated));
});

// DELETE /api/employees/:id (soft delete)
router.delete('/:id', (req, res) => {
  db.prepare(`UPDATE employees SET status='inactive', updatedAt=? WHERE id=?`)
    .run(new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

export default router;
