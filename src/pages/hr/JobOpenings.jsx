import { useMemo, useState } from 'react';
import { Briefcase, CheckCircle, Minus, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, addLog, getStore, setStore } from '../../utils/store';
import { isHeadHR } from '../../utils/roles';
import { formatDate } from '../../utils/helpers';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const DEPARTMENTS = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Product'];

function OpeningModal({ opening, user, onClose, onSaved }) {
  const [form, setForm] = useState(() => opening || {
    positionName: '',
    department: '',
    openings: 1,
    filled: 0,
    status: 'open',
  });
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const positionName = form.positionName.trim();
    const openings = Number(form.openings);
    const filled = Number(form.filled);

    if (!positionName) return setError('Please enter a position name.');
    if (!form.department) return setError('Please select a department.');
    if (!Number.isInteger(openings) || openings < 0) return setError('Openings must be 0 or more.');
    if (!Number.isInteger(filled) || filled < 0) return setError('Filled positions must be 0 or more.');
    if (filled > openings) return setError('Filled positions cannot be greater than total openings.');

    const all = getStore(STORAGE_KEYS.JOB_OPENINGS);
    const updatedAt = new Date().toISOString();
    const updatedBy = `${user.firstName} ${user.lastName}`;
    const payload = {
      ...form,
      positionName,
      openings,
      filled,
      status: filled >= openings ? 'filled' : 'open',
      updatedAt,
      updatedBy,
    };

    const updated = opening
      ? all.map(item => item.id === opening.id ? { ...item, ...payload } : item)
      : [{ id: `JOB${Date.now()}`, ...payload }, ...all];

    setStore(STORAGE_KEYS.JOB_OPENINGS, updated);
    addLog(opening ? 'Job Opening Updated' : 'Job Opening Added', user.id, `${updatedBy} ${opening ? 'updated' : 'added'} ${positionName}`);
    onSaved();
  }

  return (
    <Modal title={opening ? 'Update Job Opening' : 'Add Job Opening'} onClose={onClose} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="label">Position Name</label>
          <input className="input" value={form.positionName} onChange={e => set('positionName', e.target.value)} placeholder="Example: React Developer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(dept => <option key={dept}>{dept}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Total Openings</label>
            <input className="input" type="number" min="0" value={form.openings} onChange={e => set('openings', e.target.value)} />
          </div>
          <div>
            <label className="label">Filled Positions</label>
            <input className="input" type="number" min="0" value={form.filled} onChange={e => set('filled', e.target.value)} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg px-3 py-2 text-sm">{error}</div>}

        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary btn">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function JobOpenings() {
  const { user } = useAuth();
  const canManage = isHeadHR(user);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [, forceUpdate] = useState(0);

  const openings = getStore(STORAGE_KEYS.JOB_OPENINGS);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return openings.filter(item => !q || `${item.positionName} ${item.department} ${item.status}`.toLowerCase().includes(q));
  }, [openings, search]);

  function refresh() {
    setEditing(null);
    setShowCreate(false);
    setDeleteTarget(null);
    forceUpdate(n => n + 1);
  }

  function updateFilled(opening, delta) {
    const nextFilled = Math.min(opening.openings, Math.max(0, opening.filled + delta));
    const updatedBy = `${user.firstName} ${user.lastName}`;
    const updated = getStore(STORAGE_KEYS.JOB_OPENINGS).map(item => item.id === opening.id
      ? { ...item, filled: nextFilled, status: nextFilled >= item.openings ? 'filled' : 'open', updatedAt: new Date().toISOString(), updatedBy }
      : item);
    setStore(STORAGE_KEYS.JOB_OPENINGS, updated);
    addLog('Job Opening Updated', user.id, `${updatedBy} updated filled count for ${opening.positionName}`);
    forceUpdate(n => n + 1);
  }

  function handleDelete() {
    const updatedBy = `${user.firstName} ${user.lastName}`;
    setStore(STORAGE_KEYS.JOB_OPENINGS, getStore(STORAGE_KEYS.JOB_OPENINGS).filter(item => item.id !== deleteTarget.id));
    addLog('Job Opening Deleted', user.id, `${updatedBy} deleted ${deleteTarget.positionName}`);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Openings</h1>
          <p className="text-xs text-gray-400 mt-0.5">Head HR creates and publishes openings; HR views published roles.</p>
        </div>
        {canManage && (
          <button className="btn-primary btn" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Add Opening
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input input-sm pl-9" placeholder="Search by position or department..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className={`badge ${canManage ? 'badge-purple' : 'badge-gray'}`}>
            {canManage ? 'Head HR controls enabled' : 'View only'}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Briefcase size={30} className="mx-auto mb-2 text-gray-200" />
          No job openings found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(opening => {
            const remaining = Math.max(0, opening.openings - opening.filled);
            const isFilled = remaining === 0;
            return (
              <div key={opening.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isFilled ? 'bg-emerald-50' : 'bg-primary-light'}`}>
                      {isFilled ? <CheckCircle size={18} className="text-emerald-600" /> : <Briefcase size={18} className="text-primary-700" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-900 truncate">{opening.positionName}</h2>
                      <p className="text-xs text-gray-400">{opening.department}</p>
                    </div>
                  </div>
                  <span className={isFilled ? 'badge-green' : 'badge-blue'}>{isFilled ? 'Filled' : 'Open'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Openings</p>
                    <p className="text-lg font-bold text-gray-900">{remaining}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Filled</p>
                    <p className="text-lg font-bold text-gray-900">{opening.filled}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</p>
                    <p className="text-lg font-bold text-gray-900">{opening.openings}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Users size={13} />
                  <span>Updated by {opening.updatedBy || 'Head HR'} on {formatDate(opening.updatedAt)}</span>
                </div>

                {canManage && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <button className="btn btn-xs btn-secondary" onClick={() => updateFilled(opening, -1)} disabled={opening.filled <= 0}>
                      <Minus size={12} /> Filled
                    </button>
                    <button className="btn btn-xs btn-secondary" onClick={() => updateFilled(opening, 1)} disabled={opening.filled >= opening.openings}>
                      <Plus size={12} /> Filled
                    </button>
                    <button className="btn btn-xs btn-secondary ml-auto" onClick={() => setEditing(opening)}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button className="btn btn-xs btn-danger" onClick={() => setDeleteTarget(opening)}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <OpeningModal user={user} onClose={() => setShowCreate(false)} onSaved={refresh} />}
      {editing && <OpeningModal opening={editing} user={user} onClose={() => setEditing(null)} onSaved={refresh} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Job Opening"
          message={`Delete ${deleteTarget.positionName}? Other HR team members will no longer see this opening.`}
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
