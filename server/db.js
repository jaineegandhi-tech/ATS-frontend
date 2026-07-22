import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'ats.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`

  -- ATS Users (HR, Interviewers, Recruiters, Admin)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    mobile TEXT,
    department TEXT,
    designation TEXT,
    profilePicture TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  -- Employees Table
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    firstName TEXT,
    lastName TEXT,
    middleName TEXT,
    email TEXT,
    department TEXT,
    designation TEXT,
    joiningDate TEXT,
    employmentType TEXT,
    gender TEXT,
    dob TEXT,
    bloodGroup TEXT,
    maritalStatus TEXT,
    nationality TEXT,
    mobile TEXT,
    alternateMobile TEXT,
    personalEmail TEXT,
    currentAddress TEXT,
    permanentAddress TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postalCode TEXT,
    reportingManager TEXT,
    emergencyContact TEXT DEFAULT '{}',
    profilePicture TEXT,
    profileCompleted INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  -- Departments master list
  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  -- Job Openings
  CREATE TABLE IF NOT EXISTS job_openings (
    id TEXT PRIMARY KEY,
    positionName TEXT NOT NULL,
    department TEXT,
    openings INTEGER DEFAULT 1,
    filled INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    description TEXT,
    requirements TEXT,
    salaryRange TEXT,
    closedAt TEXT,
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    createdBy TEXT
  );

  -- Candidates
  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    mobile TEXT,
    location TEXT,
    appliedPosition TEXT,
    department TEXT,
    employmentType TEXT,
    status TEXT DEFAULT 'New Candidate',
    currentRound TEXT,
    source TEXT,
    linkedIn TEXT,
    portfolio TEXT,
    experience TEXT,
    skills TEXT,
    expertise TEXT,
    education TEXT,
    noticePeriod TEXT,
    currentCTC TEXT,
    expectedCTC TEXT,
    negotiable INTEGER DEFAULT 0,
    immediateJoining INTEGER DEFAULT 0,
    yearsOfExperience TEXT,
    resume TEXT,
    telephonicId TEXT,
    joiningDetails TEXT DEFAULT '{}',
    itSetup TEXT DEFAULT '{}',
    accessSetupComplete INTEGER DEFAULT 0,
    archivedAt TEXT,
    timeline TEXT DEFAULT '[]',
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    createdBy TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  -- Candidate Documents (resume + other uploads)
  CREATE TABLE IF NOT EXISTS candidate_documents (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    name TEXT,
    type TEXT,
    filePath TEXT,
    fileSize INTEGER,
    mimeType TEXT,
    uploadedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
  );

  -- Candidate Notes
  CREATE TABLE IF NOT EXISTS candidate_notes (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    note TEXT NOT NULL,
    addedBy TEXT,
    addedByName TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
  );

  -- Interviews
  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    date TEXT,
    time TEXT,
    duration TEXT DEFAULT '60',
    mode TEXT DEFAULT 'Online',
    round TEXT DEFAULT 'HR Round',
    interviewerIds TEXT DEFAULT '[]',
    status TEXT DEFAULT 'scheduled',
    feedback TEXT,
    meetingLink TEXT,
    location TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
  );

  -- Telephonic Interviews (corrected schema matching frontend)
  CREATE TABLE IF NOT EXISTS telephony_interviews (
    id TEXT PRIMARY KEY,
    candidateName TEXT,
    contactNumber TEXT,
    position TEXT,
    department TEXT,
    callDate TEXT,
    callTime TEXT,
    calledBy TEXT,
    duration TEXT,
    outcome TEXT DEFAULT 'Positive',
    currentCTC TEXT,
    expectedCTC TEXT,
    noticePeriod TEXT,
    immediateJoiner INTEGER DEFAULT 0,
    notes TEXT,
    candidateId TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  -- Approvals
  CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    type TEXT,
    candidateId TEXT,
    requestedBy TEXT,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    reviewedBy TEXT,
    reviewedAt TEXT,
    data TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  -- Unified Notifications (in-app)
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toUserId TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    channel TEXT DEFAULT 'in-app',
    relatedId TEXT,
    relatedType TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  -- Activity Logs
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    userId TEXT,
    details TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  -- Custom Roles
  CREATE TABLE IF NOT EXISTS custom_roles (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    isSystem INTEGER DEFAULT 0,
    permissions TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  -- Application Settings (key-value)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedBy TEXT
  );

`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfEmpty(table, insertFn) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
  if (row.count === 0) insertFn();
}

// Users
seedIfEmpty('users', () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO users
    (id, username, password, role, status, firstName, lastName, email, mobile, department, designation)
    VALUES (@id, @username, @password, @role, @status, @firstName, @lastName, @email, @mobile, @department, @designation)
  `);
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany([
    { id: 'USR001', username: 'headhr',      password: 'password123', role: 'head_hr',      status: 'active', firstName: 'Sarah',  lastName: 'Johnson', email: 'sarah.johnson@company.com', mobile: '+1-555-0101', department: 'Human Resources', designation: 'Head HR' },
    { id: 'USR002', username: 'hrdemo',      password: 'password123', role: 'hr',           status: 'active', firstName: 'Maya',   lastName: 'Patel',   email: 'maya.patel@company.com',   mobile: '+1-555-0201', department: 'Human Resources', designation: 'Recruiter' },
    { id: 'USR003', username: 'interviewer', password: 'password123', role: 'interviewer',  status: 'active', firstName: 'Arjun',  lastName: 'Mehta',   email: 'arjun.mehta@company.com',  mobile: '+1-555-0301', department: 'Engineering',     designation: 'Engineering Manager' },
    { id: 'USR004', username: 'reception',   password: 'password123', role: 'receptionist', status: 'active', firstName: 'Nina',   lastName: 'Roy',     email: 'nina.roy@company.com',     mobile: '+1-555-0401', department: 'Administration',  designation: 'Receptionist' },
    { id: 'USR005', username: 'itdemo',      password: 'password123', role: 'it',           status: 'active', firstName: 'Leo',    lastName: 'Chen',    email: 'leo.chen@company.com',     mobile: '+1-555-0501', department: 'IT',              designation: 'Systems Administrator' },
  ]);
});

