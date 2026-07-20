import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, addLog, addRecruitmentNotification, getStore, setStore } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { ROLES, fullName } from '../../utils/roles';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { CheckCircle, Eye, Send, PauseCircle, XCircle, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function statusFor(iv) {
  if (iv.approvalStatus) return iv.approvalStatus;
  if (iv.status === 'completed' && iv.feedback) return 'Pending Receptionist Review';
  return 'Pending Feedback';
}

export default function Approvals() {
  useStorageSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [, forceUpdate] = useState(0);

  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS)
    .filter(iv => iv.status === 'completed' && iv.feedback)
    .filter(iv => {
      if (user.role === ROLES.HR) {
        const cand = candidates.find(c => c.id === iv.candidateId);
        return statusFor(iv) === 'Forwarded to HR' && (!cand?.createdBy || cand.createdBy === user.id);
      }
      return true;
    })
    .sort((a, b) => (b.feedback?.submittedAt || b.createdAt || '').localeCompare(a.feedback?.submittedAt || a.createdAt || ''));
  const newestApprovalId = interviews[0]?.id;

  function candidateOf(iv) { return candidates.find(c => c.id === iv.candidateId); }
  function names(ids = []) {
    return ids.map(id => fullName(employees.find(e => e.id === id)) || id).join(', ');
  }

  function updateInterview(id, patch, action) {
    setStore(STORAGE_KEYS.INTERVIEWS, getStore(STORAGE_KEYS.INTERVIEWS).map(iv => iv.id === id ? { ...iv, ...patch } : iv));
    addLog(action, user.id, `${action} for ${candidateOf(selected)?.firstName || 'candidate'}`);
    setSelected(null);
    setRemarks('');
    forceUpdate(n => n + 1);
  }

  function forward() {
    const cand = candidateOf(selected);
    const hrId = cand?.createdBy || getStore(STORAGE_KEYS.EMPLOYEES).find(e => e.role === ROLES.HR)?.id;
    if (hrId) addRecruitmentNotification(hrId, `${cand?.firstName} ${cand?.lastName} feedback forwarded for HR action.`, 'approval_forwarded', selected.id);
    updateInterview(selected.id, { approvalStatus: 'Forwarded to HR', receptionistRemarks: remarks, forwardedAt: new Date().toISOString(), forwardedBy: user.id }, 'Forwarded to HR');
  }

  function takeAction(status) {
    const cand = candidateOf(selected);
    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c => c.id === cand.id ? { ...c, status, timeline: [...(c.timeline || []), { action: `HR action: ${status}`, by: user.id, at: new Date().toISOString() }] } : c));
    updateInterview(selected.id, { approvalStatus: 'Action Completed', hrAction: status, actionedAt: new Date().toISOString(), actionedBy: user.id }, 'Action Taken by HR');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Approvals</h1>
        <p className="text-xs text-gray-400 mt-1">Completed interviews move from receptionist review to HR action.</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{['Candidate', 'Job Opening', 'Round', 'Interviewer', 'Outcome', 'Submitted', 'Approval Status', 'HR Coordinator', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No approval records waiting.</td></tr>
              ) : interviews.map(iv => {
                const cand = candidateOf(iv);
                const hr = employees.find(e => e.id === cand?.createdBy);
                const isNewest = iv.id === newestApprovalId;
                return (
                  <tr key={iv.id} className={isNewest ? 'bg-violet-50' : ''}>
                    <td className="table-td font-medium">{cand?.firstName} {cand?.lastName}</td>
                    <td className="table-td">{cand?.jobOpening || cand?.appliedPosition}</td>
                    <td className="table-td">{iv.round}</td>
                    <td className="table-td">{names(iv.interviewerIds)}</td>
                    <td className="table-td">{iv.feedback?.decision}</td>
                    <td className="table-td">{iv.feedback?.submittedAt ? new Date(iv.feedback.submittedAt).toLocaleDateString() : '-'}</td>
                    <td className="table-td"><StatusBadge status={statusFor(iv)} /></td>
                    <td className="table-td">{fullName(hr) || 'HR Team'}</td>
                    <td className="table-td">
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelected(iv)}><Eye size={13} /> Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (() => {
        const cand = candidateOf(selected);
        const canForward = user.role === ROLES.RECEPTIONIST && statusFor(selected) === 'Pending Receptionist Review';
        const canAct = user.role === ROLES.HR && statusFor(selected) === 'Forwarded to HR';
        return (
          <Modal title="Approval Review" onClose={() => setSelected(null)} size="lg">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-lg p-4">
                <div><p className="text-xs text-gray-400">Candidate</p><p className="font-semibold">{cand?.firstName} {cand?.lastName}</p></div>
                <div><p className="text-xs text-gray-400">Applied Position</p><p className="font-semibold">{cand?.appliedPosition}</p></div>
                <div><p className="text-xs text-gray-400">Round</p><p className="font-semibold">{selected.round}</p></div>
                <div><p className="text-xs text-gray-400">Outcome</p><p className="font-semibold">{selected.feedback?.decision}</p></div>
              </div>
              <div>
                <p className="label">Interviewer Feedback</p>
                <p className="text-sm text-gray-700 bg-white border border-gray-100 rounded-lg p-3">{selected.feedback?.remarks || 'No remarks provided.'}</p>
              </div>
              {canForward && (
                <>
                  <textarea className="input resize-none" rows={3} placeholder="Receptionist remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  <div className="flex justify-end">
                    <button className="btn-primary btn" onClick={forward}><Send size={14} /> Forward to HR</button>
                  </div>
                </>
              )}
              {canAct && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="btn-secondary btn" onClick={() => navigate(`/candidates/${cand.id}/schedule`)}><CalendarPlus size={14} /> Schedule Next Round</button>
                  <button className="btn-success btn" onClick={() => takeAction('Selected')}><CheckCircle size={14} /> Select</button>
                  <button className="btn-secondary btn" onClick={() => takeAction('On Hold')}><PauseCircle size={14} /> Hold</button>
                  <button className="btn-danger btn" onClick={() => takeAction('Rejected')}><XCircle size={14} /> Reject</button>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
