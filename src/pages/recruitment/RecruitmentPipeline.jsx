import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import StatusBadge from '../../components/shared/StatusBadge';
import { CheckCircle, Eye } from 'lucide-react';
import { ROLES } from '../../utils/roles';

const PIPELINE_STAGES = [
  { key: 'new',         label: 'New',          statuses: ['New Candidate'] },
  { key: 'scheduled',  label: 'Scheduled',     statuses: ['Interview Scheduled', 'Next Round Scheduled'] },
  { key: 'in-progress',label: 'In Progress',   statuses: ['Interview Completed', 'On Hold', 'Screening', 'Interview In Progress'] },
  { key: 'passed',     label: 'Passed',        statuses: ['Passed'] },
  { key: 'offer',      label: 'Offer Stage',   statuses: ['Selected', 'Offered', 'Offer Sent', 'Offer Accepted', 'Offer Declined'] },
  { key: 'final',      label: 'Final',         statuses: ['Joined', 'Rejected', 'Failed', 'Not Joined'] },
];

export default function RecruitmentPipeline() {
  useStorageSync();
  // Sync candidate statuses with their actual interviews
  syncCandidateStatuses();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const allCandidates = getStore(STORAGE_KEYS.CANDIDATES).filter(c => c.status !== 'archived');
  const candidates = allCandidates.filter(c => {
    if (user?.role === ROLES.HR) return !c.assignedTo || c.assignedTo === user.id || c.createdBy === user.id;
    if (user?.role === ROLES.INTERVIEWER) return interviews.some(i => i.candidateId === c.id && i.interviewerIds?.includes(user.id));
    if (user?.role === ROLES.RECEPTIONIST) return interviews.some(i => i.candidateId === c.id);
    if (user?.role === ROLES.IT) return ['Selected', 'Offered', 'Offer Sent', 'Offer Accepted', 'Joined', 'Rejected', 'Failed', 'Not Joined'].includes(c.status);
    return true;
  });

  function markAccessComplete(candidateId) {
    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c => c.id === candidateId ? { ...c, accessSetupComplete: true } : c));
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title">Recruitment Pipeline</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const stageCandidates = candidates.filter(c => stage.statuses.map(s => s.toLowerCase()).includes(c.status?.toLowerCase()));
          return (
            <div key={stage.key} className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{stage.label}</p>
                <span className="text-xs bg-white border border-gray-200 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {stageCandidates.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-4">No candidates</p>
                ) : stageCandidates.map(c => (
                  <div key={c.id} className="bg-white border border-gray-100 rounded-lg p-3 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{c.appliedPosition}</p>
                        {c.joiningDetails?.joiningDate && <p className="text-xs text-emerald-600 mt-0.5">Joining: {c.joiningDetails.joiningDate}</p>}
                        {c.currentRound && <p className="text-xs text-primary mt-0.5">{c.currentRound}</p>}
                        {c.status === 'Interview Completed' && (() => {
                          const latestIv = interviews.filter(i => i.candidateId === c.id && i.status === 'completed' && i.feedback && !i.feedback.isDraft).sort((a,b) => (b.feedback?.submittedAt||'').localeCompare(a.feedback?.submittedAt||''))[0];
                          return latestIv ? <p className="text-xs text-amber-600 mt-0.5">Remark: {latestIv.feedback.decision} · Awaiting HR</p> : null;
                        })()}
                      </div>
                      <button className="btn btn-xs btn-secondary flex-shrink-0" onClick={() => navigate(`/candidates/${c.id}`)}><Eye size={11} /></button>
                    </div>
                    <div className="mt-2"><StatusBadge status={c.status} /></div>
                    {user?.role === ROLES.IT && !c.accessSetupComplete && (
                      <button className="btn btn-xs btn-primary mt-2" onClick={() => markAccessComplete(c.id)}><CheckCircle size={11} /> Access Setup Complete</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
