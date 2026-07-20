// Seed initial data into localStorage if not present
export const STORAGE_KEYS = {
  USERS: 'hrms_users',
  EMPLOYEES: 'hrms_employees',
  ATTENDANCE: 'hrms_attendance',
  LEAVES: 'hrms_leaves',
  LEAVE_BALANCES: 'hrms_leave_balances',
  PROFILE_VIEWS: 'hrms_profile_views',
  ACTIVITY_LOGS: 'hrms_activity_logs',
  CURRENT_USER: 'hrms_current_user',
  CANDIDATES: 'hrms_candidates',
  INTERVIEWS: 'hrms_interviews',
  RECRUITMENT_NOTIFICATIONS: 'hrms_recruitment_notifications',
  APPROVALS: 'hrms_approvals',
  SALARY_STRUCTURES: 'hrms_salary_structures',
  EMPLOYEE_SALARIES: 'hrms_employee_salaries',
  PAYROLLS: 'hrms_payrolls',
  BONUSES: 'hrms_bonuses',
  DEDUCTIONS: 'hrms_deductions',
  HOLIDAYS: 'hrms_holidays',
  HOLIDAY_NOTIFICATIONS: 'hrms_holiday_notifications',
  DOCUMENTS: 'hrms_documents',
  JOB_OPENINGS: 'hrms_job_openings',
  ASSETS: 'hrms_assets',
  TELEPHONY_INTERVIEWS: 'hrms_telephony_interviews',
};

const DEMO_EMPLOYEES = [
  {
    id: 'EMP001',
    username: 'headhr',
    password: 'password123',
    role: 'head_hr',
    status: 'active',
    firstName: 'Sarah',
    lastName: 'Johnson',
    middleName: '',
    email: 'sarah.johnson@company.com',
    department: 'Human Resources',
    designation: 'Head HR',
    joiningDate: '2020-01-15',
    employmentType: 'Full Time',
    gender: 'Female',
    dob: '1990-05-20',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    nationality: 'American',
    mobile: '+1-555-0101',
    alternateMobile: '',
    personalEmail: 'sarah.j@gmail.com',
    currentAddress: '123 Main St',
    permanentAddress: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001',
    reportingManager: '',
    emergencyContact: { name: 'Mike Johnson', relationship: 'Spouse', mobile: '+1-555-0102', address: '123 Main St' },
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP002',
    username: 'hrdemo',
    password: 'password123',
    role: 'hr',
    status: 'active',
    firstName: 'Maya',
    lastName: 'Patel',
    middleName: '',
    email: 'maya.patel@company.com',
    department: 'Human Resources',
    designation: 'Recruiter',
    joiningDate: '2022-03-01',
    employmentType: 'Full Time',
    gender: 'Male',
    dob: '1995-08-15',
    bloodGroup: 'A+',
    maritalStatus: 'Single',
    nationality: 'American',
    mobile: '+1-555-0201',
    alternateMobile: '',
    personalEmail: 'john.s@gmail.com',
    currentAddress: '456 Oak Ave',
    permanentAddress: '456 Oak Ave',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10002',
    reportingManager: 'EMP001',
    emergencyContact: { name: 'Jane Smith', relationship: 'Mother', mobile: '+1-555-0202', address: '789 Pine Rd' },
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP003',
    username: 'interviewer',
    password: 'password123',
    role: 'interviewer',
    status: 'active',
    firstName: 'Arjun',
    lastName: 'Mehta',
    email: 'arjun.mehta@company.com',
    department: 'Engineering',
    designation: 'Engineering Manager',
    joiningDate: '2021-08-10',
    employmentType: 'Full Time',
    mobile: '+1-555-0301',
    reportingManager: 'EMP001',
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP004',
    username: 'reception',
    password: 'password123',
    role: 'receptionist',
    status: 'active',
    firstName: 'Nina',
    lastName: 'Roy',
    email: 'nina.roy@company.com',
    department: 'Administration',
    designation: 'Receptionist',
    joiningDate: '2022-11-01',
    employmentType: 'Full Time',
    mobile: '+1-555-0401',
    reportingManager: 'EMP001',
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP006',
    username: 'hr2demo',
    password: 'password123',
    role: 'hr',
    status: 'active',
    firstName: 'Priya',
    lastName: 'Sharma',
    middleName: '',
    email: 'priya.sharma@company.com',
    department: 'Human Resources',
    designation: 'HR Executive',
    joiningDate: '2023-01-10',
    employmentType: 'Full Time',
    gender: 'Female',
    dob: '1997-03-12',
    bloodGroup: 'B+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    mobile: '+1-555-0601',
    alternateMobile: '',
    personalEmail: 'priya.s@gmail.com',
    currentAddress: '22 Elm Street',
    permanentAddress: '22 Elm Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10003',
    reportingManager: 'EMP001',
    emergencyContact: { name: 'Raj Sharma', relationship: 'Father', mobile: '+1-555-0602', address: '22 Elm Street' },
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP007',
    username: 'hr3demo',
    password: 'password123',
    role: 'hr',
    status: 'active',
    firstName: 'Rahul',
    lastName: 'Verma',
    middleName: '',
    email: 'rahul.verma@company.com',
    department: 'Human Resources',
    designation: 'Talent Acquisition Specialist',
    joiningDate: '2023-06-15',
    employmentType: 'Full Time',
    gender: 'Male',
    dob: '1996-11-25',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    nationality: 'Indian',
    mobile: '+1-555-0701',
    alternateMobile: '',
    personalEmail: 'rahul.v@gmail.com',
    currentAddress: '88 Maple Ave',
    permanentAddress: '88 Maple Ave',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10004',
    reportingManager: 'EMP001',
    emergencyContact: { name: 'Sunita Verma', relationship: 'Mother', mobile: '+1-555-0702', address: '88 Maple Ave' },
    profilePicture: null,
    profileCompleted: true,
  },
  {
    id: 'EMP005',
    username: 'itdemo',
    password: 'password123',
    role: 'it',
    status: 'active',
    firstName: 'Leo',
    lastName: 'Chen',
    email: 'leo.chen@company.com',
    department: 'IT',
    designation: 'Systems Administrator',
    joiningDate: '2020-09-20',
    employmentType: 'Full Time',
    mobile: '+1-555-0501',
    reportingManager: 'EMP001',
    profilePicture: null,
    profileCompleted: true,
  },
];

