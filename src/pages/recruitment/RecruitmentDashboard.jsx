import { useNavigate } from 'react-router-dom';
import { getStore, STORAGE_KEYS, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { todayStr, formatDate } from '../../utils/helpers';
import { ROLE_LABELS, ROLES, fullName } from '../../utils/roles';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, Briefcase, CalendarDays, CheckCircle, Clock, Users, XCircle, UserCheck, GitBranch, MessageSquare, Video, MapPin } from 'lucide-react';

function StatCard({ icon: Icon, label, value, iconBg, iconColor, onClick }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border border-gray-100 shadow-card flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-all duration-200`} style={{ width: '262px', height: '100px', padding: '0 16px' }}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-heading leading-none">{value}</p>
        <p className="text-xs text-body mt-0.5 truncate">{label}</p>
      </div>
      {onClick && <ArrowUpRight size={13} className="text-gray-300 flex-shrink-0" />}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28 pt-2">
      {data.map(d => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-xs font-semibold text-heading">{d.value}</span>
          <div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${Math.max((d.value / max) * 80, d.value > 0 ? 6 : 2)}px`, backgroundColor: d.color }} />
          <span className="text-[10px] text-body text-center leading-tight truncate w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function RecruitmentDashboard() {
  useStorageSync();
  syncCandidateStatuses();

  const { user } = useAuth();
  const navigate = useNavigate();
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const openings = getStore(STORAGE_KEYS.JOB_OPENINGS);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const logs = getStore(STORAGE_KEYS.ACTIVITY_LOGS).slice(0, 6);
  const today = todayStr();

  const role = user?.role;
  const ownedCandidates = candidates.filter(c => c.assignedTo === user?.id || c.createdBy === user?.id);
  const scopedCandidates = role === ROLES.HR ? ownedCandidates : candidates;
  const assignedInterviews = interviews.filter(i => i.interviewerIds?.includes(user?.id));

  const todaysInterviews = (role === ROLES.INTERVIEWER ? assignedInterviews : interviews)
    .filter(i => i.date === today && i.status !== 'cancelled')
    .sort((a, b) => a.time?.localeCompare(b.time));

  const joiningStage = candidates.filter(c => ['Offered', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(c.status));
  const pendingFeedback = assignedInterviews.filter(i => i.status === 'completed' && !i.feedback);

  function candidateName(id) {
    const c = candidates.find(x => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Candidate';
  }

  function getEmpName(id) {
    const e = employees.find(x => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : id;
  }

  // Stat cards per role
  const cards = role === ROLES.INTERVIEWER ? [
    [CalendarDays, "Today's Interviews", assignedInterviews.filter(i => i.date === today).length, 'bg-primary-light', 'text-primary', '/interview-calendar'],
    [Clock, 'Upcoming', assignedInterviews.filter(i => i.date > today && i.status === 'scheduled').length, 'bg-amber-50', 'text-amber-600', '/interview-schedule'],
    [MessageSquare, 'Pending Feedback', pendingFeedback.length, 'bg-red-50', 'text-red-500', '/interview-schedule'],
  ] : role === ROLES.RECEPTIONIST ? [
    [CalendarDays, "Today's Interviews", todaysInterviews.length, 'bg-primary-light', 'text-primary', '/approvals'],
    [MessageSquare, 'Pending Approvals', interviews.filter(i => i.status === 'completed' && i.feedback).length, 'bg-amber-50', 'text-amber-600', '/approvals'],
  ] : role === ROLES.IT ? [
    [UserCheck, 'Joining Stage', joiningStage.length, 'bg-emerald-50', 'text-emerald-600', '/pipeline'],
    [Clock, 'Pending Setups', joiningStage.filter(c => !c.accessSetupComplete).length, 'bg-amber-50', 'text-amber-600', '/pipeline'],
    [CheckCircle, 'Completed Setups', joiningStage.filter(c => c.accessSetupComplete).length, 'bg-primary-light', 'text-primary', '/pipeline'],
  ] : [
    [Briefcase, 'Job Openings', openings.filter(o => ['open','active','published'].includes(o.status)).length, 'bg-violet-50', 'text-violet-600', '/job-openings'],
    [Users, role === ROLES.HR ? 'My Candidates' : 'Total Candidates', scopedCandidates.length, 'bg-primary-light', 'text-primary', '/candidates'],
    [CalendarDays, "Today's Interviews", todaysInterviews.length, 'bg-amber-50', 'text-amber-600', '/interview-calendar'],
    [GitBranch, 'In Pipeline', scopedCandidates.filter(c => !['Rejected','Joined','archived'].includes(c.status)).length, 'bg-indigo-50', 'text-indigo-600', '/pipeline'],
    [CheckCircle, 'Selected', scopedCandidates.filter(c => ['Selected','Offer Sent','Offer Accepted','Joined'].includes(c.status)).length, 'bg-emerald-50', 'text-emerald-600', '/reports'],
    [XCircle, 'Rejected', scopedCandidates.filter(c => ['Rejected','Failed'].includes(c.status)).length, 'bg-red-50', 'text-red-500', '/reports'],
  ];

  // Chart data — candidate status breakdown
  const chartData = [
    { label: 'New',        value: scopedCandidates.filter(c => c.status === 'New Candidate').length,                                          color: '#94a3b8' },
    { label: 'Scheduled',  value: scopedCandidates.filter(c => c.status === 'Interview Scheduled').length,                                    color: '#0B5ED7' },
    { label: 'Completed',  value: scopedCandidates.filter(c => c.status === 'Interview Completed').length,                                    color: '#6366f1' },
    { label: 'Passed',     value: scopedCandidates.filter(c => c.status === 'Passed').length,                                                 color: '#10b981' },
    { label: 'Selected',   value: scopedCandidates.filter(c => ['Selected','Offered','Joined'].includes(c.status)).length,                    color: '#059669' },
    { label: 'Rejected',   value: scopedCandidates.filter(c => ['Failed','Rejected','Not Joined'].includes(c.status)).length,                 color: '#ef4444' },
    { label: 'On Hold',    value: scopedCandidates.filter(c => c.status === 'On Hold').length,                                               color: '#f59e0b' },
  ].filter(d => d.value > 0 || true);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">{greeting}, {user?.firstName}</h1>
        <p className="text-xs text-body mt-0.5">{formatDate(new Date().toISOString())} · {ROLE_LABELS[role] || role}</p>
      </div>

      {/* Stat Cards */}
      <div className="flex flex-wrap gap-3">
        {cards.map(([Icon, label, value, bg, color, path]) => (
          <StatCard key={label} icon={Icon} label={label} value={value} iconBg={bg} iconColor={color} onClick={() => navigate(path)} />
        ))}
      </div>

      {/* Today's Interviews + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Interviews */}
        <div className="card lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <CalendarDays size={14} className="text-primary" /> Today's Interviews
              <span className="badge badge-blue ml-1">{todaysInterviews.length}</span>
            </h2>
            <button onClick={() => navigate('/interview-schedule')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {todaysInterviews.length === 0 ? (
            <p className="text-sm text-body py-8 text-center">No interviews scheduled for today.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {todaysInterviews.map(iv => {
                const c = candidates.find(x => x.id === iv.candidateId);
                const now = new Date();
                const [h, m] = (iv.time || '00:00').split(':').map(Number);
                const ivTime = new Date(); ivTime.setHours(h, m, 0, 0);
                const isPast = ivTime < now;
                const isDone = iv.status === 'completed';
                return (
                  <button key={iv.id} onClick={() => navigate(`/candidates/${iv.candidateId}`)}
                    className="w-full text-left px-5 py-3 hover:bg-surface transition-colors flex items-center gap-4">
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-400' : isPast ? 'bg-amber-400' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{candidateName(iv.candidateId)}</p>
                      <p className="text-xs text-body truncate">{iv.round} · {c?.appliedPosition || '—'}</p>
                      <p className="text-xs text-body mt-0.5">
                        Interviewer: {iv.interviewerIds?.map(getEmpName).join(', ') || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-heading">{iv.time}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {iv.mode === 'Online' ? <Video size={11} className="text-primary" /> : <MapPin size={11} className="text-amber-500" />}
                        <span className="text-xs text-body">{iv.mode}</span>
                      </div>
                      {isDone && <span className="text-[10px] text-emerald-600 font-semibold">Done</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Candidate Pipeline Chart */}
        {(role === ROLES.HEAD_HR || role === ROLES.HR) && (
          <div className="card">
            <h2 className="section-title">Candidate Pipeline</h2>
            <BarChart data={chartData} />
          </div>
        )}

        {/* For non-HR roles, show recent activity in the 3rd column */}
        {role !== ROLES.HEAD_HR && role !== ROLES.HR && (
          <div className="card">
            <h2 className="section-title">Recent Activity</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-body py-4 text-center">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {logs.map((log, i) => (
                  <div key={log.id} className={`py-2.5 ${i < logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <p className="text-sm font-medium text-heading">{log.action}</p>
                    <p className="text-xs text-body">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity (HR/Head HR) */}
      {(role === ROLES.HEAD_HR || role === ROLES.HR) && (
        <div className="card">
          <h2 className="section-title">Recent Activity</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-body py-4 text-center">No activity yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {logs.map((log, i) => (
                <div key={log.id} className={`flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-heading truncate">{log.action}</p>
                      <p className="text-xs text-body truncate">{log.details}</p>
                    </div>
                  </div>
                  <p className="text-xs text-body flex-shrink-0 ml-3">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
