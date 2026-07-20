import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, addRecruitmentNotification } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate } from '../../utils/helpers';
import { Star } from 'lucide-react';
import { ROLES, isRecruiter } from '../../utils/roles';

const ROUNDS = ['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'];
const DECISIONS = ['Passed', 'Failed'];
const RATINGS = ['Excellent', 'Good', 'Average', 'Poor'];

function RatingStars({ value, onChange, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`transition-colors ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}>
          <Star size={18} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="text-xs text-gray-400 ml-1">{value}/5</span>
    </div>
  );
}

export default function InterviewFeedback() {
  useStorageSync();
  const { ivId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const interview = getStore(STORAGE_KEYS.INTERVIEWS).find(i => i.id === ivId);
  const candidate = interview ? getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === interview.candidateId) : null;
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);

  const existingFeedback = interview?.feedback;

  const [form, setForm] = useState(existingFeedback || {
    rating: 'Good', technicalSkills: 3, communicationSkills: 3,
    problemSolving: 3, remarks: '', decision: 'Passed',
    nextRound: '', nextDate: '', nextTime: '', nextInterviewerIds: [],
  });
  const [saved, setSaved] = useState(false);

  if (!interview || !candidate) return <div className="card text-center py-10 text-gray-400">Interview not found.</div>;

  const isAssigned = interview.interviewerIds?.includes(user.id) || isRecruiter(user);
  if (!isAssigned) return <div className="card text-center py-10 text-gray-400">You are not assigned to this interview.</div>;

  function getEmpName(eid) { const e = employees.find(x => x.id === eid); return e ? `${e.firstName} ${e.lastName}` : eid; }

  function toggleInterviewer(eid) {
    setForm(f => ({
      ...f,
      nextInterviewerIds: f.nextInterviewerIds.includes(eid)
        ? f.nextInterviewerIds.filter(x => x !== eid)
        : [...f.nextInterviewerIds, eid],
    }));
  }

  function submit(isDraft) {
    const now = new Date().toISOString();
    const allIv = getStore(STORAGE_KEYS.INTERVIEWS);
    const feedback = { ...form, submittedBy: user.id, submittedAt: now, isDraft };

    setStore(STORAGE_KEYS.INTERVIEWS, allIv.map(i => i.id === ivId ? {
      ...i,
      feedback,
      status: isDraft ? i.status : 'completed',
      approvalStatus: isDraft ? i.approvalStatus : 'Pending Receptionist Review',
      completedAt: isDraft ? i.completedAt : now,
      completedBy: isDraft ? i.completedBy : user.id,
    } : i));

    if (!isDraft) {
      // Interviewer feedback only marks the interview as completed.
      // Passed / Failed / any final status is set exclusively by HR.
      const allC = getStore(STORAGE_KEYS.CANDIDATES);
      const timeline = [...(candidate.timeline || []), { action: `${interview.round} completed — Interviewer remark: ${form.decision}`, by: user.id, at: now }];
      setStore(STORAGE_KEYS.CANDIDATES, allC.map(c => c.id === candidate.id ? {
        ...c,
        status: 'Interview Completed',
        timeline,
      } : c));

      // Schedule next round interview if needed
      if (form.decision === 'Move to Next Round' && form.nextDate && form.nextRound) {
        const allIv2 = getStore(STORAGE_KEYS.INTERVIEWS);
        const newIv = { id: `IV${Date.now()}`, candidateId: candidate.id, date: form.nextDate, time: form.nextTime, duration: '60', mode: 'Offline', round: form.nextRound, interviewerIds: form.nextInterviewerIds, status: 'scheduled', feedback: null, createdAt: now };
        allIv2.push(newIv);
        setStore(STORAGE_KEYS.INTERVIEWS, allIv2);
        form.nextInterviewerIds.forEach(iid => {
          addRecruitmentNotification(iid, `You have been assigned an interview for ${candidate.firstName} ${candidate.lastName} (${form.nextRound}) on ${form.nextDate} at ${form.nextTime}.`, 'interview_assigned', newIv.id);
        });
      }

      // Notify HR
      const hrUsers = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => [ROLES.HEAD_HR, ROLES.HR].includes(e.role));
      hrUsers.forEach(hr => {
        addRecruitmentNotification(hr.id, `${candidate.firstName} ${candidate.lastName} — ${interview.round} completed. Interviewer remark: ${form.decision}. Awaiting your decision.`, 'feedback_submitted', ivId);
      });

      getStore(STORAGE_KEYS.EMPLOYEES)
        .filter(e => e.role === ROLES.RECEPTIONIST)
        .forEach(r => {
          addRecruitmentNotification(r.id, `${candidate.firstName} ${candidate.lastName} interview is complete. Awaiting HR decision.`, 'approval_pending', ivId);
        });

      addLog('Feedback Submitted', user.id, `Feedback for ${candidate.firstName} ${candidate.lastName} - ${form.decision}`);
    }

    setSaved(true);
    setTimeout(() => navigate(`/candidates/${candidate.id}`), 1200);
  }

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const nextRoundInterviewers = employees.filter(e => e.role === ROLES.INTERVIEWER);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate(`/candidates/${candidate.id}`)}>← Back</button>
        <h1 className="page-title">Interview Feedback</h1>
      </div>

      {saved && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Feedback saved successfully!</div>}

      {/* Interview Summary */}
      <div className="card bg-gray-50">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Candidate', `${candidate.firstName} ${candidate.lastName}`], ['Position', candidate.appliedPosition], ['Round', interview.round], ['Date', formatDate(interview.date)], ['Time', interview.time], ['Interviewer(s)', interview.interviewerIds?.map(getEmpName).join(', ') || '—']].map(([k, v]) => (
            <div key={k}><p className="text-xs text-gray-400">{k}</p><p className="font-medium text-gray-800">{v}</p></div>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="card space-y-5">
        <p className="form-section-title">Feedback</p>

        <div>
          <label className="label">Candidate Rating</label>
          <select className="input" value={form.rating} onChange={e => set('rating', e.target.value)}>
            {RATINGS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div><label className="label">Technical Skills</label><RatingStars value={form.technicalSkills} onChange={v => set('technicalSkills', v)} /></div>
        <div><label className="label">Communication Skills</label><RatingStars value={form.communicationSkills} onChange={v => set('communicationSkills', v)} /></div>
        <div><label className="label">Problem Solving</label><RatingStars value={form.problemSolving} onChange={v => set('problemSolving', v)} /></div>

        <div>
          <label className="label">Overall Remarks</label>
          <textarea className="input resize-none" rows={4} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Write your overall assessment..." />
        </div>

        <div>
          <label className="label">Interview Remark</label>
          <p className="text-xs text-gray-400 mb-2">This is your assessment remark only. Final decision on the candidate is taken by HR.</p>
          <select className="input" value={form.decision} onChange={e => set('decision', e.target.value)}>
            {DECISIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

<div className="flex justify-end gap-3 pt-2">
          <button className="btn-secondary btn" onClick={() => navigate(`/candidates/${candidate.id}`)}>Cancel</button>
          <button className="btn-secondary btn" onClick={() => submit(true)}>Save Draft</button>
          <button className="btn-primary btn" onClick={() => submit(false)}>Submit Feedback</button>
        </div>
      </div>
    </div>
  );
}