// Departments
seedIfEmpty('departments', () => {
  const insert = db.prepare(`INSERT OR IGNORE INTO departments (id, name) VALUES (?, ?)`);
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['DEPT001', 'Engineering'],
    ['DEPT002', 'Human Resources'],
    ['DEPT003', 'Product'],
    ['DEPT004', 'Design'],
    ['DEPT005', 'Marketing'],
    ['DEPT006', 'Sales'],
    ['DEPT007', 'Finance'],
    ['DEPT008', 'Operations'],
    ['DEPT009', 'Administration'],
    ['DEPT010', 'IT'],
  ]);
});

// Job Openings
seedIfEmpty('job_openings', () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO job_openings (id, positionName, department, openings, filled, status, updatedAt, updatedBy, createdAt, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['JOB001', 'Frontend Developer',  'Engineering',     3, 1, 'open', now, 'Sarah Johnson', now, 'USR001'],
    ['JOB002', 'HR Executive',        'Human Resources', 2, 0, 'open', now, 'Sarah Johnson', now, 'USR001'],
    ['JOB003', 'Product Designer',    'Design',          1, 0, 'open', now, 'Sarah Johnson', now, 'USR001'],
  ]);
});

// Candidates
seedIfEmpty('candidates', () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO candidates
    (id, firstName, lastName, email, mobile, location, appliedPosition, department, employmentType, status, currentRound, timeline, createdAt, createdBy)
    VALUES (@id, @firstName, @lastName, @email, @mobile, @location, @appliedPosition, @department, @employmentType, @status, @currentRound, @timeline, @createdAt, @createdBy)
  `);
  const now = new Date().toISOString();
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany([
    { id: 'CAND001', firstName: 'Alice',  lastName: 'Johnson',  email: 'alice.johnson@email.com',  mobile: '+1-555-1001', location: 'New York',      appliedPosition: 'Senior Frontend Developer', department: 'Engineering',     employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND002', firstName: 'Bob',    lastName: 'Smith',    email: 'bob.smith@email.com',       mobile: '+1-555-1002', location: 'San Francisco', appliedPosition: 'Product Manager',           department: 'Product',         employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND003', firstName: 'Carol',  lastName: 'Williams', email: 'carol.williams@email.com',  mobile: '+1-555-1003', location: 'Boston',        appliedPosition: 'Marketing Manager',         department: 'Marketing',       employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND004', firstName: 'David',  lastName: 'Brown',    email: 'david.brown@email.com',     mobile: '+1-555-1004', location: 'Chicago',       appliedPosition: 'Sales Executive',           department: 'Sales',           employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND005', firstName: 'Emma',   lastName: 'Davis',    email: 'emma.davis@email.com',      mobile: '+1-555-1005', location: 'Seattle',       appliedPosition: 'Financial Analyst',         department: 'Finance',         employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND006', firstName: 'Frank',  lastName: 'Miller',   email: 'frank.miller@email.com',    mobile: '+1-555-1006', location: 'Austin',        appliedPosition: 'Operations Manager',        department: 'Operations',      employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND007', firstName: 'Grace',  lastName: 'Taylor',   email: 'grace.taylor@email.com',    mobile: '+1-555-1007', location: 'Miami',         appliedPosition: 'UX/UI Designer',            department: 'Design',          employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND008', firstName: 'Henry',  lastName: 'Anderson', email: 'henry.anderson@email.com',  mobile: '+1-555-1008', location: 'Denver',        appliedPosition: 'Backend Developer',         department: 'Engineering',     employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND009', firstName: 'Iris',   lastName: 'Thomas',   email: 'iris.thomas@email.com',     mobile: '+1-555-1009', location: 'Portland',      appliedPosition: 'HR Specialist',             department: 'Human Resources', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
    { id: 'CAND010', firstName: 'Jack',   lastName: 'Jackson',  email: 'jack.jackson@email.com',    mobile: '+1-555-1010', location: 'Philadelphia',  appliedPosition: 'Business Analyst',          department: 'Operations',      employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: JSON.stringify([{ action: 'Candidate Created', by: 'USR002', at: now }]), createdAt: now, createdBy: 'USR002' },
  ]);
});

// Interviews
seedIfEmpty('interviews', () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO interviews (id, candidateId, date, time, duration, mode, round, interviewerIds, status, feedback, createdAt)
    VALUES (@id, @candidateId, @date, @time, @duration, @mode, @round, @interviewerIds, @status, @feedback, @createdAt)
  `);
  const now = new Date().toISOString();
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany([
    { id: 'IV001', candidateId: 'CAND001', date: '2026-07-13', time: '09:00', duration: '60', mode: 'Online',  round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV002', candidateId: 'CAND002', date: '2026-07-13', time: '11:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV003', candidateId: 'CAND003', date: '2026-07-13', time: '14:00', duration: '60', mode: 'Online',  round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV004', candidateId: 'CAND004', date: '2026-07-13', time: '16:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV005', candidateId: 'CAND005', date: '2026-07-14', time: '09:00', duration: '60', mode: 'Online',  round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV006', candidateId: 'CAND006', date: '2026-07-14', time: '11:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV007', candidateId: 'CAND007', date: '2026-07-14', time: '14:00', duration: '60', mode: 'Online',  round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV008', candidateId: 'CAND008', date: '2026-07-15', time: '09:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV009', candidateId: 'CAND009', date: '2026-07-15', time: '11:00', duration: '60', mode: 'Online',  round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
    { id: 'IV010', candidateId: 'CAND010', date: '2026-07-16', time: '09:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: JSON.stringify(['USR003']), status: 'scheduled', feedback: null, createdAt: now },
  ]);
});

// Default Settings
seedIfEmpty('settings', () => {
  const insert = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['app_name',       'ATS'],
    ['company_name',   'Your Company'],
    ['default_timezone', 'UTC'],
    ['email_notifications_enabled', 'false'],
  ]);
});

export default db;
