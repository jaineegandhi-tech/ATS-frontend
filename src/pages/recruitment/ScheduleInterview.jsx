import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, addRecruitmentNotification, getInterviewConflict } from '../../utils/store';
import InterviewerPicker from '../../components/shared/InterviewerPicker';

const ROUNDS = ['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'];
const MODES = ['Offline', 'Online'];

export default function ScheduleInterview() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const candidate = getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === id);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  
  // Get the latest interview if it exists
  const existingInterviews = getStore(STORAGE_KEYS.INTERVIEWS).filter(i => i.candidateId === id && i.status !== 'cancelled');
  const latestInterview = existingInterviews.sort((a, b) => b.date?.localeCompare(a.date))[0] || null;
  const isRescheduling = !!latestInterview;

  const [form, setForm] = useState(latestInterview ? {
    date: latestInterview.date,
    time: latestInterview.time,
    duration: latestInterview.duration || '60',
    mode: latestInterview.mode || 'Offline',
    location: latestInterview.location || '',
    meetingLink: latestInterview.meetingLink || '',
    round: latestInterview.round || 'HR Round',
    interviewerIds: latestInterview.interviewerIds || [],
  } : {
    date: '', time: '', duration: '60', mode: 'Offline',
    location: '', meetingLink: '', round: 'HR Round', interviewerIds: [],
  });
  const [errors, setErrors] = useState({});

  if (!candidate) return <div className="card text-center py-10 text-gray-400">Candidate not found.</div>;

  function save() {
    const errs = {};
    if (!form.date) errs.date = 'Required';
    if (!form.time) errs.time = 'Required';
    if (form.date && form.time) {
      const conflict = getInterviewConflict(form.date, form.time, latestInterview?.id);
      if (conflict) {
        const cand = getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === conflict.candidateId);
        errs.time = `Time slot already booked — ${cand ? `${cand.firstName} ${cand.lastName}` : conflict.candidateId} has an interview at this time.`;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const now = new Date().toISOString();
    
    if (isRescheduling) {
      // Update existing interview
      const allIv = getStore(STORAGE_KEYS.INTERVIEWS);
      setStore(STORAGE_KEYS.INTERVIEWS, allIv.map(i => i.id === latestInterview.id ? {
        ...i,
        ...form,
        rescheduledAt: now,
        rescheduledBy: user.id,
      } : i));

      // Update candidate timeline
      const allC = getStore(STORAGE_KEYS.CANDIDATES);
      setStore(STORAGE_KEYS.CANDIDATES, allC.map(c => c.id === id ? {
        ...c,
        currentRound: form.round,
        timeline: [...(c.timeline || []), { action: `${form.round} Rescheduled`, by: user.id, at: now }],
      } : c));

      addLog('Interview Rescheduled', user.id, `Interview rescheduled for ${candidate.firstName} ${candidate.lastName}`);
      form.interviewerIds.forEach(iid => {
        addRecruitmentNotification(iid, `Interview for ${candidate.firstName} ${candidate.lastName} (${form.round}) has been rescheduled to ${form.date} at ${form.time}.`, 'interview_rescheduled', latestInterview.id);
      });
    } else {
      // Create new interview
      const allIv = getStore(STORAGE_KEYS.INTERVIEWS);
      const newIv = { id: `IV${Date.now()}`, candidateId: id, ...form, status: 'scheduled', feedback: null, createdAt: now };
      allIv.push(newIv);
      setStore(STORAGE_KEYS.INTERVIEWS, allIv);

      // Update candidate
      const allC = getStore(STORAGE_KEYS.CANDIDATES);
      setStore(STORAGE_KEYS.CANDIDATES, allC.map(c => c.id === id ? {
        ...c,
        status: 'Interview Scheduled',
        currentRound: form.round,
        timeline: [...(c.timeline || []), { action: `${form.round} Scheduled`, by: user.id, at: now }],
      } : c));

      addLog('Interview Scheduled', user.id, `Interview scheduled for ${candidate.firstName} ${candidate.lastName}`);
      form.interviewerIds.forEach(iid => {
        addRecruitmentNotification(iid, `You have been assigned an interview for ${candidate.firstName} ${candidate.lastName} (${form.round}) on ${form.date} at ${form.time}.`, 'interview_assigned', newIv.id);
      });
    }

    navigate(`/candidates/${id}`);
  }

  const err = f => errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate(`/candidates/${id}`)}>← Back</button>
        <h1 className="page-title">{isRescheduling ? 'Reschedule Interview' : 'Schedule Interview'}</h1>
      </div>

      <div className="card">
        <p className="text-sm text-gray-600 mb-4">{isRescheduling ? 'Rescheduling interview for' : 'Scheduling interview for'} <strong>{candidate.firstName} {candidate.lastName}</strong> — {candidate.appliedPosition}</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Interview Date *</label><input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />{err('date')}</div>
          <div><label className="label">Interview Time *</label><input type="time" className="input" value={form.time} onChange={e => set('time', e.target.value)} />{err('time')}</div>
          <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.duration} onChange={e => set('duration', e.target.value)} min={15} /></div>
          <div>
            <label className="label">Interview Mode</label>
            <select className="input" value={form.mode} onChange={e => set('mode', e.target.value)}>
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {form.mode === 'Offline' && <div className="col-span-2"><label className="label">Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>}
          {form.mode === 'Online' && <div className="col-span-2"><label className="label">Meeting Link</label><input className="input" value={form.meetingLink} onChange={e => set('meetingLink', e.target.value)} /></div>}
          <div>
            <label className="label">Interview Round</label>
            <select className="input" value={form.round} onChange={e => set('round', e.target.value)}>
              {ROUNDS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <InterviewerPicker
            employees={employees}
            selectedIds={form.interviewerIds}
            onChange={ids => set('interviewerIds', ids)}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary btn" onClick={() => navigate(`/candidates/${id}`)}>Cancel</button>
          <button className="btn-primary btn" onClick={save}>{isRescheduling ? 'Reschedule Interview' : 'Schedule Interview'}</button>
        </div>
      </div>
    </div>
  );
}
