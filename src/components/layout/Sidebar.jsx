import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, canAccess } from '../../utils/roles';
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  PhoneCall,
  ShieldCheck,
  Stamp,
  Users,
} from 'lucide-react';

const MODULES = [
  { key: 'dashboard', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { key: 'jobOpenings', to: '/job-openings', icon: Briefcase, label: 'Job Openings' },
  { key: 'candidates', to: '/candidates', icon: Users, label: 'Candidates' },
  { key: 'interviewCalendar', to: '/interview-calendar', icon: CalendarCheck, label: 'Interview Calendar' },
  { key: 'interviewSchedule', to: '/interview-schedule', icon: ListChecks, label: 'Interview Schedule' },
  { key: 'approvals', to: '/approvals', icon: Stamp, label: 'Approvals' },
  { key: 'reports', to: '/reports', icon: BarChart3, label: 'Reports' },
  { key: 'pipeline', to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { key: 'rolesPermissions', to: '/roles-permissions', icon: ShieldCheck, label: 'Roles & Permissions' },
  { key: 'resumeInfo', to: '/resume-info', icon: FileText, label: 'Resume Info' },
  { key: 'telephonyInterview', to: '/telephony-interview', icon: PhoneCall, label: 'Telephonic Interviews' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const links = MODULES.filter(module => canAccess(user?.role, module.key));

  return (
    <aside className="w-[240px] bg-sidebar flex flex-col flex-shrink-0 min-h-screen">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-tight leading-none">ATS</p>
          <p className="text-slate-500 text-[10px] mt-0.5 leading-none">Applicant Tracking System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={15} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-slate-500 text-[11px]">{ROLE_LABELS[user?.role] || 'ATS User'}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <p className="text-slate-500 text-[11px]">v1.0 · ATS MVP</p>
        </div>
      </div>
    </aside>
  );
}
