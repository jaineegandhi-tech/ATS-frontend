export const ROLES = {
  HEAD_HR: 'head_hr',
  HR: 'hr',
  INTERVIEWER: 'interviewer',
  RECEPTIONIST: 'receptionist',
  IT: 'it',
};

export const ROLE_LABELS = {
  [ROLES.HEAD_HR]: 'Head HR',
  [ROLES.HR]: 'HR',
  [ROLES.INTERVIEWER]: 'Interviewer',
  [ROLES.RECEPTIONIST]: 'Receptionist',
  [ROLES.IT]: 'IT',
};

export const ALL_MODULES = [
  { key: 'dashboard',          label: 'Dashboard' },
  { key: 'jobOpenings',        label: 'Job Openings' },
  { key: 'candidates',         label: 'Candidates' },
  { key: 'interviewCalendar',  label: 'Interview Calendar' },
  { key: 'interviewSchedule',  label: 'Interview Schedule' },
  { key: 'approvals',          label: 'Interview Activity' },
  { key: 'reports',            label: 'Reports' },
  { key: 'pipeline',           label: 'Pipeline' },
  { key: 'rolesPermissions',   label: 'Roles & Permissions' },
  { key: 'resumeInfo',         label: 'Resume Info' },
  { key: 'telephonyInterview', label: 'Telephonic Interviews' },
];

export const PERMISSION_KEYS = ['view', 'add', 'edit', 'delete'];

function getCustomRoles() {
  try { return JSON.parse(localStorage.getItem('hrms_custom_roles')) || []; } catch { return []; }
}

// Returns true if the role has at least "view" access to the module
export function canAccess(role, module, userId = null) {
  if (!role) return false;

  // Check per-user override first
  if (userId) {
    try {
      const employees = JSON.parse(localStorage.getItem('hrms_employees')) || [];
      const emp = employees.find(e => e.id === userId);
      if (emp?.permissionOverrides) {
        return !!emp.permissionOverrides[module]?.view;
      }
    } catch { /* fall through */ }
  }

  const customRoles = getCustomRoles();
  const roleConfig = customRoles.find(r => r.id === role);
  if (roleConfig) {
    if (roleConfig.permissions) return !!roleConfig.permissions[module]?.view;
    if (roleConfig.modules) return roleConfig.modules.includes(module);
  }
  return false;
}

export function hasPermission(role, module, action) {
  if (!role) return false;
  const customRoles = getCustomRoles();
  const roleConfig = customRoles.find(r => r.id === role);
  if (roleConfig?.permissions) return !!roleConfig.permissions[module]?.[action];
  return false;
}

export function isHeadHR(user) {
  return user?.role === ROLES.HEAD_HR;
}

export function isRecruiter(user) {
  return user?.role === ROLES.HEAD_HR || user?.role === ROLES.HR;
}

export function fullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ');
}
