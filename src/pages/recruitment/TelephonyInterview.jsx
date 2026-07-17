import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useNavigate } from 'react-router-dom';
import { Phone, Plus, Search, Trash2, Pencil, X, ChevronDown, UserPlus, Download } from 'lucide-react';
import { isRecruiter } from '../../utils/roles';

const OUTCOMES = ['Positive', 'Negative', 'On Hold', 'No Response', 'Call Back Later'];
const OUTCOME_BADGE = {
  Positive: 'badge-green',
  Negative: 'badge-red',
  'On Hold': 'badge-yellow',
  'No Response': 'badge-gray',
  'Call Back Later': 'badge-yellow',
};

const EMPTY_FORM = {
  candidateName: '',
  contactNumber: '',
  position: '',
  department: '',
  callDate: '',
  callTime: '',
  calledBy: '',
  duration: '',
  outcome: 'Positive',
  currentCTC: '',
  expectedCTC: '',
  noticePeriod: '',
  immediateJoiner: false,
  notes: '',
};

function generateId() {
  return 'TI' + Date.now().toString().slice(-8);
}

export default function TelephonyInterview() {
  useStorageSync();
  const { user } = useAuth();
  const isHR = isRecruiter(user);

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // null = new, else existing record
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [errors, setErrors] = useState({});
  const [, forceUpdate] = useState(0);

  const records = getStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.candidateName?.toLowerCase().includes(q) ||
      r.position?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.contactNumber?.includes(q);
    const matchOutcome = !filterOutcome || r.outcome === filterOutcome;
    const matchDate = !filterDate || r.callDate === filterDate;
    return matchSearch && matchOutcome && matchDate;
  });

  // Sort newest first
  const sorted = [...filtered].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  function openNew() {
    setForm({ ...EMPTY_FORM, calledBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() });
    setEditEntry(null);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(record) {
    setForm({ ...record });
    setEditEntry(record);
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditEntry(null);
    setErrors({});
  }

  function validate() {
    const e = {};
    if (!form.candidateName.trim()) e.candidateName = 'Required';
    if (!form.contactNumber.trim()) e.contactNumber = 'Required';
    if (!form.position.trim()) e.position = 'Required';
    if (!form.callDate) e.callDate = 'Required';
    if (!form.outcome) e.outcome = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function saveRecord() {
    if (!validate()) return;
    const all = getStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS);
    if (editEntry) {
      const updated = all.map(r =>
        r.id === editEntry.id ? { ...form, id: editEntry.id, updatedAt: new Date().toISOString(), updatedBy: user?.id } : r
      );
      setStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS, updated);
      addLog('Telephony Interview Updated', user.id, `Updated telephonic interview for ${form.candidateName}`);
    } else {
      const newRecord = {
        ...form,
        id: generateId(),
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
      };
      setStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS, [newRecord, ...all]);
      addLog('Telephony Interview Added', user.id, `Added telephonic interview for ${form.candidateName}`);
    }
    closeModal();
    forceUpdate(n => n + 1);
  }

  function deleteRecord() {
    const all = getStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS);
    setStore(STORAGE_KEYS.TELEPHONY_INTERVIEWS, all.filter(r => r.id !== deleteId));
    addLog('Telephony Interview Deleted', user.id, `Deleted telephonic interview id ${deleteId}`);
    setDeleteId(null);
    forceUpdate(n => n + 1);
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  function exportSingleCSV(r) {
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
    a.download = `telephonic_${r.candidateName.replace(/\s+/g, '_')}.csv`;
    a.click();
  }

  function exportCSV() {
    const headers = ['Candidate Name','Contact','Position','Department','Call Date','Call Time','Duration','Called By','Outcome','Current CTC','Expected CTC','Notice Period','Immediate Joiner','Notes'];
    const rows = sorted.map(r => [
      r.candidateName, r.contactNumber, r.position, r.department || '',
      r.callDate || '', r.callTime || '', r.duration ? `${r.duration} min` : '',
      r.calledBy || '', r.outcome, r.currentCTC || '', r.expectedCTC || '',
      r.noticePeriod || '', r.immediateJoiner ? 'Yes' : 'No', r.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'telephonic_interviews.csv';
    a.click();
  }

  function promoteToCandidate(r) {
    navigate('/candidates/add', {
      state: {
        fromTelephonic: true,
        telephonicId: r.id,
        firstName: r.candidateName?.split(' ')[0] || '',
        lastName: r.candidateName?.split(' ').slice(1).join(' ') || '',
        mobile: r.contactNumber,
        appliedPosition: r.position,
        department: r.department || '',
        currentCTC: r.currentCTC || '',
        expectedCTC: r.expectedCTC || '',
        noticePeriod: r.noticePeriod || '',
        immediateJoining: r.immediateJoiner || false,
      },
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Phone size={18} className="text-violet-600" />
          </div>
          <div>
            <h1 className="page-title mb-0">Telephonic Interviews</h1>
            <p className="text-xs text-gray-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        {isHR && (
          <button className="btn btn-primary flex items-center gap-2" onClick={openNew}>
            <Plus size={15} /> Add Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-8 w-full"
              placeholder="Search by name, position, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <select className="input w-auto" value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
            <option value="">All Outcomes</option>
            {OUTCOMES.map(o => <option key={o}>{o}</option>)}
          </select>
          <input type="date" className="input w-auto" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {(filterOutcome || filterDate || search) && (
            <button
              className="btn btn-sm btn-secondary text-xs"
              onClick={() => { setFilterOutcome(''); setFilterDate(''); setSearch(''); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Candidate', 'Contact', 'Position', 'Department', 'Call Date', 'Time', 'Duration', 'Called By', 'Outcome', 'Current CTC', 'Expected CTC', 'Notice Period', 'Imm. Joiner', 'Notes', isHR ? 'Actions' : null].filter(Boolean).map(h => (
                  <th key={h} className="table-th whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={isHR ? 16 : 15} className="table-td text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Phone size={28} className="text-gray-300" />
                      <p className="text-sm">No telephonic interview records found.</p>
                      {isHR && <button className="btn btn-sm btn-primary mt-1" onClick={openNew}>Add First Record</button>}
                    </div>
                  </td>
                </tr>
              ) : sorted.map((r, idx) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td text-gray-400 text-xs font-mono">{sorted.length - idx}</td>
                  <td className="table-td font-semibold text-gray-800 whitespace-nowrap">{r.candidateName}</td>
                  <td className="table-td font-mono text-sm text-gray-600 whitespace-nowrap">{r.contactNumber}</td>
                  <td className="table-td whitespace-nowrap">{r.position}</td>
                  <td className="table-td text-gray-500 whitespace-nowrap">{r.department || '—'}</td>
                  <td className="table-td whitespace-nowrap">{r.callDate ? formatDate(r.callDate) : '—'}</td>
                  <td className="table-td whitespace-nowrap">{r.callTime || '—'}</td>
                  <td className="table-td whitespace-nowrap">{r.duration ? `${r.duration} min` : '—'}</td>
                  <td className="table-td whitespace-nowrap">{r.calledBy || '—'}</td>
                  <td className="table-td">
                    <span className={`badge ${OUTCOME_BADGE[r.outcome] || 'badge-gray'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        OUTCOME_BADGE[r.outcome] === 'badge-green' ? 'bg-emerald-500' :
                        OUTCOME_BADGE[r.outcome] === 'badge-red' ? 'bg-red-500' :
                        OUTCOME_BADGE[r.outcome] === 'badge-yellow' ? 'bg-amber-500' : 'bg-gray-400'
                      }`} />
                      {r.outcome}
                    </span>
                  </td>
                  <td className="table-td text-sm text-gray-600">{r.currentCTC || '—'}</td>
                  <td className="table-td text-sm text-gray-600">{r.expectedCTC || '—'}</td>
                  <td className="table-td whitespace-nowrap">{r.noticePeriod || '—'}</td>
                  <td className="table-td text-center">
                    {r.immediateJoiner ? (
                      <span className="badge badge-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Yes</span>
                    ) : (
                      <span className="badge badge-gray"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />No</span>
                    )}
                  </td>
                  <td className="table-td max-w-[160px] truncate text-gray-500 text-xs" title={r.notes}>{r.notes || '—'}</td>
                  {isHR && (
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button className="btn btn-sm btn-secondary" title="Export" onClick={() => exportSingleCSV(r)}>
                          <Download size={13} />
                        </button>
                        <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => openEdit(r)}>
                          <Pencil size={13} />
                        </button>
                        {r.outcome === 'Positive' && !r.candidateId && (
                          <button
                            className="btn btn-sm btn-primary gap-1"
                            title="Add as Candidate"
                            onClick={() => promoteToCandidate(r)}
                          >
                            <UserPlus size={13} /> Add Candidate
                          </button>
                        )}
                        {r.candidateId && (
                          <span className="badge badge-green text-[10px]">Promoted</span>
                        )}
                        <button className="btn btn-sm btn-danger" title="Delete" onClick={() => setDeleteId(r.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {sorted.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">Showing {sorted.length} of {records.length} records</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editEntry ? 'Edit Telephonic Interview' : 'Add Telephonic Interview'}
          onClose={closeModal}
          size="xl"
        >
          <div className="space-y-5">
            {/* Section: Candidate Info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Candidate Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Candidate Name <span className="text-red-500">*</span></label>
                  <input className={`input ${errors.candidateName ? 'border-red-400' : ''}`} value={form.candidateName} onChange={e => set('candidateName', e.target.value)} placeholder="Full name" />
                  {errors.candidateName && <p className="text-xs text-red-500 mt-1">{errors.candidateName}</p>}
                </div>
                <div>
                  <label className="label">Contact Number <span className="text-red-500">*</span></label>
                  <input className={`input ${errors.contactNumber ? 'border-red-400' : ''}`} value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="+91 98765 43210" />
                  {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
                </div>
                <div>
                  <label className="label">Position Applied <span className="text-red-500">*</span></label>
                  <input className={`input ${errors.position ? 'border-red-400' : ''}`} value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Frontend Developer" />
                  {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" />
                </div>
              </div>
            </div>

            {/* Section: Call Details */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Call Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Call Date <span className="text-red-500">*</span></label>
                  <input type="date" className={`input ${errors.callDate ? 'border-red-400' : ''}`} value={form.callDate} onChange={e => set('callDate', e.target.value)} />
                  {errors.callDate && <p className="text-xs text-red-500 mt-1">{errors.callDate}</p>}
                </div>
                <div>
                  <label className="label">Call Time</label>
                  <input type="time" className="input" value={form.callTime} onChange={e => set('callTime', e.target.value)} />
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input type="number" min="1" className="input" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 15" />
                </div>
                <div>
                  <label className="label">Called By</label>
                  <input className="input" value={form.calledBy} onChange={e => set('calledBy', e.target.value)} placeholder="Interviewer name" />
                </div>
                <div className="col-span-2">
                  <label className="label">Outcome <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className={`input appearance-none pr-8 ${errors.outcome ? 'border-red-400' : ''}`} value={form.outcome} onChange={e => set('outcome', e.target.value)}>
                      {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.outcome && <p className="text-xs text-red-500 mt-1">{errors.outcome}</p>}
                </div>
              </div>
            </div>

            {/* Section: CTC & Availability */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CTC & Availability</p>
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
                  <input className="input" value={form.noticePeriod} onChange={e => set('noticePeriod', e.target.value)} placeholder="e.g. 30 days / Immediate" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="immediateJoiner"
                    checked={form.immediateJoiner}
                    onChange={e => set('immediateJoiner', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                  />
                  <label htmlFor="immediateJoiner" className="label mb-0 cursor-pointer">Immediate Joiner</label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes / Remarks</label>
              <textarea
                className="input min-h-[80px] resize-y"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes from the call…"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRecord}>
                {editEntry ? 'Save Changes' : 'Save Record'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Modal title="Delete Record" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete this telephonic interview record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={deleteRecord}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
