import { useState } from 'react';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave'];

export default function LeaveAllocation() {
  const [form, setForm] = useState({ leaveType: 'Annual Leave', days: '', year: new Date().getFullYear().toString() });
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function handleGrant() {
    const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active');
    const balances = getStore(STORAGE_KEYS.LEAVE_BALANCES);
    const typeKey = form.leaveType.replace(' Leave', '');
    employees.forEach(emp => {
      if (!balances[emp.id]) balances[emp.id] = {};
      balances[emp.id][typeKey] = (balances[emp.id][typeKey] || 0) + parseInt(form.days);
    });
    setStore(STORAGE_KEYS.LEAVE_BALANCES, balances);
    addLog('Annual Leave Allocation', 'HR', `Granted ${form.days} ${form.leaveType} days to all ${employees.length} active employees for ${form.year}`);
    setSuccess(`Successfully granted ${form.days} ${form.leaveType} days to ${employees.length} active employees.`);
    setConfirm(false);
    setForm(f => ({ ...f, days: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.days || parseInt(form.days) < 1) return setError('Please enter a valid number of days.');
    setError('');
    setConfirm(true);
  }

  const activeCount = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active').length;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="page-title">Annual Leave Allocation</h1>
      <p className="text-sm text-gray-500">Grant leave balance to all active employees simultaneously.</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>
      )}

      <div className="card space-y-4">
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
          This will grant leave to <strong>{activeCount} active employees</strong>.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select className="input" value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
              {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Number of Leave Days</label>
            <input type="number" className="input" min={1} max={365} value={form.days} onChange={e => { setForm(f => ({ ...f, days: e.target.value })); setError(''); }} placeholder="e.g. 15" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div>
            <label className="label">Effective Year</label>
            <input type="number" className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min={2020} max={2100} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary btn" onClick={() => setForm({ leaveType: 'Annual Leave', days: '', year: new Date().getFullYear().toString() })}>Cancel</button>
            <button type="submit" className="btn-primary btn">Grant To All Employees</button>
          </div>
        </form>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Confirm Leave Allocation"
          message={`Are you sure you want to grant ${form.days} ${form.leaveType} days to all ${activeCount} active employees for ${form.year}?`}
          confirmLabel="Yes, Grant"
          confirmClass="btn-primary"
          onConfirm={handleGrant}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
