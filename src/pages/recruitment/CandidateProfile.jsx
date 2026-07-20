import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, addRecruitmentNotification, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import ResumeExtractorModal from '../../components/shared/ResumeExtractorModal';
import { Download, CalendarDays, Pencil, Star, Send, CheckCircle, FileText, Copy, Phone, UserCheck } from 'lucide-react';
import { ROLES, isRecruiter, isHeadHR } from '../../utils/roles';

export default function CandidateProfile() {
  useStorageSync();
  // Sync candidate statuses with their actual interviews
  syncCandidateStatuses();
  
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHR = isRecruiter(user);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [joiningModal, setJoiningModal] = useState(false);
  const [itModal, setItModal] = useState(false);
  const [showExtractor, setShowExtractor] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [, forceUpdate] = useState(0);

  const candidate = getStore(STORAGE_KEYS.CANDIDATES).find(c => c.id === id);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS).filter(i => i.candidateId === id).sort((a, b) => a.date?.localeCompare(b.date));
  const telephonicRecord = candidate.telephonicId
    ? getStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS).find(r => r.id === candidate.telephonicId)
    : null;
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const [joiningForm, setJoiningForm] = useState(() => ({
    joiningDate: candidate?.joiningDetails?.joiningDate || candidate?.joiningDate || '',
    reportingManager: candidate?.joiningDetails?.reportingManager || '',
    workLocation: candidate?.joiningDetails?.workLocation || candidate?.location || '',
    employmentType: candidate?.joiningDetails?.employmentType || candidate?.employmentType || 'Full Time',
    designation: candidate?.joiningDetails?.designation || candidate?.appliedPosition || '',
    department: candidate?.joiningDetails?.department || candidate?.department || '',
    offerLetter: candidate?.joiningDetails?.offerLetter || '',
    onboardingNotes: candidate?.joiningDetails?.onboardingNotes || '',
  }));
  const [itSetupForm, setItSetupForm] = useState(() => ({
    employeeId: candidate?.itSetup?.employeeId || '',
    workEmail: candidate?.itSetup?.workEmail || '',
    laptopRequired: candidate?.itSetup?.laptopRequired ?? true,
    idCardRequired: candidate?.itSetup?.idCardRequired ?? true,
    systemAccessNotes: candidate?.itSetup?.systemAccessNotes || '',
  }));

  if (!candidate) return <div className="card text-center py-10 text-gray-400">Candidate not found.</div>;

  const latestInterview = interviews.length > 0 ? interviews[interviews.length - 1] : null;
  const hasScheduledInterview = !!latestInterview;

  function getEmpName(eid) {
    const e = employees.find(x => x.id === eid);
    return e ? `${e.firstName} ${e.lastName}` : eid;
  }

  function updateStatus() {
    if (!newStatus) return;
    const all = getStore(STORAGE_KEYS.CANDIDATES);
    const now = new Date().toISOString();
    setStore(STORAGE_KEYS.CANDIDATES, all.map(c => c.id === id ? {
      ...c,
      status: newStatus,
      joiningDate: newStatus === 'Offered' ? joiningDate : c.joiningDate,
      timeline: [...(c.timeline || []), { action: `Status changed to ${newStatus}`, by: user.id, at: now }],
    } : c));
    if (newStatus === 'Offered') {
      getStore(STORAGE_KEYS.EMPLOYEES)
        .filter(e => e.role === ROLES.IT)
        .forEach(it => addRecruitmentNotification(it.id, `${candidate.firstName} ${candidate.lastName} has been offered. Joining date: ${joiningDate || 'To be confirmed'}.`, 'it_handoff', id));
    }
    addLog('Candidate Status Updated', user.id, `${candidate.firstName} ${candidate.lastName} → ${newStatus}`);
    setStatusModal(false);
    forceUpdate(n => n + 1);
  }

  function saveJoiningDetails() {
    if (!joiningForm.joiningDate) return alert('Please enter the joining date.');
    const now = new Date().toISOString();
    const handoff = {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      contactNumber: candidate.mobile,
      appliedPosition: candidate.appliedPosition,
      department: joiningForm.department,
      currentLocation: candidate.location,
      joiningDate: joiningForm.joiningDate,
      reportingManager: joiningForm.reportingManager,
      workLocation: joiningForm.workLocation,
      employmentType: joiningForm.employmentType,
      designation: joiningForm.designation,
      offerLetter: joiningForm.offerLetter,
      onboardingNotes: joiningForm.onboardingNotes,
      sharedAt: now,
      sharedBy: user.id,
    };

    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c => c.id === id ? {
      ...c,
      status: 'Offered',
      joiningDate: joiningForm.joiningDate,
      joiningDetails: handoff,
      accessSetupComplete: false,
      timeline: [...(c.timeline || []), { action: `Joining details shared with IT for ${joiningForm.joiningDate}`, by: user.id, at: now }],
    } : c));

    getStore(STORAGE_KEYS.EMPLOYEES)
      .filter(e => e.role === ROLES.IT)
      .forEach(it => addRecruitmentNotification(
        it.id,
        `${candidate.firstName} ${candidate.lastName} joining handoff received. Joining date: ${joiningForm.joiningDate}.`,
        'it_handoff',
        id
      ));

    addLog('IT Onboarding Handoff', user.id, `${candidate.firstName} ${candidate.lastName} joining details shared with IT`);
    setJoiningModal(false);
    forceUpdate(n => n + 1);
  }

  function saveItSetup() {
    if (!itSetupForm.employeeId) return alert('Please enter the employee/candidate ID created for setup.');
    const now = new Date().toISOString();
    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c => c.id === id ? {
      ...c,
      accessSetupComplete: true,
      itSetup: { ...itSetupForm, completedAt: now, completedBy: user.id },
      timeline: [...(c.timeline || []), { action: `IT setup completed with ID ${itSetupForm.employeeId}`, by: user.id, at: now }],
    } : c));

    getStore(STORAGE_KEYS.EMPLOYEES)
      .filter(e => [ROLES.HEAD_HR, ROLES.HR].includes(e.role))
      .forEach(hr => addRecruitmentNotification(hr.id, `${candidate.firstName} ${candidate.lastName} IT setup completed. ID: ${itSetupForm.employeeId}.`, 'it_setup_complete', id));

    addLog('Access Setup Completed', user.id, `${candidate.firstName} ${candidate.lastName} setup completed with ID ${itSetupForm.employeeId}`);
    setItModal(false);
    forceUpdate(n => n + 1);
  }

  function exportTelephonic() {
    if (!telephonicRecord) return;
    const r = telephonicRecord;
    const rows = [
      ['Field', 'Value'],
      ['Candidate Name', r.candidateName],
      ['Contact Number', r.contactNumber],
      ['Position', r.position],
      ['Department', r.department || ''],
      ['Call Date', r.callDate || ''],
      ['Call Time', r.callTime || ''],
      ['Duration', r.duration ? `${r.duration} min` : ''],
      ['Called By', r.calledBy || ''],
      ['Outcome', r.outcome],
      ['Current CTC', r.currentCTC || ''],
      ['Expected CTC', r.expectedCTC || ''],
      ['Notice Period', r.noticePeriod || ''],
      ['Immediate Joiner', r.immediateJoiner ? 'Yes' : 'No'],
      ['Notes', r.notes || ''],
    ];
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `telephonic_${candidate.firstName}_${candidate.lastName}.csv`;
    a.click();
  }

  function downloadResume() {
    if (!candidate.resume) return alert('No resume uploaded.');
    const a = document.createElement('a');
    a.href = candidate.resume;
    a.download = `${candidate.firstName}_${candidate.lastName}_Resume`;
    a.click();
  }

  function handleExtractedData(extractedData) {
    const all = getStore(STORAGE_KEYS.CANDIDATES);
    setStore(STORAGE_KEYS.CANDIDATES, all.map(c => c.id === id ? { ...c, ...extractedData } : c));
    const now = new Date().toISOString();
    addLog('Candidate Information Extracted', user.id, `${candidate.firstName} ${candidate.lastName} - Resume information extracted`);
    setShowExtractor(false);
    forceUpdate(n => n + 1);
  }

  function copyExtractedData() {
    const tableData = `Years of Experience\t${candidate.yearsOfExperience}
Skills\t${candidate.skills}
Expertise\t${candidate.expertise}
Role\t${candidate.role}
Current CTC\t${candidate.currentCTC}
Expected CTC\t${candidate.expectedCTC}
Negotiable\t${candidate.negotiable ? 'Yes' : 'No'}
Notice Period\t${candidate.noticePeriod}
Immediate Joining\t${candidate.immediateJoining ? 'Yes' : 'No'}`;

    navigator.clipboard.writeText(tableData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const STATUSES = ['New Candidate', 'Screening', 'Interview Scheduled', 'Interview In Progress', 'Interview Completed', 'Passed', 'Failed', 'On Hold', 'Rejected', 'Next Round Scheduled', 'Selected', 'Offered', 'Joined', 'Not Joined'];
  const managerOptions = employees.filter(e => e.status !== 'inactive' && e.role !== ROLES.IT);
  const hrList = employees.filter(e => e.role === ROLES.HR && e.status !== 'inactive');

  function reassignCandidate() {
    if (!reassignTo) return;
    const now = new Date().toISOString();
    const newHR = employees.find(e => e.id === reassignTo);
    setStore(STORAGE_KEYS.CANDIDATES, getStore(STORAGE_KEYS.CANDIDATES).map(c => c.id === id ? {
      ...c,
      assignedTo: reassignTo,
      timeline: [...(c.timeline || []), { action: `Reassigned to ${newHR?.firstName} ${newHR?.lastName}`, by: user.id, at: now }],
    } : c));
    addRecruitmentNotification(
      reassignTo,
      `You have been assigned candidate ${candidate.firstName} ${candidate.lastName} (${candidate.appliedPosition}). Please continue the recruitment process.`,
      'candidate_reassigned',
      id
    );
    addLog('Candidate Reassigned', user.id, `${candidate.firstName} ${candidate.lastName} reassigned to ${newHR?.firstName} ${newHR?.lastName}`);
    setReassignModal(false);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate('/candidates')}>← Back to Candidates</button>
      </div>

      {/* Assigned-to-you banner */}
      {user?.role === ROLES.HR && candidate.assignedTo === user.id && candidate.createdBy !== user.id && (
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
          <UserCheck size={15} className="text-violet-600 flex-shrink-0" />
          <p className="text-sm text-violet-700">This candidate has been <strong>reassigned to you</strong>. You are now responsible for managing their recruitment process.</p>
        </div>
      )}

      {/* Header */}
      <div className="card flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg flex-shrink-0">
            {candidate.firstName?.[0]}{candidate.lastName?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h1>
            <p className="text-sm text-gray-500">{candidate.appliedPosition} · {candidate.department}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={candidate.status} />
              <span className="text-xs text-gray-400">{candidate.id}</span>
              {candidate.currentRound && <span className="text-xs text-gray-400">{candidate.currentRound}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {candidate.resume && (
            <button className="btn-secondary btn btn-sm" onClick={downloadResume}><Download size={13} /> Resume</button>
          )}
              {isHR && (
              <>
                <button className="btn-secondary btn btn-sm" onClick={() => navigate(`/candidates/${id}/edit`)}><Pencil size={13} /> Edit</button>
                <button className="btn-secondary btn btn-sm" onClick={() => navigate(`/candidates/${id}/schedule`)}><CalendarDays size={13} /> {hasScheduledInterview ? 'Reschedule' : 'Schedule'}</button>
                {['Selected', 'Offered'].includes(candidate.status) && (
                  <button className="btn-success btn btn-sm" onClick={() => setJoiningModal(true)}><Send size={13} /> Joining Details</button>
                )}
                <button className="btn-primary btn btn-sm" onClick={() => { setNewStatus(candidate.status); setStatusModal(true); }}>Update Status</button>
              </>
              )}
              {isHeadHR(user) && (
                <button className="btn-secondary btn btn-sm" onClick={() => { setReassignTo(candidate.assignedTo || ''); setReassignModal(true); }}><UserCheck size={13} /> Reassign HR</button>
              )}
          {user?.role === ROLES.IT && candidate.joiningDetails && (
            <button className="btn-primary btn btn-sm" onClick={() => setItModal(true)}><CheckCircle size={13} /> Complete IT Setup</button>
          )}
        </div>
      </div>

      {/* Candidate Information (HR Only) */}
      {isHR && (candidate.yearsOfExperience || candidate.skills || candidate.expertise || candidate.role || candidate.currentCTC || candidate.expectedCTC || candidate.noticePeriod || telephonicRecord) && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title mb-0">Candidate Information</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={copyExtractedData}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setShowExtractor(true)}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <FileText size={14} />
                Update
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ['Years of Experience', candidate.yearsOfExperience],
              ['Role', candidate.role],
              ['Current CTC', candidate.currentCTC],
              ['Expected CTC', candidate.expectedCTC],
              ['Notice Period', candidate.noticePeriod],
              ['CTC Negotiable', candidate.negotiable ? 'Yes' : 'No'],
              ['Can Join Immediately', candidate.immediateJoining ? 'Yes' : 'No'],
            ].map(([label, value]) => value ? (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
              </div>
            ) : null)}
          </div>
          {(candidate.skills || candidate.expertise) && (
            <div className="space-y-3">
              {candidate.skills && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.split(',').map((skill, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {candidate.expertise && (
                <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Expertise</p>
                  <p className="text-sm text-purple-700">{candidate.expertise}</p>
                </div>
              )}
            </div>
          )}
          {/* Telephonic Interview Record */}
          {telephonicRecord && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Phone size={14} className="text-violet-600" />
                  </div>
                  <h3 className="section-title mb-0">Telephonic Interview</h3>
                </div>
                <button onClick={exportTelephonic} className="btn btn-secondary btn-sm gap-1.5">
                  <Download size={13} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Call Date', 'Call Time', 'Duration', 'Called By', 'Outcome', 'Current CTC', 'Expected CTC', 'Notice Period', 'Imm. Joiner', 'Notes'].map(h => (
                        <th key={h} className="table-th whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50/60">
                      <td className="table-td">{telephonicRecord.callDate || '—'}</td>
                      <td className="table-td">{telephonicRecord.callTime || '—'}</td>
                      <td className="table-td">{telephonicRecord.duration ? `${telephonicRecord.duration} min` : '—'}</td>
                      <td className="table-td">{telephonicRecord.calledBy || '—'}</td>
                      <td className="table-td">
                        <span className={`badge ${
                          telephonicRecord.outcome === 'Positive' ? 'badge-green' :
                          telephonicRecord.outcome === 'Negative' ? 'badge-red' : 'badge-yellow'
                        }`}>{telephonicRecord.outcome}</span>
                      </td>
                      <td className="table-td">{telephonicRecord.currentCTC || '—'}</td>
                      <td className="table-td">{telephonicRecord.expectedCTC || '—'}</td>
                      <td className="table-td">{telephonicRecord.noticePeriod || '—'}</td>
                      <td className="table-td">{telephonicRecord.immediateJoiner ? 'Yes' : 'No'}</td>
                      <td className="table-td max-w-[160px] truncate text-xs text-gray-500" title={telephonicRecord.notes}>{telephonicRecord.notes || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Contact Info */}
        <div className="card space-y-3">
          <h2 className="section-title">Contact Information</h2>
          {[['Email', candidate.email], ['Mobile', candidate.mobile], ['Location', candidate.location], ['Employment Type', candidate.employmentType]].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
              <span className="text-xs text-gray-400">{k}</span>
              <span className="text-sm font-medium text-gray-800">{v || '—'}</span>
            </div>
          ))}
        </div>

        {/* Created By Info (Visible to Head HR) */}
        {isHeadHR(user) && (
          <div className="card space-y-3">
            <h2 className="section-title">Recruitment Information</h2>
            {candidate.createdBy && (() => {
              const creator = employees.find(e => e.id === candidate.createdBy);
              return (
                <>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-400">Created By</span>
                    <span className="text-sm font-medium text-gray-800">{creator ? `${creator.firstName} ${creator.lastName}` : candidate.createdBy}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-400">HR Role</span>
                    <span className="text-sm font-medium text-gray-800">{creator?.designation || 'HR'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-400">Created On</span>
                    <span className="text-sm font-medium text-gray-800">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Time</span>
                    <span className="text-sm font-medium text-gray-800">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Interview History */}
        <div className="card lg:col-span-2">
          <h2 className="section-title">Interview History</h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No interviews scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {interviews.map(iv => (
                <div key={iv.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{iv.round}</p>
                      <p className="text-xs text-gray-400">{formatDate(iv.date)} at {iv.time} · {iv.mode}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Interviewer(s): {iv.interviewerIds?.map(getEmpName).join(', ') || '—'}
                      </p>
                    </div>
                    <StatusBadge status={iv.status} />
                  </div>
                  {iv.feedback && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Feedback</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>Rating: <strong>{iv.feedback.rating}</strong></span>
                        <span>Decision: <strong>{iv.feedback.decision}</strong></span>
                      </div>
                      {iv.feedback.remarks && <p className="text-xs text-gray-500 mt-1">{iv.feedback.remarks}</p>}
                    </div>
                  )}
                  {!iv.feedback && iv.status !== 'cancelled' && (
                    <button className="btn btn-sm btn-secondary mt-3" onClick={() => navigate(`/interview-feedback/${iv.id}`)}>
                      <Star size={12} /> Add Feedback
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {candidate.joiningDetails && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Joining & IT Handoff</h2>
            <StatusBadge status={candidate.accessSetupComplete ? 'Completed' : 'Pending'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['Candidate', candidate.joiningDetails.candidateName],
              ['Joining Date', candidate.joiningDetails.joiningDate],
              ['Department', candidate.joiningDetails.department],
              ['Designation', candidate.joiningDetails.designation],
              ['Reporting Manager', candidate.joiningDetails.reportingManager],
              ['Work Location', candidate.joiningDetails.workLocation],
              ['Contact', candidate.joiningDetails.contactNumber],
              ['Email', candidate.joiningDetails.email],
              ['Employee ID', candidate.itSetup?.employeeId || 'Pending IT setup'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
              </div>
            ))}
          </div>
          {candidate.joiningDetails.onboardingNotes && (
            <p className="text-sm text-gray-600 mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">{candidate.joiningDetails.onboardingNotes}</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 className="section-title">Recruitment Timeline</h2>
        {(!candidate.timeline || candidate.timeline.length === 0) ? (
          <p className="text-sm text-gray-400">No timeline events yet.</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-100" />
            {candidate.timeline.map((t, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-primary/60 ring-2 ring-white" />
                <p className="text-sm font-medium text-gray-800">{t.action}</p>
                <p className="text-xs text-gray-400">{new Date(t.at).toLocaleString()} · {getEmpName(t.by)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reassign HR Modal */}
      {reassignModal && (
        <Modal title="Reassign Candidate to Another HR" onClose={() => setReassignModal(false)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select an HR to take over <strong>{candidate.firstName} {candidate.lastName}</strong>.</p>
            {candidate.assignedTo && (() => {
              const current = employees.find(e => e.id === candidate.assignedTo);
              return current ? <p className="text-xs text-gray-400">Currently assigned to: <strong>{current.firstName} {current.lastName}</strong></p> : null;
            })()}
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={reassignTo} onChange={e => setReassignTo(e.target.value)}>
                <option value="">Select HR</option>
                {hrList.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.designation}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setReassignModal(false)}>Cancel</button>
              <button className="btn-primary btn" disabled={!reassignTo} onClick={reassignCandidate}><UserCheck size={14} /> Reassign</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Modal */}
      {statusModal && (
        <Modal title="Update Candidate Status" onClose={() => setStatusModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">New Status</label>
              <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {newStatus === 'Offered' && (
              <div>
                <label className="label">Joining Date</label>
                <input type="date" className="input" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setStatusModal(false)}>Cancel</button>
              <button className="btn-primary btn" onClick={updateStatus}>Update</button>
            </div>
          </div>
        </Modal>
      )}

      {joiningModal && (
        <Modal title="Joining Details for IT Handoff" onClose={() => setJoiningModal(false)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              {[
                ['Full Name', `${candidate.firstName} ${candidate.lastName}`],
                ['Email', candidate.email],
                ['Contact Number', candidate.mobile],
                ['Applied Position', candidate.appliedPosition],
                ['Current Location', candidate.location],
                ['Candidate ID', candidate.id],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Joining Date *</label>
                <input type="date" className="input" value={joiningForm.joiningDate} onChange={e => setJoiningForm(f => ({ ...f, joiningDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Reporting Manager</label>
                <select className="input" value={joiningForm.reportingManager} onChange={e => setJoiningForm(f => ({ ...f, reportingManager: e.target.value }))}>
                  <option value="">Select manager</option>
                  {managerOptions.map(emp => <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <input className="input" value={joiningForm.department} onChange={e => setJoiningForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div>
                <label className="label">Designation</label>
                <input className="input" value={joiningForm.designation} onChange={e => setJoiningForm(f => ({ ...f, designation: e.target.value }))} />
              </div>
              <div>
                <label className="label">Employment Type</label>
                <input className="input" value={joiningForm.employmentType} onChange={e => setJoiningForm(f => ({ ...f, employmentType: e.target.value }))} />
              </div>
              <div>
                <label className="label">Work Location</label>
                <input className="input" value={joiningForm.workLocation} onChange={e => setJoiningForm(f => ({ ...f, workLocation: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Offer Letter / Document Ref</label>
                <input className="input" value={joiningForm.offerLetter} onChange={e => setJoiningForm(f => ({ ...f, offerLetter: e.target.value }))} placeholder="Offer letter link or reference number" />
              </div>
              <div className="col-span-2">
                <label className="label">Notes for IT</label>
                <textarea className="input resize-none" rows={3} value={joiningForm.onboardingNotes} onChange={e => setJoiningForm(f => ({ ...f, onboardingNotes: e.target.value }))} placeholder="Laptop, email groups, tools, access, or seating notes" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setJoiningModal(false)}>Cancel</button>
              <button className="btn-primary btn" onClick={saveJoiningDetails}><Send size={14} /> Share with IT</button>
            </div>
          </div>
        </Modal>
      )}

      {itModal && (
        <Modal title="Complete IT Setup" onClose={() => setItModal(false)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
              {[
                ['Candidate', `${candidate.firstName} ${candidate.lastName}`],
                ['Joining Date', candidate.joiningDetails?.joiningDate],
                ['Department', candidate.joiningDetails?.department],
                ['Designation', candidate.joiningDetails?.designation],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Employee / Candidate ID *</label>
                <input className="input" value={itSetupForm.employeeId} onChange={e => setItSetupForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="Example: EMP1024" />
              </div>
              <div>
                <label className="label">Work Email</label>
                <input className="input" value={itSetupForm.workEmail} onChange={e => setItSetupForm(f => ({ ...f, workEmail: e.target.value }))} placeholder="name@company.com" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={itSetupForm.laptopRequired} onChange={e => setItSetupForm(f => ({ ...f, laptopRequired: e.target.checked }))} />
                Laptop prepared
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={itSetupForm.idCardRequired} onChange={e => setItSetupForm(f => ({ ...f, idCardRequired: e.target.checked }))} />
                ID card prepared
              </label>
              <div className="col-span-2">
                <label className="label">Setup Notes</label>
                <textarea className="input resize-none" rows={3} value={itSetupForm.systemAccessNotes} onChange={e => setItSetupForm(f => ({ ...f, systemAccessNotes: e.target.value }))} placeholder="System access, email groups, hardware, or pending items" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setItModal(false)}>Cancel</button>
              <button className="btn-primary btn" onClick={saveItSetup}><CheckCircle size={14} /> Mark Setup Complete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Telephonic Interview Info Modal */}
      <ResumeExtractorModal
        isOpen={showExtractor}
        onClose={() => setShowExtractor(false)}
        onSave={handleExtractedData}
        existingData={{
          yearsOfExperience: candidate.yearsOfExperience || '',
          skills: candidate.skills || '',
          expertise: candidate.expertise || '',
          role: candidate.role || '',
          currentCTC: candidate.currentCTC || '',
          expectedCTC: candidate.expectedCTC || '',
          negotiable: candidate.negotiable || false,
          noticePeriod: candidate.noticePeriod || '',
          immediateJoining: candidate.immediateJoining || false,
        }}
      />
    </div>
  );
}
