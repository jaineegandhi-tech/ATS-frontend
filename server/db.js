import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'hrms.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    firstName TEXT,
    lastName TEXT,
    middleName TEXT DEFAULT '',
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
    alternateMobile TEXT DEFAULT '',
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

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    date TEXT NOT NULL,
    checkIn TEXT,
    checkOut TEXT,
    status TEXT,
    workHours REAL DEFAULT 0,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    leaveType TEXT,
    startDate TEXT,
    endDate TEXT,
    days INTEGER DEFAULT 1,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    approvedBy TEXT,
    approvedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leave_balances (
    employeeId TEXT NOT NULL,
    leaveType TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    PRIMARY KEY (employeeId, leaveType)
  );

  CREATE TABLE IF NOT EXISTS profile_views (
    id TEXT PRIMARY KEY,
    viewerId TEXT,
    profileId TEXT,
    viewedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    userId TEXT,
    details TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );

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
    resumeFile TEXT,
    resumeText TEXT,
    experience TEXT,
    skills TEXT,
    education TEXT,
    linkedIn TEXT,
    portfolio TEXT,
    expectedSalary TEXT,
    noticePeriod TEXT,
    source TEXT,
    notes TEXT,
    timeline TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now')),
    createdBy TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    date TEXT,
    time TEXT,
    duration TEXT,
    mode TEXT,
    round TEXT,
    interviewerIds TEXT DEFAULT '[]',
    status TEXT DEFAULT 'scheduled',
    feedback TEXT,
    meetingLink TEXT,
    location TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recruitment_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toUserId TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    relatedId TEXT,
    read INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS holiday_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    toUserId TEXT,
    message TEXT,
    holidayId TEXT,
    read INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now'))
  );

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

  CREATE TABLE IF NOT EXISTS salary_structures (
    id TEXT PRIMARY KEY,
    name TEXT,
    basic REAL DEFAULT 0,
    hra REAL DEFAULT 0,
    allowances TEXT DEFAULT '{}',
    deductions TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employee_salaries (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    structureId TEXT,
    effectiveDate TEXT,
    ctc REAL DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payrolls (
    id TEXT PRIMARY KEY,
    month TEXT,
    year TEXT,
    employeeId TEXT,
    grossPay REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    netPay REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    processedAt TEXT,
    processedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bonuses (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    type TEXT,
    amount REAL DEFAULT 0,
    month TEXT,
    year TEXT,
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS deductions (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    type TEXT,
    amount REAL DEFAULT 0,
    month TEXT,
    year TEXT,
    description TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    name TEXT,
    date TEXT,
    type TEXT,
    description TEXT,
    repeatEveryYear INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    name TEXT,
    type TEXT,
    url TEXT,
    size INTEGER,
    uploadedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_openings (
    id TEXT PRIMARY KEY,
    positionName TEXT,
    department TEXT,
    openings INTEGER DEFAULT 1,
    filled INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    description TEXT,
    requirements TEXT,
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    brand TEXT,
    model TEXT,
    serialNumber TEXT,
    purchaseDate TEXT,
    purchaseCost REAL,
    warrantyExpiry TEXT,
    condition TEXT,
    status TEXT DEFAULT 'Available',
    assignedEmployeeId TEXT,
    assignedEmployeeName TEXT,
    assignedDate TEXT,
    expectedReturnDate TEXT,
    history TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    updatedById TEXT,
    updatedByName TEXT
  );

  CREATE TABLE IF NOT EXISTS telephony_interviews (
    id TEXT PRIMARY KEY,
    candidateId TEXT,
    scheduledAt TEXT,
    duration TEXT,
    status TEXT DEFAULT 'scheduled',
    callerName TEXT,
    callerRole TEXT,
    notes TEXT,
    recordingUrl TEXT,
    transcript TEXT,
    feedback TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Seed Data ─────────────────────────────────────────────────────────────────

function seedIfEmpty(table, countQuery, insertFn) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
  if (row.count === 0) insertFn();
}

// Employees
seedIfEmpty('employees', null, () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO employees
    (id, username, password, role, status, firstName, lastName, middleName, email, department, designation,
     joiningDate, employmentType, gender, dob, bloodGroup, maritalStatus, nationality, mobile,
     alternateMobile, personalEmail, currentAddress, permanentAddress, city, state, country, postalCode,
     reportingManager, emergencyContact, profilePicture, profileCompleted)
    VALUES
    (@id, @username, @password, @role, @status, @firstName, @lastName, @middleName, @email, @department,
     @designation, @joiningDate, @employmentType, @gender, @dob, @bloodGroup, @maritalStatus, @nationality,
     @mobile, @alternateMobile, @personalEmail, @currentAddress, @permanentAddress, @city, @state, @country,
     @postalCode, @reportingManager, @emergencyContact, @profilePicture, @profileCompleted)
  `);
  const employees = [
    { id:'EMP001', username:'headhr', password:'password123', role:'head_hr', status:'active', firstName:'Sarah', lastName:'Johnson', middleName:'', email:'sarah.johnson@company.com', department:'Human Resources', designation:'Head HR', joiningDate:'2020-01-15', employmentType:'Full Time', gender:'Female', dob:'1990-05-20', bloodGroup:'O+', maritalStatus:'Married', nationality:'American', mobile:'+1-555-0101', alternateMobile:'', personalEmail:'sarah.j@gmail.com', currentAddress:'123 Main St', permanentAddress:'123 Main St', city:'New York', state:'NY', country:'USA', postalCode:'10001', reportingManager:'', emergencyContact:JSON.stringify({name:'Mike Johnson',relationship:'Spouse',mobile:'+1-555-0102',address:'123 Main St'}), profilePicture:null, profileCompleted:1 },
    { id:'EMP002', username:'hrdemo', password:'password123', role:'hr', status:'active', firstName:'Maya', lastName:'Patel', middleName:'', email:'maya.patel@company.com', department:'Human Resources', designation:'Recruiter', joiningDate:'2022-03-01', employmentType:'Full Time', gender:'Male', dob:'1995-08-15', bloodGroup:'A+', maritalStatus:'Single', nationality:'American', mobile:'+1-555-0201', alternateMobile:'', personalEmail:'john.s@gmail.com', currentAddress:'456 Oak Ave', permanentAddress:'456 Oak Ave', city:'New York', state:'NY', country:'USA', postalCode:'10002', reportingManager:'EMP001', emergencyContact:JSON.stringify({name:'Jane Smith',relationship:'Mother',mobile:'+1-555-0202',address:'789 Pine Rd'}), profilePicture:null, profileCompleted:1 },
    { id:'EMP003', username:'interviewer', password:'password123', role:'interviewer', status:'active', firstName:'Arjun', lastName:'Mehta', middleName:'', email:'arjun.mehta@company.com', department:'Engineering', designation:'Engineering Manager', joiningDate:'2021-08-10', employmentType:'Full Time', gender:'Male', dob:'1988-03-12', bloodGroup:'B+', maritalStatus:'Single', nationality:'American', mobile:'+1-555-0301', alternateMobile:'', personalEmail:'arjun.m@gmail.com', currentAddress:'789 Pine St', permanentAddress:'789 Pine St', city:'New York', state:'NY', country:'USA', postalCode:'10003', reportingManager:'EMP001', emergencyContact:JSON.stringify({name:'Priya Mehta',relationship:'Sister',mobile:'+1-555-0302',address:'789 Pine St'}), profilePicture:null, profileCompleted:1 },
    { id:'EMP004', username:'reception', password:'password123', role:'receptionist', status:'active', firstName:'Nina', lastName:'Roy', middleName:'', email:'nina.roy@company.com', department:'Administration', designation:'Receptionist', joiningDate:'2022-11-01', employmentType:'Full Time', gender:'Female', dob:'1998-07-22', bloodGroup:'AB+', maritalStatus:'Single', nationality:'American', mobile:'+1-555-0401', alternateMobile:'', personalEmail:'nina.r@gmail.com', currentAddress:'101 Elm St', permanentAddress:'101 Elm St', city:'New York', state:'NY', country:'USA', postalCode:'10004', reportingManager:'EMP001', emergencyContact:JSON.stringify({name:'Sam Roy',relationship:'Brother',mobile:'+1-555-0402',address:'101 Elm St'}), profilePicture:null, profileCompleted:1 },
    { id:'EMP005', username:'itdemo', password:'password123', role:'it', status:'active', firstName:'Leo', lastName:'Chen', middleName:'', email:'leo.chen@company.com', department:'IT', designation:'Systems Administrator', joiningDate:'2020-09-20', employmentType:'Full Time', gender:'Male', dob:'1992-11-05', bloodGroup:'O-', maritalStatus:'Married', nationality:'American', mobile:'+1-555-0501', alternateMobile:'', personalEmail:'leo.c@gmail.com', currentAddress:'202 Maple Dr', permanentAddress:'202 Maple Dr', city:'New York', state:'NY', country:'USA', postalCode:'10005', reportingManager:'EMP001', emergencyContact:JSON.stringify({name:'Lily Chen',relationship:'Spouse',mobile:'+1-555-0502',address:'202 Maple Dr'}), profilePicture:null, profileCompleted:1 },
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany(employees);
});

// Leave Balances
seedIfEmpty('leave_balances', null, () => {
  const insert = db.prepare(`INSERT OR IGNORE INTO leave_balances (employeeId, leaveType, balance) VALUES (?, ?, ?)`);
  const data = [
    ['EMP001','Annual',15],['EMP001','Sick',10],['EMP001','Casual',7],
    ['EMP002','Annual',15],['EMP002','Sick',10],['EMP002','Casual',7],
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany(data);
});

// Candidates
seedIfEmpty('candidates', null, () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO candidates (id, firstName, lastName, email, mobile, location, appliedPosition,
    department, employmentType, status, currentRound, timeline, createdAt, createdBy)
    VALUES (@id, @firstName, @lastName, @email, @mobile, @location, @appliedPosition,
    @department, @employmentType, @status, @currentRound, @timeline, @createdAt, @createdBy)
  `);
  const now = new Date().toISOString();
  const candidates = [
    {id:'CAND001',firstName:'Alice',lastName:'Johnson',email:'alice.johnson@email.com',mobile:'+1-555-1001',location:'New York',appliedPosition:'Senior Frontend Developer',department:'Engineering',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND002',firstName:'Bob',lastName:'Smith',email:'bob.smith@email.com',mobile:'+1-555-1002',location:'San Francisco',appliedPosition:'Product Manager',department:'Product',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND003',firstName:'Carol',lastName:'Williams',email:'carol.williams@email.com',mobile:'+1-555-1003',location:'Boston',appliedPosition:'Marketing Manager',department:'Marketing',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND004',firstName:'David',lastName:'Brown',email:'david.brown@email.com',mobile:'+1-555-1004',location:'Chicago',appliedPosition:'Sales Executive',department:'Sales',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND005',firstName:'Emma',lastName:'Davis',email:'emma.davis@email.com',mobile:'+1-555-1005',location:'Seattle',appliedPosition:'Financial Analyst',department:'Finance',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND006',firstName:'Frank',lastName:'Miller',email:'frank.miller@email.com',mobile:'+1-555-1006',location:'Austin',appliedPosition:'Operations Manager',department:'Operations',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND007',firstName:'Grace',lastName:'Taylor',email:'grace.taylor@email.com',mobile:'+1-555-1007',location:'Miami',appliedPosition:'UX/UI Designer',department:'Design',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND008',firstName:'Henry',lastName:'Anderson',email:'henry.anderson@email.com',mobile:'+1-555-1008',location:'Denver',appliedPosition:'Backend Developer',department:'Engineering',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND009',firstName:'Iris',lastName:'Thomas',email:'iris.thomas@email.com',mobile:'+1-555-1009',location:'Portland',appliedPosition:'HR Specialist',department:'Human Resources',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
    {id:'CAND010',firstName:'Jack',lastName:'Jackson',email:'jack.jackson@email.com',mobile:'+1-555-1010',location:'Philadelphia',appliedPosition:'Business Analyst',department:'Operations',employmentType:'Full Time',status:'Interview Scheduled',currentRound:'HR Round',timeline:JSON.stringify([{action:'Candidate Created',by:'EMP002',at:now}]),createdAt:now,createdBy:'EMP002'},
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany(candidates);
});

// Interviews
seedIfEmpty('interviews', null, () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO interviews (id, candidateId, date, time, duration, mode, round, interviewerIds, status, feedback, createdAt)
    VALUES (@id, @candidateId, @date, @time, @duration, @mode, @round, @interviewerIds, @status, @feedback, @createdAt)
  `);
  const now = new Date().toISOString();
  const interviews = [
    {id:'IV001',candidateId:'CAND001',date:'2026-07-13',time:'09:00',duration:'60',mode:'Online',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV002',candidateId:'CAND002',date:'2026-07-13',time:'11:00',duration:'60',mode:'Offline',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV003',candidateId:'CAND003',date:'2026-07-13',time:'14:00',duration:'60',mode:'Online',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV004',candidateId:'CAND004',date:'2026-07-13',time:'16:00',duration:'60',mode:'Offline',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV005',candidateId:'CAND005',date:'2026-07-14',time:'09:00',duration:'60',mode:'Online',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV006',candidateId:'CAND006',date:'2026-07-14',time:'11:00',duration:'60',mode:'Offline',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV007',candidateId:'CAND007',date:'2026-07-14',time:'14:00',duration:'60',mode:'Online',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV008',candidateId:'CAND008',date:'2026-07-15',time:'09:00',duration:'60',mode:'Offline',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV009',candidateId:'CAND009',date:'2026-07-15',time:'11:00',duration:'60',mode:'Online',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
    {id:'IV010',candidateId:'CAND010',date:'2026-07-16',time:'09:00',duration:'60',mode:'Offline',round:'HR Round',interviewerIds:JSON.stringify(['EMP003']),status:'scheduled',feedback:null,createdAt:now},
  ];
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany(interviews);
});

// Holidays
seedIfEmpty('holidays', null, () => {
  const insert = db.prepare(`INSERT OR IGNORE INTO holidays (id, name, date, type, description, repeatEveryYear, status) VALUES (?,?,?,?,?,?,?)`);
  const yr = new Date().getFullYear();
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['HOL001',"New Year's Day",`${yr}-01-01`,'National Holiday','Celebration of the new year.',1,'active'],
    ['HOL002','Independence Day',`${yr}-07-04`,'National Holiday','National Independence Day.',1,'active'],
    ['HOL003','Christmas Day',`${yr}-12-25`,'National Holiday','Christmas celebration.',1,'active'],
    ['HOL004','Company Foundation Day',`${yr}-03-15`,'Company Holiday','Anniversary of company founding.',1,'active'],
  ]);
});

// Job Openings
seedIfEmpty('job_openings', null, () => {
  const insert = db.prepare(`INSERT OR IGNORE INTO job_openings (id, positionName, department, openings, filled, status, updatedAt, updatedBy) VALUES (?,?,?,?,?,?,?,?)`);
  const now = new Date().toISOString();
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['JOB001','Frontend Developer','Engineering',3,1,'open',now,'Sarah Johnson'],
    ['JOB002','HR Executive','Human Resources',2,0,'open',now,'Sarah Johnson'],
    ['JOB003','Product Designer','Design',1,0,'open',now,'Sarah Johnson'],
  ]);
});

// Assets
seedIfEmpty('assets', null, () => {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO assets (id, name, category, brand, model, serialNumber, purchaseDate, purchaseCost,
    warrantyExpiry, condition, status, assignedEmployeeId, assignedEmployeeName, assignedDate, expectedReturnDate,
    history, createdAt, updatedAt, updatedById, updatedByName)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany([
    ['AST001','MacBook Pro 16"','Laptop','Apple','MacBook Pro M3','MBP-2024-001','2024-01-15',2499,'2027-01-15','Good','Assigned','EMP002','John Smith','2024-06-01','2026-06-01',JSON.stringify([{id:'HIST001',assignedEmployeeId:'EMP002',assignedEmployeeName:'John Smith',assignedById:'EMP001',assignedByName:'Sarah Johnson',assignedDate:'2024-06-01',expectedReturnDate:'2026-06-01',returnedDate:null,conditionOnReturn:null,notes:'Standard issue laptop for engineering team'}]),'2024-01-15T10:00:00.000Z','2024-06-01T09:00:00.000Z','EMP001','Sarah Johnson'],
    ['AST002','Dell UltraSharp 27"','Monitor','Dell','U2723QE','MON-2024-002','2024-02-10',549,'2027-02-10','Good','Assigned','EMP002','John Smith','2024-06-01','2026-06-01',JSON.stringify([{id:'HIST002',assignedEmployeeId:'EMP002',assignedEmployeeName:'John Smith',assignedById:'EMP001',assignedByName:'Sarah Johnson',assignedDate:'2024-06-01',expectedReturnDate:'2026-06-01',returnedDate:null,conditionOnReturn:null,notes:'Dual monitor setup'}]),'2024-02-10T10:00:00.000Z','2024-06-01T09:00:00.000Z','EMP001','Sarah Johnson'],
    ['AST003','iPhone 15 Pro','Mobile Phone','Apple','iPhone 15 Pro','PHN-2024-003','2024-03-20',999,'2025-03-20','New','Available',null,null,null,null,'[]','2024-03-20T10:00:00.000Z','2024-03-20T10:00:00.000Z','EMP001','Sarah Johnson'],
    ['AST004','Logitech MX Master 3S','Mouse','Logitech','MX Master 3S','MSE-2024-004','2024-04-05',99,'2026-04-05','Good','Available',null,null,null,null,'[]','2024-04-05T10:00:00.000Z','2024-04-05T10:00:00.000Z','EMP001','Sarah Johnson'],
  ]);
});

export default db;
