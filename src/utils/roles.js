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

export const MODULE_ACCESS = {
  dashboard: Object.values(ROLES),
  jobOpenings: [ROLES.HEAD_HR, ROLES.HR],
  candidates: [ROLES.HEAD_HR, ROLES.HR, ROLES.INTERVIEWER, ROLES.IT],
  interviewCalendar: [ROLES.HEAD_HR, ROLES.HR, ROLES.INTERVIEWER],
  interviewSchedule: [ROLES.HEAD_HR, ROLES.HR, ROLES.INTERVIEWER],
  approvals: [ROLES.HEAD_HR, ROLES.HR, ROLES.RECEPTIONIST],
  reports: [ROLES.HEAD_HR, ROLES.HR],
  pipeline: Object.values(ROLES),
  rolesPermissions: [ROLES.HEAD_HR],
  // ResumeInfo accessible to HR roles
  resumeInfo: [ROLES.HEAD_HR, ROLES.HR],
  // Telephonic Interview log
  telephonyInterview: [ROLES.HEAD_HR, ROLES.HR],
};

export function canAccess(role, module) {
  return MODULE_ACCESS[module]?.includes(role);
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
