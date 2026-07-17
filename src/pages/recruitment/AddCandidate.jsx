import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, addRecruitmentNotification, getInterviewConflict } from '../../utils/store';
import { Upload, X, FileText, Phone } from 'lucide-react';
import InterviewerPicker from '../../components/shared/InterviewerPicker';
import ResumeExtractorModal from '../../components/shared/ResumeExtractorModal';
import { ROLES, isRecruiter } from '../../utils/roles';

const ROUNDS = ['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'];
const DEPARTMENTS = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Product'];
const EMP_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship'];
const MODES = ['Offline', 'Online'];

function generateCandidateId() {
  const all = getStore(STORAGE_KEYS.CANDIDATES);
  const nums = all.map(c => parseInt(c.id?.replace('CAND', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `CAND${String(next).padStart(3, '0')}`;
}

export default function AddCandidate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;
  const isHR = isRecruiter(user);
  const telephonicState = location.state?.fromTelephonic ? location.state : null;

  const existing = isEdit ? getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === id) : null;

  // Match department from telephonic to the fixed list (case-insensitive)
  const matchDept = (val) => {
    if (!val) return '';
    return DEPARTMENTS.find(d => d.toLowerCase() === val.toLowerCase()) || '';
  };

  const [form, setForm] = useState(existing || {
    firstName: telephonicState?.firstName || '',
    lastName: telephonicState?.lastName || '',
    mobile: telephonicState?.mobile || '',
    email: '',
    location: '',
    appliedPosition: telephonicState?.appliedPosition || '',
    department: matchDept(telephonicState?.department) || '',
    employmentType: 'Full Time',
    resume: null, resumeName: '',
    yearsOfExperience: '', skills: '', expertise: '', role: '',
    currentCTC: telephonicState?.currentCTC || '',
    expectedCTC: telephonicState?.expectedCTC || '',
    negotiable: false,
    noticePeriod: telephonicState?.noticePeriod || '',
    immediateJoining: telephonicState?.immediateJoining || false,
  });
  const [showExtractor, setShowExtractor] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [interview] = useState(() => {
    if (isEdit) {
      const ivs = getStore(STORAGE_KEYS.INTERVIEWS).filter(i => i.candidateId === id);
      return ivs.sort((a, b) => b.date?.localeCompare(a.date))[0] || null;
    }
    return null;
  });
  const [scheduleInterview, setScheduleInterview] = useState(!isEdit);
  const [ivForm, setIvForm] = useState(interview || {
    date: '', time: '', duration: '60', mode: 'Offline',
    location: '', meetingLink: '', round: 'HR Round', interviewerIds: [],
  });
  const [errors, setErrors] = useState({});

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);

  function handleResume(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert('File size must be under 10MB.');
    setResumeFile(file);
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, resume: ev.target.result, resumeName: file.name }));
      setShowExtractor(true);
    };
    reader.readAsDataURL(file);
  }

  function handleExtractedData(extractedData, file) {
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(f => ({ ...f, ...extractedData, resume: ev.target.result, resumeName: file.name }));
      };
      reader.readAsDataURL(file);
    } else {
      setForm(f => ({ ...f, ...extractedData }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    if (!form.appliedPosition.trim()) errs.appliedPosition = 'Required';
    if (!form.department) errs.department = 'Required';
    if (scheduleInterview) {
      if (!ivForm.date) errs.ivDate = 'Required';
      if (!ivForm.time) errs.ivTime = 'Required';
      if (!ivForm.round) errs.ivRound = 'Required';
      if (ivForm.date && ivForm.time) {
        const conflict = getInterviewConflict(ivForm.date, ivForm.time);
        if (conflict) {
          const cand = getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === conflict.candidateId);
          errs.ivTime = `Time slot already booked — ${cand ? `${cand.firstName} ${cand.lastName}` : conflict.candidateId} has an interview at this time.`;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function save(andSchedule) {
    if (!validate()) return;
    const all = getStore(STORAGE_KEYS.CANDIDATES);
    const now = new Date().toISOString();

    if (isEdit) {
      setStore(STORAGE_KEYS.CANDIDATES, all.map(c => c.id === id ? { ...c, ...form } : c));
      addLog('Candidate Updated', user.id, `${form.firstName} ${form.lastName} profile updated`);
    } else {
      const newCand = {
        ...form,
        id: generateCandidateId(),
        status: andSchedule ? 'Interview Scheduled' : 'New Candidate',
        currentRound: andSchedule ? ivForm.round : null,
        telephonicId: telephonicState?.telephonicId || null,
        timeline: [{ action: 'Candidate Created', by: user.id, at: now }],
        createdAt: now,
        createdBy: user.id,
      };
      all.push(newCand);
      setStore(STORAGE_KEYS.CANDIDATES, all);
      addLog('Candidate Created', user.id, `${form.firstName} ${form.lastName} added`);

      // Mark telephonic record as promoted
      if (telephonicState?.telephonicId) {
        const tiAll = getStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS);
        setStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS, tiAll.map(r =>
          r.id === telephonicState.telephonicId ? { ...r, candidateId: newCand.id } : r
        ));
      }

      if (andSchedule && ivForm.date) {
        const allIv = getStore(STORAGE_KEYS.INTERVIEWS);
        const newIv = {
          id: `IV${Date.now()}`,
          candidateId: newCand.id,
          ...ivForm,
          status: 'scheduled',
          feedback: null,
          createdAt: now,
        };
        allIv.push(newIv);
        setStore(STORAGE_KEYS.INTERVIEWS, allIv);
        addLog('Interview Scheduled', user.id, `Interview scheduled for ${form.firstName} ${form.lastName}`);

        // Notify interviewers
        ivForm.interviewerIds.forEach(iid => {
          addRecruitmentNotification(iid, `You have been assigned an interview for ${form.firstName} ${form.lastName} (${ivForm.round}) on ${ivForm.date} at ${ivForm.time}.`, 'interview_assigned', newIv.id);
        });

        // Update candidate timeline
        setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c =>
          c.id === newCand.id ? { ...c, timeline: [...(c.timeline || []), { action: `${ivForm.round} Scheduled`, by: user.id, at: now }] } : c
        ));
      }
    }

    navigate('/candidates');
  }

  const err = f => errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const setIv = (f, v) => setIvForm(p => ({ ...p, [f]: v }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate('/candidates')}>← Back</button>
        <h1 className="page-title">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h1>
      </div>

      {/* Telephonic source banner */}
      {telephonicState && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl text-sm">
          <Phone size={15} className="text-violet-500 flex-shrink-0" />
          <p className="text-violet-800 font-medium flex-1">
            Pre-filled from telephonic interview — <span className="font-semibold">{telephonicState.firstName} {telephonicState.lastName}</span>. Complete the remaining fields to add as a candidate.
          </p>
          <button className="text-violet-400 hover:text-violet-600" onClick={() => navigate(-1)}>← Back</button>
        </div>
      )}

      {/* Personal Info */}
      <div className="card space-y-4">
        <p className="form-section-title">Personal Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} />{err('firstName')}</div>
          <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} />{err('lastName')}</div>
          <div><label className="label">Mobile Number</label><input className="input" value={form.mobile} onChange={e => set('mobile', e.target.value)} /></div>
          <div><label className="label">Email Address *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />{err('email')}</div>
          <div className="col-span-2"><label className="label">Current Location</label><input className="input" value={form.location} onChange={e => set('location', e.target.value)} /></div>
        </div>
      </div>

      {/* Job Info */}
      <div className="card space-y-4">
        <p className="form-section-title">Job Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Applied Position *</label><input className="input" value={form.appliedPosition} onChange={e => set('appliedPosition', e.target.value)} />{err('appliedPosition')}</div>
          <div>
            <label className="label">Department *</label>
            <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {err('department')}
          </div>
          <div>
            <label className="label">Employment Type</label>
            <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
              {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CTC & Availability — shown when coming from telephonic or when values exist */}
      {(telephonicState || form.currentCTC || form.expectedCTC || form.noticePeriod) && (
        <div className="card space-y-4">
          <p className="form-section-title">CTC &amp; Availability</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Current CTC</label>
              <input className="input" value={form.currentCTC} onChange={e => set('currentCTC', e.target.value)} placeholder="e.g. 8 LPA" />
            </div>
            <div>
              <label className="label">Expected CTC</label>
              <input className="input" value={form.expectedCTC} onChange={e => set('expectedCTC', e.target.value)} placeholder="e.g. 12 LPA" />
            </div>
            <div>
              <label className="label">Notice Period</label>
              <input className="input" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)} placeholder="e.g. 30 days" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="immediateJoining" checked={form.immediateJoining} onChange={e => set('immediateJoining', e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              <label htmlFor="immediateJoining" className="label mb-0 cursor-pointer">Immediate Joiner</label>
            </div>
          </div>
        </div>
      )}

      {/* Resume */}
      <div className="card space-y-4">
        <p className="form-section-title">Resume</p>
        {form.resumeName ? (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Upload size={15} className="text-blue-500" />
            <span className="text-sm text-blue-700 flex-1">{form.resumeName}</span>
            <button onClick={() => setForm(f => ({ ...f, resume: null, resumeName: '' }))} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors">
            <Upload size={22} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Click to upload resume</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 10MB</p>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResume} />
          </label>
        )}

        {/* Telephonic Interview Info for HR */}
        {isHR && (
          <button
            type="button"
            onClick={() => setShowExtractor(true)}
            className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <FileText size={16} />
            Telephonic Interview Info
          </button>
        )}
      </div>

      {/* Interview Info */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <p className="form-section-title mb-0">Interview Information</p>
          {!isEdit && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={scheduleInterview} onChange={e => setScheduleInterview(e.target.checked)} className="rounded" />
              Schedule Interview
            </label>
          )}
        </div>

        {scheduleInterview && (
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Interview Date *</label><input type="date" className="input" value={ivForm.date} onChange={e => setIv('date', e.target.value)} />{err('ivDate')}</div>
            <div><label className="label">Interview Time *</label><input type="time" className="input" value={ivForm.time} onChange={e => setIv('time', e.target.value)} />{err('ivTime')}</div>
            <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={ivForm.duration} onChange={e => setIv('duration', e.target.value)} min={15} /></div>
            <div>
              <label className="label">Interview Mode</label>
              <select className="input" value={ivForm.mode} onChange={e => setIv('mode', e.target.value)}>
                {MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            {ivForm.mode === 'Offline' && (
              <div className="col-span-2"><label className="label">Interview Location</label><input className="input" value={ivForm.location} onChange={e => setIv('location', e.target.value)} /></div>
            )}
            {ivForm.mode === 'Online' && (
              <div className="col-span-2"><label className="label">Meeting Link</label><input className="input" value={ivForm.meetingLink} onChange={e => setIv('meetingLink', e.target.value)} /></div>
            )}
            <div>
              <label className="label">Interview Round *</label>
              <select className="input" value={ivForm.round} onChange={e => setIv('round', e.target.value)}>
                {ROUNDS.map(r => <option key={r}>{r}</option>)}
              </select>
              {err('ivRound')}
            </div>
            <InterviewerPicker
              employees={employees}
              selectedIds={ivForm.interviewerIds}
              onChange={ids => setIv('interviewerIds', ids)}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-6">
        <button className="btn-secondary btn" onClick={() => navigate('/candidates')}>Cancel</button>
        {!isEdit && (
          <button className="btn-secondary btn" onClick={() => save(false)}>Save Candidate</button>
        )}
        <button className="btn-primary btn" onClick={() => save(true)}>
          {isEdit ? 'Save Changes' : 'Save & Schedule Interview'}
        </button>
      </div>

      {/* Resume Extractor Modal */}
      <ResumeExtractorModal
        isOpen={showExtractor}
        onClose={() => setShowExtractor(false)}
        onSave={handleExtractedData}
        resumeFile={resumeFile}
        existingData={{
          yearsOfExperience: form.yearsOfExperience,
          skills: form.skills,
          expertise: form.expertise,
          role: form.role,
          currentCTC: form.currentCTC,
          expectedCTC: form.expectedCTC,
          negotiable: form.negotiable,
          noticePeriod: form.noticePeriod,
          immediateJoining: form.immediateJoining,
        }}
      />
    </div>
  );
}
