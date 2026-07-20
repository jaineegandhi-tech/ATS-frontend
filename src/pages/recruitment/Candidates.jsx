import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog, syncCandidateStatuses } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/shared/StatusBadge';
import { Plus, Search, Eye, Pencil, CalendarDays, Download, Archive } from 'lucide-react';
import { ROLES, isRecruiter, isHeadHR } from '../../utils/roles';

const ROUNDS = ['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'];
const STATUSES = ['New Candidate', 'Interview Scheduled', 'Interview Completed', 'Passed', 'Failed', 'On Hold', 'Selected', 'Rejected', 'Next Round Scheduled', 'Offer Sent', 'Offer Accepted', 'Offer Declined', 'Joined'];

export default function Candidates() {
  useStorageSync();
  // Sync candidate statuses with their actual interviews
  syncCandidateStatuses();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHR = isRecruiter(user);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRound, setFilterRound] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [, forceUpdate] = useState(0);

  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const departments = [...new Set(candidates.map(c => c.department).filter(Boolean))];

  const visibleCandidates = candidates.filter(c => {
    if (user?.role === ROLES.INTERVIEWER) {
      return interviews.some(i => i.candidateId === c.id && i.interviewerIds?.includes(user.id));
    }
    if (user?.role === ROLES.IT) {
      return ['Offered', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(c.status);
    }
    if (user?.role === ROLES.HR) {
      return !c.assignedTo || c.assignedTo === user.id || c.createdBy === user.id;
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
        {isHR && (
          <button className="btn-primary btn" onClick={() => navigate('/candidates/add')}>
            <Plus size={16} /> Add Candidate
          </button>
        )}
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['ID', 'Candidate', 'Applied Position', 'Interview Date', 'Time', 'Interviewer', 'Round', 'Status', ...(isHeadHR(user) ? ['Created By'] : []), 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No candidates found.</td></tr>
              ) : filtered.map(c => {
                const iv = getLatestInterview(c.id);
                const hasScheduledInterview = !!iv;
                const interviewers = iv?.interviewerIds?.map(id => {
                  const emp = getStore(STORAGE_KEYS.EMPLOYEES).find(e => e.id === id);
                  return emp ? `${emp.firstName} ${emp.lastName}` : id;
                }).join(', ') || '—';
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-td text-xs text-gray-400">{c.id}</td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="table-td">{c.appliedPosition}</td>
                    <td className="table-td">{iv?.date ? formatDate(iv.date) : '—'}</td>
                    <td className="table-td">{iv?.time || '—'}</td>
                    <td className="table-td text-xs">{interviewers}</td>
                    <td className="table-td">{c.currentRound || '—'}</td>
                    <td className="table-td"><StatusBadge status={c.status} /></td>
                    {isHeadHR(user) && (
                      <td className="table-td text-xs">
                        {c.createdBy ? (() => {
                          const creator = getStore(STORAGE_KEYS.EMPLOYEES).find(e => e.id === c.createdBy);
                          return creator ? `${creator.firstName} ${creator.lastName}` : c.createdBy;
                        })() : '—'}
                      </td>
                    )}
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button className="btn btn-sm btn-secondary" title="View" onClick={() => navigate(`/candidates/${c.id}`)}><Eye size={13} /></button>
                        {isHR && <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => navigate(`/candidates/${c.id}/edit`)}><Pencil size={13} /></button>}
                        {isHR && <button className="btn btn-sm btn-secondary" title={hasScheduledInterview ? 'Reschedule Interview' : 'Schedule Interview'} onClick={() => navigate(`/candidates/${c.id}/schedule`)}><CalendarDays size={13} /> {hasScheduledInterview ? 'Reschedule' : 'Schedule'}</button>}
                        <button className="btn btn-sm btn-secondary" title="Download Resume" onClick={() => downloadResume(c)}><Download size={13} /></button>
                        {isHR && c.status !== 'archived' && <button className="btn btn-sm btn-secondary" title="Archive" onClick={() => archive(c.id)}><Archive size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
