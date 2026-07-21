import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import StatusBadge from '../../components/shared/StatusBadge';
import { Plus, Search, Eye, Pencil, CalendarDays, Download, Archive, Users2, UserCheck, MoreVertical } from 'lucide-react';
import { ROLES, isRecruiter, isHeadHR } from '../../utils/roles';

const ROUNDS = ['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'];
const STATUSES = ['New Candidate', 'Interview Scheduled', 'Interview Completed', 'Passed', 'Failed', 'On Hold', 'Selected', 'Rejected', 'Next Round Scheduled', 'Offer Sent', 'Offer Accepted', 'Offer Declined', 'Joined'];

export default function Candidates() {
  useStorageSync();
  // Sync candidate statuses with their actual interviews
  syncCandidateStatuses();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHR = isRecruiter(user);
  const isOnlyHR = user?.role === ROLES.HR;
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState(() => new URLSearchParams(location.search).get('status') || '');
  const [filterRound, setFilterRound] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [myView, setMyView] = useState(true);
  const [, forceUpdate] = useState(0);

  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const departments = [...new Set(candidates.map(c => c.department).filter(Boolean))];

  const visibleCandidates = candidates.filter(c => {
    if (user?.role === ROLES.INTERVIEWER) {
      return interviews.some(i => i.candidateId === c.id && i.interviewerIds?.includes(user.id));
    }
    if (user?.role === ROLES.IT) {
      return ['Selected', 'Offered', 'Offer Sent', 'Offer Accepted', 'Joined', 'Rejected', 'Failed', 'Not Joined'].includes(c.status);
    }
    if (user?.role === ROLES.HR) {
      if (myView) return c.assignedTo === user.id || c.createdBy === user.id;
      return true; // All Candidates view
    }
    return true;
  });

  const filtered = visibleCandidates.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.appliedPosition?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    const matchDept = !filterDept || c.department === filterDept;
    const matchStatus = !filterStatus || c.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchRound = !filterRound || c.currentRound === filterRound;
    const matchArchived = showArchived ? c.status === 'archived' : c.status !== 'archived';
    return matchSearch && matchDept && matchStatus && matchRound && matchArchived;
  }).sort((a, b) => b.createdAt?.localeCompare(a.createdAt));

  function archive(id) {
    if (!window.confirm('Archive this candidate?')) return;
    const all = getStore(STORAGE_KEYS.CANDIDATES);
    setStore(STORAGE_KEYS.CANDIDATES, all.map(c => c.id === id ? { ...c, status: 'archived' } : c));
    addLog('Candidate Archived', user.id, `Candidate archived`);
    forceUpdate(n => n + 1);
  }

  function downloadResume(c) {
    if (!c.resume) return alert('No resume uploaded.');
    const a = document.createElement('a');
    a.href = c.resume;
    a.download = `${c.firstName}_${c.lastName}_Resume.pdf`;
    a.click();
  }

  function getLatestInterview(candidateId) {
    return interviews.filter(i => i.candidateId === candidateId).sort((a, b) => b.date?.localeCompare(a.date))[0];
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Candidates</h1>
        <div className="flex items-center gap-2">
          {isOnlyHR && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMyView(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${myView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UserCheck size={14} /> My Candidates
              </button>
              <button
                onClick={() => setMyView(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!myView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users2 size={14} /> All Candidates
              </button>
            </div>
          )}
          {isHR && (
            <button className="btn-primary btn" onClick={() => navigate('/candidates/add')}>
              <Plus size={16} /> Add Candidate
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name, position, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input w-auto" value={filterRound} onChange={e => setFilterRound(e.target.value)}>
            <option value="">All Rounds</option>
            {ROUNDS.map(r => <option key={r}>{r}</option>)}
          </select>
          <button className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowArchived(v => !v)}>
            <Archive size={13} /> {showArchived ? 'Active' : 'Archived'}
          </button>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">No candidates found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(c => {
            const iv = getLatestInterview(c.id);
            const hasScheduledInterview = !!iv;
            const ownerId = c.assignedTo || c.createdBy;
            const owner = getStore(STORAGE_KEYS.EMPLOYEES).find(e => e.id === ownerId);
            const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : null;
            const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`;
            return (
              <CandidateCard
                key={c.id}
                c={c}
                initials={initials}
                ownerName={ownerName}
                hasScheduledInterview={hasScheduledInterview}
                isHR={isHR}
                isOnlyHR={isOnlyHR}
                showOwner={isHeadHR(user) || (isOnlyHR && !myView)}
                user={user}
                onView={() => navigate(`/candidates/${c.id}`)}
                onEdit={() => navigate(`/candidates/${c.id}/edit`)}
                onSchedule={() => navigate(`/candidates/${c.id}/schedule`)}
                onDownload={() => downloadResume(c)}
                onArchive={() => archive(c.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CandidateCard({ c, initials, ownerName, hasScheduledInterview, isHR, isOnlyHR, showOwner, user, onView, onEdit, onSchedule, onDownload, onArchive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 flex flex-col">
      {/* Top: initials + status badge */}
      <div className="flex flex-col items-center pt-6 pb-3 px-4">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-base mb-3">
          {initials}
        </div>
        <p className="text-sm font-semibold text-heading text-center leading-tight">{c.firstName} {c.lastName}</p>
        <p className="text-xs text-body text-center mt-0.5 truncate w-full">{c.appliedPosition || '—'}</p>
        <div className="mt-2">
          <StatusBadge status={c.status} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Details */}
      <div className="px-4 py-3 space-y-1.5 flex-1">
        {c.department && (
          <p className="text-xs text-body truncate"><span className="text-gray-400">Dept:</span> {c.department}</p>
        )}
        {showOwner && ownerName && (
          <p className="text-xs text-body truncate"><span className="text-gray-400">HR:</span> {ownerName}</p>
        )}
        {!showOwner && ownerName && (
          <p className="text-xs text-body truncate"><span className="text-gray-400">HR:</span> {ownerName}</p>
        )}
        {isOnlyHR && c.assignedTo === user.id && c.createdBy !== user.id && (
          <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded inline-block">Assigned to you</span>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          className="btn btn-primary btn-sm flex-1"
          onClick={onView}
        >
          <Eye size={12} /> View
        </button>

        {/* Dropdown */}
        <div className="relative" ref={ref}>
          <button
            className="btn btn-secondary btn-sm px-2"
            onClick={() => setOpen(o => !o)}
          >
            <MoreVertical size={13} />
          </button>
          {open && (
            <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-100 rounded-xl shadow-modal z-50 py-1">
              {isHR && (
                <button className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface flex items-center gap-2" onClick={() => { setOpen(false); onEdit(); }}>
                  <Pencil size={13} /> Edit
                </button>
              )}
              {isHR && (
                <button className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface flex items-center gap-2" onClick={() => { setOpen(false); onSchedule(); }}>
                  <CalendarDays size={13} /> {hasScheduledInterview ? 'Reschedule Interview' : 'Schedule Interview'}
                </button>
              )}
              <button className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface flex items-center gap-2" onClick={() => { setOpen(false); onDownload(); }}>
                <Download size={13} /> Download Resume
              </button>
              {isHR && c.status !== 'archived' && (
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => { setOpen(false); onArchive(); }}>
                  <Archive size={13} /> Archive
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
