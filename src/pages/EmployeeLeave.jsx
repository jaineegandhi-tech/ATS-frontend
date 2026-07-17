import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../utils/store';
import { formatDate } from '../utils/helpers';
import Modal from '../components/shared/Modal';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, X } from 'lucide-react';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Other'];

export default function EmployeeLeave() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveType: '', fromDate: '', toDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [, forceUpdate] = useState(0);

  const leaves = getStore(STORAGE_KEYS.LEAVES).filter(l => l.employeeId === user.id).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  const balances = (getStore(STORAGE_KEYS.LEAVE_BALANCES)[user.id]) || {};

  function calcDays(from, to) {
    if (!from || !to) return 0;
    const diff = (new Date(to) - new Date(from)) / 86400000;
    return diff < 0 ? 0 : diff + 1;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.leaveType) errs.leaveType = 'Required';
    if (!form.fromDate) errs.fromDate = 'Required';
    if (!form.toDate) errs.toDate = 'Required';
    if (!form.reason.trim()) errs.reason = 'Required';
    if (form.fromDate && form.toDate && form.toDate < form.fromDate) errs.toDate = 'End date must be after start date';
    if (Object.keys(errs).length) return setErrors(errs);

    const all = getStore(STORAGE_KEYS.LEAVES);
    const newLeave = {
      id: Date.now().toString(),
      employeeId: user.id,
      employeeName: `${user.firstName} ${user.lastName}`,
      department: user.department,
      leaveType: form.leaveType,
      fromDate: form.fromDate,
      toDate: form.toDate,
      days: calcDays(form.fromDate, form.toDate),
      reason: form.reason,
      status: 'pending',
      appliedOn: new Date().toISOString(),
      approvedDays: null,
      remarks: '',
      rejectionReason: '',
    };
    setStore(STORAGE_KEYS.LEAVES, [...all, newLeave]);
    addLog('Leave Application', user.id, `${user.firstName} applied for ${form.leaveType}`);
    setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
    setShowForm(false);
    forceUpdate(n => n + 1);
  }

  function cancelLeave(id) {
    const all = getStore(STORAGE_KEYS.LEAVES);
    setStore(STORAGE_KEYS.LEAVES, all.map(l => l.id === id ? { ...l, status: 'cancelled' } : l));
    forceUpdate(n => n + 1);
  }

  const err = f => errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Leave</h1>
        <button className="btn-primary btn" onClick={() => setShowForm(true)}><Plus size={16} /> Apply Leave</button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(balances).map(([type, days]) => (
          <div key={type} className="card text-center">
            <p className="text-2xl font-bold text-primary">{days}</p>
            <p className="text-xs text-gray-500 mt-1">{type} Leave</p>
          </div>
        ))}
        {Object.keys(balances).length === 0 && (
          <div className="col-span-4 card text-center text-gray-400 text-sm py-4">No leave balance assigned yet.</div>
        )}
      </div>

      {/* Leave History */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title mb-0">Leave History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied On', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaves.length === 0 ? (
                <tr><td colSpan={8} className="table-td text-center text-gray-400 py-8">No leave applications yet.</td></tr>
              ) : leaves.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{l.leaveType}</td>
                  <td className="table-td">{formatDate(l.fromDate)}</td>
                  <td className="table-td">{formatDate(l.toDate)}</td>
                  <td className="table-td">{l.days}</td>
                  <td className="table-td max-w-xs truncate">{l.reason}</td>
                  <td className="table-td">{formatDate(l.appliedOn)}</td>
                  <td className="table-td"><StatusBadge status={l.status} /></td>
                  <td className="table-td">
                    {l.status === 'pending' && (
                      <button className="btn btn-sm btn-danger" onClick={() => cancelLeave(l.id)}>
                        <X size={12} /> Cancel
                      </button>
                    )}
                    {l.status === 'rejected' && l.rejectionReason && (
                      <span className="text-xs text-red-500" title={l.rejectionReason}>Reason: {l.rejectionReason.slice(0, 20)}...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal title="Apply for Leave" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Leave Type *</label>
              <select className="input" value={form.leaveType} onChange={e => { setForm(f => ({ ...f, leaveType: e.target.value })); setErrors(er => ({ ...er, leaveType: '' })); }}>
                <option value="">Select Leave Type</option>
                {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {err('leaveType')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From Date *</label>
                <input type="date" className="input" value={form.fromDate} onChange={e => { setForm(f => ({ ...f, fromDate: e.target.value })); setErrors(er => ({ ...er, fromDate: '' })); }} />
                {err('fromDate')}
              </div>
              <div>
                <label className="label">To Date *</label>
                <input type="date" className="input" value={form.toDate} onChange={e => { setForm(f => ({ ...f, toDate: e.target.value })); setErrors(er => ({ ...er, toDate: '' })); }} />
                {err('toDate')}
              </div>
            </div>
            {form.fromDate && form.toDate && calcDays(form.fromDate, form.toDate) > 0 && (
              <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">Duration: {calcDays(form.fromDate, form.toDate)} day(s)</p>
            )}
            <div>
              <label className="label">Reason *</label>
              <textarea className="input resize-none" rows={3} value={form.reason} onChange={e => { setForm(f => ({ ...f, reason: e.target.value })); setErrors(er => ({ ...er, reason: '' })); }} />
              {err('reason')}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn">Submit Leave</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
