import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, addLog, addRecruitmentNotification, getStore, setStore } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { ROLES, fullName, isRecruiter, isHeadHR } from '../../utils/roles';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { formatDate } from '../../utils/helpers';
import { Eye, Star, CalendarPlus, CheckCircle, XCircle, PauseCircle, Send, Clock, CheckCheck, Calendar } from 'lucide-react';

const TABS = ['Scheduled', 'Completed', 'Candidate Status'];

function StarRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={11} className={i < value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
        ))}
        <span className="text-xs text-gray-400 ml-1">{value}/5</span>
      </div>
    </div>
  );
}

export default function Approvals() {
  useStorageSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Scheduled');
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [, forceUpdate] = useState(0);

  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);

  function candOf(iv) { return candidates.find(c => c.id === iv.candidateId); }
  function empName(id) { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : id; }
  function names(ids = []) { return ids.map(empName).join(', ') || '—'; }

  // ── SCHEDULED tab ──────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  // Today = ALL interviews for today regardless of status (scheduled or completed)
  const todayInterviews = interviews
    .filter(iv => iv.date === today)
    .sort((a, b) => a.time?.localeCompare(b.time));

  const upcomingInterviews = interviews
    .filter(iv => iv.status === 'scheduled' && iv.date > today)
    .sort((a, b) => a.date?.localeCompare(b.date) || a.time?.localeCompare(b.time));

  // ── COMPLETED tab ───────────────────────────────────────────────
  const completed = interviews
    .filter(iv => iv.status === 'completed' && iv.feedback && !iv.feedback.isDraft)
    .sort((a, b) => (b.feedback?.submittedAt || '').localeCompare(a.feedback?.submittedAt || ''));

  // ── CANDIDATE STATUS tab ────────────────────────────────────────
  const statusCandidates = candidates
    .filter(c => c.status && c.status !== 'archived')
    .sort((a, b) => (b.timeline?.slice(-1)[0]?.at || '').localeCompare(a.timeline?.slice(-1)[0]?.at || ''));

  // ── HR actions on selected completed interview ──────────────────
  function takeAction(status) {
    const cand = candOf(selected);
    const now = new Date().toISOString();
    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c =>
      c.id === cand.id ? {
        ...c, status,
        timeline: [...(c.timeline || []), { action: `HR decision: ${status}`, by: user.id, at: now }],
      } : c
    ));
    setStore(STORAGE_KEYS.INTERVIEWS, getStore(STORAGE_KEYS.INTERVIEWS).map(iv =>
      iv.id === selected.id ? { ...iv, approvalStatus: 'Action Completed', hrAction: status, actionedAt: now, actionedBy: user.id } : iv
    ));
    // Notify all HR + interviewers
    getStore(STORAGE_KEYS.EMPLOYEES)
      .filter(e => [ROLES.HEAD_HR, ROLES.HR].includes(e.role))
      .forEach(e => addRecruitmentNotification(e.id, `${cand.firstName} ${cand.lastName} marked as "${status}" by HR.`, 'hr_action', selected.id));
    addLog('HR Action', user.id, `${cand.firstName} ${cand.lastName} → ${status}`);
    setSelected(null);
    forceUpdate(n => n + 1);
  }

  function forward() {
    const cand = candOf(selected);
    const hrId = cand?.assignedTo || cand?.createdBy || getStore(STORAGE_KEYS.EMPLOYEES).find(e => e.role === ROLES.HR)?.id;
    if (hrId) addRecruitmentNotification(hrId, `${cand?.firstName} ${cand?.lastName} interview feedback is ready for your review.`, 'approval_forwarded', selected.id);
    setStore(STORAGE_KEYS.INTERVIEWS, getStore(STORAGE_KEYS.INTERVIEWS).map(iv =>
      iv.id === selected.id ? { ...iv, approvalStatus: 'Forwarded to HR', receptionistRemarks: remarks, forwardedAt: new Date().toISOString(), forwardedBy: user.id } : iv
    ));
    addLog('Forwarded to HR', user.id, `${cand?.firstName} ${cand?.lastName}`);
    setSelected(null);
    setRemarks('');
    forceUpdate(n => n + 1);
  }

  const decisionColor = d => ({
    'Passed': 'text-green-600 bg-green-50 border-green-100',
    'Move to Next Round': 'text-blue-600 bg-blue-50 border-blue-100',
    'Failed': 'text-red-600 bg-red-50 border-red-100',
    'Hold': 'text-yellow-600 bg-yellow-50 border-yellow-100',
  }[d] || 'text-gray-600 bg-gray-50 border-gray-100');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Interview Activity</h1>
        <p className="text-xs text-gray-400 mt-1">Live view of all interview stages, feedback, and candidate status — visible to everyone.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
            {t === 'Scheduled' && todayInterviews.length > 0 && (
              <span className="ml-1.5 bg-violet-500 text-white text-xs rounded-full px-1.5 py-0.5">{todayInterviews.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SCHEDULED ── */}
      {tab === 'Scheduled' && (
        <div className="space-y-5">
          {/* Today */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-violet-500" />
              <h2 className="text-sm font-semibold text-gray-700">Today's Interviews</h2>
              <span className="text-xs text-gray-400">{today}</span>
            </div>
            {todayInterviews.length === 0 ? (
              <div className="card text-center py-6 text-gray-400 text-sm">No interviews scheduled for today.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayInterviews.map(iv => {
                  const cand = candOf(iv);
                  const isCompleted = iv.status === 'completed';
                  const fb = iv.feedback && !iv.feedback.isDraft ? iv.feedback : null;
                  return (
                    <div key={iv.id} className={`card space-y-2 border-l-4 ${isCompleted ? 'border-l-green-400' : 'border-l-violet-400'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{cand?.firstName} {cand?.lastName}</p>
                          <p className="text-xs text-gray-400">{cand?.appliedPosition} · {cand?.department}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">{iv.time}</span>
                          {isCompleted
                            ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Done</span>
                            : <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Ongoing</span>
                          }
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{iv.round}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{iv.mode}</span>
                        {iv.mode === 'Offline' && iv.location && <span className="bg-gray-100 px-2 py-0.5 rounded">📍 {iv.location}</span>}
                        {iv.mode === 'Online' && iv.meetingLink && <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">🔗 Join</a>}
                      </div>

                      <p className="text-xs text-gray-500">Interviewer(s): <strong>{names(iv.interviewerIds)}</strong></p>

                      {/* Feedback inline once completed */}
                      {fb && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600">Interviewer Feedback</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${decisionColor(fb.decision)}`}>{fb.decision}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {[['Tech', fb.technicalSkills], ['Comm', fb.communicationSkills], ['PS', fb.problemSolving]].map(([l, v]) => (
                              <div key={l} className="text-center">
                                <p className="text-[10px] text-gray-400">{l}</p>
                                <p className="text-xs font-bold text-gray-700">{v}/5</p>
                              </div>
                            ))}
                          </div>
                          {fb.remarks && <p className="text-xs text-gray-500 italic">"{fb.remarks}"</p>}
                          {iv.hrAction
                            ? <p className="text-xs text-green-600 font-semibold">HR Decision: {iv.hrAction}</p>
                            : <p className="text-xs text-amber-600">⏳ Awaiting HR decision</p>
                          }
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <StatusBadge status={cand?.status} />
                        <div className="flex gap-1">
                          {fb && <button className="btn btn-sm btn-secondary" onClick={() => { setSelected(iv); setRemarks(''); }}><Eye size={12} /> Details</button>}
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/candidates/${iv.candidateId}`)}><Eye size={12} /> Profile</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Upcoming Interviews</h2>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="card text-center py-6 text-gray-400 text-sm">No upcoming interviews.</div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Candidate', 'Position', 'Round', 'Date', 'Time', 'Mode', 'Interviewer(s)', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {upcomingInterviews.map(iv => {
                      const cand = candOf(iv);
                      return (
                        <tr key={iv.id} className="hover:bg-gray-50">
                          <td className="table-td font-medium">{cand?.firstName} {cand?.lastName}</td>
                          <td className="table-td">{cand?.appliedPosition}</td>
                          <td className="table-td">{iv.round}</td>
                          <td className="table-td">{formatDate(iv.date)}</td>
                          <td className="table-td">{iv.time}</td>
                          <td className="table-td">{iv.mode}</td>
                          <td className="table-td text-xs">{names(iv.interviewerIds)}</td>
                          <td className="table-td">
                            <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/candidates/${iv.candidateId}`)}><Eye size={12} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPLETED ── */}
      {tab === 'Completed' && (
        <div className="space-y-3">
          {completed.length === 0 ? (
            <div className="card text-center py-10 text-gray-400 text-sm">No completed interviews with feedback yet.</div>
          ) : completed.map(iv => {
            const cand = candOf(iv);
            const fb = iv.feedback;
            return (
              <div key={iv.id} className="card space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                      {cand?.firstName?.[0]}{cand?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cand?.firstName} {cand?.lastName}</p>
                      <p className="text-xs text-gray-400">{cand?.appliedPosition} · {cand?.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${decisionColor(fb.decision)}`}>{fb.decision}</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setSelected(iv); setRemarks(''); }}><Eye size={12} /> Details</button>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{iv.round}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{formatDate(iv.date)} at {iv.time}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{iv.mode}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">By: {names(iv.interviewerIds)}</span>
                </div>

                {/* Ratings strip */}
                <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg px-4 py-2">
                  {[['Technical', fb.technicalSkills], ['Communication', fb.communicationSkills], ['Problem Solving', fb.problemSolving]].map(([l, v]) => (
                    <StarRow key={l} label={l} value={v} />
                  ))}
                </div>

                {/* Remarks */}
                {fb.remarks && (
                  <p className="text-sm text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2 italic">"{fb.remarks}"</p>
                )}

                {/* Next round badge */}
                {fb.decision === 'Move to Next Round' && fb.nextRound && (
                  <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <CalendarPlus size={13} />
                    <span>Next Round: <strong>{fb.nextRound}</strong> on <strong>{formatDate(fb.nextDate)}</strong> at <strong>{fb.nextTime}</strong></span>
                  </div>
                )}

                {/* HR action badge */}
                {iv.hrAction && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCheck size={13} className="text-green-500" />
                    <span>HR Decision: <strong>{iv.hrAction}</strong> by {empName(iv.actionedBy)} on {iv.actionedAt ? new Date(iv.actionedAt).toLocaleDateString() : '—'}</span>
                  </div>
                )}

                {/* Submitted by */}
                <p className="text-xs text-gray-400">Feedback by {empName(fb.submittedBy)} · {fb.submittedAt ? new Date(fb.submittedAt).toLocaleString() : '—'}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CANDIDATE STATUS ── */}
      {tab === 'Candidate Status' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Candidate', 'Position', 'Department', 'Current Round', 'Status', 'Last Update', 'Updated By', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {statusCandidates.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No candidates found.</td></tr>
              ) : statusCandidates.map(c => {
                const lastEvent = c.timeline?.slice(-1)[0];
                const updatedBy = lastEvent ? empName(lastEvent.by) : '—';
                const updatedAt = lastEvent?.at ? new Date(lastEvent.at).toLocaleDateString() : '—';
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="table-td">{c.appliedPosition}</td>
                    <td className="table-td">{c.department || '—'}</td>
                    <td className="table-td">{c.currentRound || '—'}</td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    <td className="table-td text-xs text-gray-500">{updatedAt}</td>
                    <td className="table-td text-xs text-gray-500">{updatedBy}</td>
                    <td className="table-td">
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/candidates/${c.id}`)}><Eye size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (() => {
        const cand = candOf(selected);
        const fb = selected.feedback;
        const canForward = user.role === ROLES.RECEPTIONIST && !selected.approvalStatus;
        const canAct = isRecruiter(user) && selected.approvalStatus !== 'Action Completed';
        return (
          <Modal title="Interview Details" onClose={() => setSelected(null)} size="lg">
            <div className="space-y-4">
              {/* Candidate + Interview info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                {[
                  ['Candidate', `${cand?.firstName} ${cand?.lastName}`],
                  ['Position', cand?.appliedPosition],
                  ['Department', cand?.department],
                  ['Round', selected.round],
                  ['Date', formatDate(selected.date)],
                  ['Time', selected.time],
                  ['Mode', selected.mode],
                  ['Interviewer(s)', names(selected.interviewerIds)],
                ].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-gray-400">{k}</p><p className="font-semibold text-gray-800">{v || '—'}</p></div>
                ))}
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Feedback</p>
                <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg px-4 py-3">
                  {[['Technical Skills', fb.technicalSkills], ['Communication', fb.communicationSkills], ['Problem Solving', fb.problemSolving]].map(([l, v]) => (
                    <StarRow key={l} label={l} value={v} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Overall Rating:</span>
                  <span className="text-sm font-semibold text-gray-800">{fb.rating}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ml-auto ${decisionColor(fb.decision)}`}>{fb.decision}</span>
                </div>
                {fb.remarks && (
                  <div className="bg-white border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Remarks</p>
                    <p className="text-sm text-gray-700">{fb.remarks}</p>
                  </div>
                )}
              </div>

              {/* Next round */}
              {fb.decision === 'Move to Next Round' && fb.nextRound && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Next Round Scheduled</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-gray-400">Round</p><p className="font-semibold">{fb.nextRound}</p></div>
                    <div><p className="text-xs text-gray-400">Date</p><p className="font-semibold">{formatDate(fb.nextDate)}</p></div>
                    <div><p className="text-xs text-gray-400">Time</p><p className="font-semibold">{fb.nextTime}</p></div>
                  </div>
                  {fb.nextInterviewerIds?.length > 0 && (
                    <p className="text-xs text-gray-500">Interviewers: {names(fb.nextInterviewerIds)}</p>
                  )}
                </div>
              )}

              {/* HR action taken */}
              {selected.hrAction && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm">
                  <p className="text-xs text-gray-400 mb-1">HR Decision</p>
                  <p className="font-semibold text-green-700">{selected.hrAction}</p>
                  <p className="text-xs text-gray-400 mt-1">By {empName(selected.actionedBy)} · {selected.actionedAt ? new Date(selected.actionedAt).toLocaleString() : '—'}</p>
                </div>
              )}

              {/* Receptionist forward */}
              {canForward && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Add remarks before forwarding to HR:</p>
                  <textarea className="input resize-none" rows={2} placeholder="Optional remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                  <div className="flex justify-end">
                    <button className="btn-primary btn" onClick={forward}><Send size={14} /> Forward to HR</button>
                  </div>
                </div>
              )}

              {/* HR actions */}
              {canAct && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Take action on this candidate:</p>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/candidates/${cand.id}/schedule`)}><CalendarPlus size={13} /> Schedule Next Round</button>
                    <button className="btn btn-success btn-sm" onClick={() => takeAction('Selected')}><CheckCircle size={13} /> Select</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => takeAction('On Hold')}><PauseCircle size={13} /> Hold</button>
                    <button className="btn btn-danger btn-sm" onClick={() => takeAction('Rejected')}><XCircle size={13} /> Reject</button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
