import { useNavigate } from 'react-router-dom';
import { getStore, STORAGE_KEYS, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { todayStr } from '../../utils/helpers';
import { ROLE_LABELS, ROLES, fullName } from '../../utils/roles';
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  CheckCircle,
  Clock,
  GitBranch,
  MessageSquare,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, iconBg, iconColor, onClick }) {
  return (
    <div onClick={onClick} className={`card group ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${iconBg}`}><Icon size={18} className={iconColor} /></div>
        {onClick && <ArrowUpRight size={15} className="text-gray-300 group-hover:text-primary transition-colors" />}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function RecruitmentDashboard() {
  useStorageSync();
  // Sync candidate statuses with their actual interviews
  syncCandidateStatuses();
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const openings = getStore(STORAGE_KEYS.JOB_OPENINGS);
  const logs = getStore(STORAGE_KEYS.ACTIVITY_LOGS).slice(0, 8);
  const today = todayStr();

  const ownedCandidates = candidates.filter(c => !c.createdBy || c.createdBy === user?.id);
  const assignedInterviews = interviews.filter(i => i.interviewerIds?.includes(user?.id));
  const scopedCandidates = user?.role === ROLES.HR ? ownedCandidates : candidates;
  const todaysInterviews = interviews.filter(i => i.date === today && i.status !== 'cancelled');
  const upcoming = interviews.filter(i => i.date >= today && i.status === 'scheduled').slice(0, 6);
  const pendingApprovals = interviews.filter(i => i.status === 'completed' && i.feedback && (i.approvalStatus || 'Pending Receptionist Review') !== 'Action Completed');
  const pendingFeedback = assignedInterviews.filter(i => i.status === 'completed' && !i.feedback);
  const joiningStage = candidates.filter(c => ['Offered', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(c.status));

  const role = user?.role;
  const cards = role === ROLES.INTERVIEWER ? [
    [CalendarDays, "Today's Interviews", assignedInterviews.filter(i => i.date === today).length, 'bg-blue-50', 'text-blue-600', '/interview-calendar'],
    [Clock, 'Upcoming Interviews', assignedInterviews.filter(i => i.date >= today && i.status === 'scheduled').length, 'bg-amber-50', 'text-amber-600', '/interview-schedule'],
    [MessageSquare, 'Pending Feedback', pendingFeedback.length, 'bg-orange-50', 'text-orange-600', '/interview-schedule'],
  ] : role === ROLES.RECEPTIONIST ? [
    [MessageSquare, 'Pending Approvals', pendingApprovals.filter(i => (i.approvalStatus || 'Pending Receptionist Review') === 'Pending Receptionist Review').length, 'bg-orange-50', 'text-orange-600', '/approvals'],
    [CheckCircle, 'Forwarded to HR', pendingApprovals.filter(i => i.approvalStatus === 'Forwarded to HR').length, 'bg-emerald-50', 'text-emerald-600', '/approvals'],
  ] : role === ROLES.IT ? [
    [UserCheck, 'Joining Stage', joiningStage.length, 'bg-emerald-50', 'text-emerald-600', '/pipeline'],
    [Clock, 'Pending Access Setups', joiningStage.filter(c => !c.accessSetupComplete).length, 'bg-amber-50', 'text-amber-600', '/pipeline'],
    [CheckCircle, 'Completed Setups', joiningStage.filter(c => c.accessSetupComplete).length, 'bg-blue-50', 'text-blue-600', '/pipeline'],
  ] : [
    [Briefcase, role === ROLES.HEAD_HR ? 'Total Job Openings' : 'Active Job Openings', role === ROLES.HEAD_HR ? openings.length : openings.filter(o => ['open', 'active', 'published'].includes(o.status)).length, 'bg-violet-50', 'text-violet-600', '/job-openings'],
    [Users, role === ROLES.HR ? 'My Candidates' : 'Total Candidates', scopedCandidates.length, 'bg-blue-50', 'text-blue-600', '/candidates'],
    [CalendarDays, 'Interviews Today', todaysInterviews.length, 'bg-amber-50', 'text-amber-600', '/interview-calendar'],
    [GitBranch, 'Candidates in Pipeline', scopedCandidates.filter(c => !['Rejected', 'Joined', 'Archived'].includes(c.status)).length, 'bg-indigo-50', 'text-indigo-600', '/pipeline'],
    [CheckCircle, 'Candidates Selected', scopedCandidates.filter(c => ['Selected', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(c.status)).length, 'bg-emerald-50', 'text-emerald-600', '/reports'],
    [XCircle, 'Candidates Rejected', scopedCandidates.filter(c => ['Rejected', 'Failed'].includes(c.status)).length, 'bg-red-50', 'text-red-600', '/reports'],
    [UserCheck, 'Candidates Offered', scopedCandidates.filter(c => ['Offered', 'Offer Sent', 'Offer Accepted'].includes(c.status)).length, 'bg-sky-50', 'text-sky-600', '/pipeline'],
    [CheckCircle, 'Candidates Joined', scopedCandidates.filter(c => c.status === 'Joined').length, 'bg-teal-50', 'text-teal-600', '/pipeline'],
  ];

  function candidateName(id) {
    const c = candidates.find(item => item.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Candidate';
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{ROLE_LABELS[role]} Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Role-scoped ATS overview for {fullName(user)}.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([Icon, label, value, bg, color, path]) => (
          <StatCard key={label} icon={Icon} label={label} value={value} iconBg={bg} iconColor={color} onClick={() => navigate(path)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="section-title">Upcoming Interviews</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No upcoming interviews.</p>
          ) : (
            <div className="space-y-0">
              {upcoming.map((iv, i) => (
                <button key={iv.id} onClick={() => navigate(`/candidates/${iv.candidateId}`)} className={`w-full text-left flex items-center justify-between py-3 ${i < upcoming.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{candidateName(iv.candidateId)}</p>
                    <p className="text-xs text-gray-400">{iv.round} · {iv.mode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">{iv.date}</p>
                    <p className="text-xs text-gray-400">{iv.time}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Recent Activities</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {logs.map((log, i) => (
                <div key={log.id} className={`flex items-center justify-between py-3 ${i < logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-400">{log.details}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