const DEMO_LEAVE_BALANCES = {
  EMP001: { Annual: 15, Sick: 10, Casual: 7 },
  EMP002: { Annual: 15, Sick: 10, Casual: 7 },
};

const DEMO_CANDIDATES = [
  { id: 'CAND001', firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@email.com', mobile: '+1-555-1001', location: 'New York', appliedPosition: 'Senior Frontend Developer', department: 'Engineering', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND002', firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@email.com', mobile: '+1-555-1002', location: 'San Francisco', appliedPosition: 'Product Manager', department: 'Product', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND003', firstName: 'Carol', lastName: 'Williams', email: 'carol.williams@email.com', mobile: '+1-555-1003', location: 'Boston', appliedPosition: 'Marketing Manager', department: 'Marketing', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND004', firstName: 'David', lastName: 'Brown', email: 'david.brown@email.com', mobile: '+1-555-1004', location: 'Chicago', appliedPosition: 'Sales Executive', department: 'Sales', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND005', firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@email.com', mobile: '+1-555-1005', location: 'Seattle', appliedPosition: 'Financial Analyst', department: 'Finance', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND006', firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@email.com', mobile: '+1-555-1006', location: 'Austin', appliedPosition: 'Operations Manager', department: 'Operations', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND007', firstName: 'Grace', lastName: 'Taylor', email: 'grace.taylor@email.com', mobile: '+1-555-1007', location: 'Miami', appliedPosition: 'UX/UI Designer', department: 'Design', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND008', firstName: 'Henry', lastName: 'Anderson', email: 'henry.anderson@email.com', mobile: '+1-555-1008', location: 'Denver', appliedPosition: 'Backend Developer', department: 'Engineering', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND009', firstName: 'Iris', lastName: 'Thomas', email: 'iris.thomas@email.com', mobile: '+1-555-1009', location: 'Portland', appliedPosition: 'HR Specialist', department: 'Human Resources', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
  { id: 'CAND010', firstName: 'Jack', lastName: 'Jackson', email: 'jack.jackson@email.com', mobile: '+1-555-1010', location: 'Philadelphia', appliedPosition: 'Business Analyst', department: 'Operations', employmentType: 'Full Time', status: 'Interview Scheduled', currentRound: 'HR Round', timeline: [{ action: 'Candidate Created', by: 'EMP002', at: new Date().toISOString() }], createdAt: new Date().toISOString(), createdBy: 'EMP002' },
];

const DEMO_INTERVIEWS = [
  { id: 'IV001', candidateId: 'CAND001', date: '2026-07-13', time: '09:00', duration: '60', mode: 'Online', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV002', candidateId: 'CAND002', date: '2026-07-13', time: '11:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV003', candidateId: 'CAND003', date: '2026-07-13', time: '14:00', duration: '60', mode: 'Online', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV004', candidateId: 'CAND004', date: '2026-07-13', time: '16:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV005', candidateId: 'CAND005', date: '2026-07-14', time: '09:00', duration: '60', mode: 'Online', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV006', candidateId: 'CAND006', date: '2026-07-14', time: '11:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV007', candidateId: 'CAND007', date: '2026-07-14', time: '14:00', duration: '60', mode: 'Online', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV008', candidateId: 'CAND008', date: '2026-07-15', time: '09:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV009', candidateId: 'CAND009', date: '2026-07-15', time: '11:00', duration: '60', mode: 'Online', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
  { id: 'IV010', candidateId: 'CAND010', date: '2026-07-16', time: '09:00', duration: '60', mode: 'Offline', round: 'HR Round', interviewerIds: ['EMP003'], status: 'scheduled', feedback: null, createdAt: new Date().toISOString() },
];

export function initStore() {
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEMO_EMPLOYEES));
  } else {
    const employees = getStore(STORAGE_KEYS.EMPLOYEES);
    const byUsername = new Set(employees.map(e => e.username));
    const missing = DEMO_EMPLOYEES.filter(e => !byUsername.has(e.username));
    if (missing.length) localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([...employees, ...missing]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES)) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(DEMO_LEAVE_BALANCES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE_VIEWS)) {
    localStorage.setItem(STORAGE_KEYS.PROFILE_VIEWS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(DEMO_CANDIDATES));
  } else {
    const candidates = getStore(STORAGE_KEYS.CANDIDATES);
    const byId = new Set(candidates.map(c => c.id));
    const missing = DEMO_CANDIDATES.filter(c => !byId.has(c.id));
    if (missing.length) localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify([...candidates, ...missing]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INTERVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(DEMO_INTERVIEWS));
  } else {
    const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
    const byId = new Set(interviews.map(i => i.id));
    const missing = DEMO_INTERVIEWS.filter(i => !byId.has(i.id));
    if (missing.length) localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify([...interviews, ...missing]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPROVALS)) {
    localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALARY_STRUCTURES)) {
    localStorage.setItem(STORAGE_KEYS.SALARY_STRUCTURES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEE_SALARIES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_SALARIES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYROLLS)) {
    localStorage.setItem(STORAGE_KEYS.PAYROLLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BONUSES)) {
    localStorage.setItem(STORAGE_KEYS.BONUSES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEDUCTIONS)) {
    localStorage.setItem(STORAGE_KEYS.DEDUCTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify([
      { id: 'HOL001', name: "New Year's Day", date: `${new Date().getFullYear()}-01-01`, type: 'National Holiday', description: 'Celebration of the new year.', repeatEveryYear: true, status: 'active' },
      { id: 'HOL002', name: 'Independence Day', date: `${new Date().getFullYear()}-07-04`, type: 'National Holiday', description: 'National Independence Day.', repeatEveryYear: true, status: 'active' },
      { id: 'HOL003', name: 'Christmas Day', date: `${new Date().getFullYear()}-12-25`, type: 'National Holiday', description: 'Christmas celebration.', repeatEveryYear: true, status: 'active' },
      { id: 'HOL004', name: 'Company Foundation Day', date: `${new Date().getFullYear()}-03-15`, type: 'Company Holiday', description: 'Anniversary of company founding.', repeatEveryYear: true, status: 'active' },
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOB_OPENINGS)) {
    localStorage.setItem(STORAGE_KEYS.JOB_OPENINGS, JSON.stringify([
      { id: 'JOB001', positionName: 'Frontend Developer', department: 'Engineering', openings: 3, filled: 1, status: 'open', updatedAt: new Date().toISOString(), updatedBy: 'Sarah Johnson' },
      { id: 'JOB002', positionName: 'HR Executive', department: 'Human Resources', openings: 2, filled: 0, status: 'open', updatedAt: new Date().toISOString(), updatedBy: 'Sarah Johnson' },
      { id: 'JOB003', positionName: 'Product Designer', department: 'Design', openings: 1, filled: 0, status: 'open', updatedAt: new Date().toISOString(), updatedBy: 'Sarah Johnson' },
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify([
      {
        id: 'AST001',
        name: 'MacBook Pro 16"',
        category: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro M3',
        serialNumber: 'MBP-2024-001',
        purchaseDate: '2024-01-15',
        purchaseCost: 2499,
        warrantyExpiry: '2027-01-15',
        condition: 'Good',
        status: 'Assigned',
        assignedEmployeeId: 'EMP002',
        assignedEmployeeName: 'John Smith',
        assignedDate: '2024-06-01',
        expectedReturnDate: '2026-06-01',
        history: [{
          id: 'HIST001',
          assignedEmployeeId: 'EMP002',
          assignedEmployeeName: 'John Smith',
          assignedById: 'EMP001',
          assignedByName: 'Sarah Johnson',
          assignedDate: '2024-06-01',
          expectedReturnDate: '2026-06-01',
          returnedDate: null,
          conditionOnReturn: null,
          notes: 'Standard issue laptop for engineering team',
        }],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-06-01T09:00:00.000Z',
        updatedById: 'EMP001',
        updatedByName: 'Sarah Johnson',
      },
      {
        id: 'AST002',
        name: 'Dell UltraSharp 27"',
        category: 'Monitor',
        brand: 'Dell',
        model: 'U2723QE',
        serialNumber: 'MON-2024-002',
        purchaseDate: '2024-02-10',
        purchaseCost: 549,
        warrantyExpiry: '2027-02-10',
        condition: 'Good',
        status: 'Assigned',
        assignedEmployeeId: 'EMP002',
        assignedEmployeeName: 'John Smith',
        assignedDate: '2024-06-01',
        expectedReturnDate: '2026-06-01',
        history: [{
          id: 'HIST002',
          assignedEmployeeId: 'EMP002',
          assignedEmployeeName: 'John Smith',
          assignedById: 'EMP001',
          assignedByName: 'Sarah Johnson',
          assignedDate: '2024-06-01',
          expectedReturnDate: '2026-06-01',
          returnedDate: null,
          conditionOnReturn: null,
          notes: 'Dual monitor setup',
        }],
        createdAt: '2024-02-10T10:00:00.000Z',
        updatedAt: '2024-06-01T09:00:00.000Z',
        updatedById: 'EMP001',
        updatedByName: 'Sarah Johnson',
      },
      {
        id: 'AST003',
        name: 'iPhone 15 Pro',
        category: 'Mobile Phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'PHN-2024-003',
        purchaseDate: '2024-03-20',
        purchaseCost: 999,
        warrantyExpiry: '2025-03-20',
        condition: 'New',
        status: 'Available',
        assignedEmployeeId: null,
        assignedEmployeeName: null,
        assignedDate: null,
        expectedReturnDate: null,
        history: [],
        createdAt: '2024-03-20T10:00:00.000Z',
        updatedAt: '2024-03-20T10:00:00.000Z',
        updatedById: 'EMP001',
        updatedByName: 'Sarah Johnson',
      },
      {
        id: 'AST004',
        name: 'Logitech MX Master 3S',
        category: 'Mouse',
        brand: 'Logitech',
        model: 'MX Master 3S',
        serialNumber: 'MSE-2024-004',
        purchaseDate: '2024-04-05',
        purchaseCost: 99,
        warrantyExpiry: '2026-04-05',
        condition: 'Good',
        status: 'Available',
        assignedEmployeeId: null,
        assignedEmployeeName: null,
        assignedDate: null,
        expectedReturnDate: null,
        history: [],
        createdAt: '2024-04-05T10:00:00.000Z',
        updatedAt: '2024-04-05T10:00:00.000Z',
        updatedById: 'EMP001',
        updatedByName: 'Sarah Johnson',
      },
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TELEPHONY_INTERVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.TELEPHONY_INTERVIEWS, JSON.stringify([]));
  }
}

export function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

export function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  // Notify same-tab listeners and cross-tab listeners.
  window.dispatchEvent(new Event('hrms-data-updated'));
  window.dispatchEvent(new StorageEvent('storage', { key }));
}

export function addLog(action, userId, details = '') {
  const logs = getStore(STORAGE_KEYS.ACTIVITY_LOGS);
  logs.unshift({ id: Date.now(), action, userId, details, timestamp: new Date().toISOString() });
  setStore(STORAGE_KEYS.ACTIVITY_LOGS, logs.slice(0, 500));
}

export function addRecruitmentNotification(toUserId, message, type = 'info', relatedId = null) {
  const notifs = getStore(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS);
  notifs.unshift({ id: Date.now(), toUserId, message, type, relatedId, read: false, timestamp: new Date().toISOString() });
  setStore(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS, notifs.slice(0, 200));
}

export function markRecruitmentNotificationRead(notificationId) {
  const notifs = getStore(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS);
  setStore(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS, notifs.map(n => n.id === notificationId ? { ...n, read: true } : n));
}

// Returns the conflicting interview if date+time is already taken, otherwise null.
// Pass excludeId to ignore a specific interview (used when rescheduling).
export function addHolidayNotification(toUserId, message, holidayId = null) {
  const notifs = getStore(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS);
  notifs.unshift({ id: Date.now(), toUserId, message, holidayId, read: false, timestamp: new Date().toISOString() });
  setStore(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, notifs.slice(0, 200));
}

export function getInterviewConflict(date, time, excludeId = null) {
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  return interviews.find(i =>
    i.date === date &&
    i.time === time &&
    i.status !== 'cancelled' &&
    i.id !== excludeId
  ) || null;
}

export function generateEmpId() {
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const nums = employees.map(e => parseInt(e.id.replace('EMP', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `EMP${String(next).padStart(3, '0')}`;
}

export function hasActiveInterview(candidateId) {
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  return interviews.some(i => i.candidateId === candidateId && i.status !== 'cancelled');
}

export function syncCandidateStatuses() {
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  
  const updated = candidates.map(c => {
    // If candidate status is "Interview Scheduled" but has no active interviews, revert to "New Candidate"
    if (c.status === 'Interview Scheduled') {
      const hasActive = interviews.some(i => i.candidateId === c.id && i.status !== 'cancelled');
      if (!hasActive) {
        return { ...c, status: 'New Candidate', currentRound: null };
      }
    }
    return c;
  });
  
  const changed = updated.some((c, i) => c.status !== candidates[i].status);
  if (changed) {
    setStore(STORAGE_KEYS.CANDIDATES, updated);
  }
}
