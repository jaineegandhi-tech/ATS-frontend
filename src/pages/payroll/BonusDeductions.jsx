import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import Modal from '../../components/shared/Modal';
import { Plus, Trash2, Gift, Minus } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const BONUS_TYPES = ['Performance Bonus','Festival Bonus','Incentive','Referral Bonus','Other Bonus'];
const DEDUCTION_TYPES = ['Loan Recovery','Salary Advance','Tax Adjustment','Penalty','Other Deduction'];
function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function BonusDeductions() {
  useStorageSync();
  const { user } = useAuth();
  const now = new Date();
  const [tab, setTab] = useState('bonus');
  const [modal, setModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [form, setForm] = useState({ employeeId: '', type: '', amount: '', reason: '', payrollMonth: filterMonth });
  const [, forceUpdate] = useState(0);

  const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active');
  const bonuses    = getStore(STORAGE_KEYS.BONUSES);
  const deductions = getStore(STORAGE_KEYS.DEDUCTIONS);

  const filteredBonuses    = bonuses.filter(b => !filterMonth || b.payrollMonth === filterMonth);
  const filteredDeductions = deductions.filter(d => !filterMonth || d.payrollMonth === filterMonth);

  function openModal() {
    setForm({ employeeId: '', type: '', amount: '', reason: '', payrollMonth: filterMonth });
    setModal(true);
  }

  function save() {
    if (!form.employeeId) return alert('Select an employee.');
    if (!form.type) return alert('Select a type.');
    if (!form.amount || Number(form.amount) <= 0) return alert('Enter a valid amount.');
    if (!form.reason.trim()) return alert('Reason is required.');
    const emp = employees.find(e => e.id === form.employeeId);
    const record = { id: `${tab.toUpperCase()}${Date.now()}`, ...form, amount: Number(form.amount), employeeName: `${emp.firstName} ${emp.lastName}`, createdAt: new Date().toISOString(), createdBy: user.id };
    if (tab === 'bonus') {
      setStore(STORAGE_KEYS.BONUSES, [...getStore(STORAGE_KEYS.BONUSES), record]);
      addLog('Bonus Added', user.id, `Bonus added for ${emp.firstName} ${emp.lastName}`);
    } else {
      setStore(STORAGE_KEYS.DEDUCTIONS, [...getStore(STORAGE_KEYS.DEDUCTIONS), record]);
      addLog('Deduction Added', user.id, `Deduction added for ${emp.firstName} ${emp.lastName}`);
    }
    setModal(false);
    forceUpdate(n => n + 1);
  }

  function remove(id, isBonus) {
    if (!window.confirm('Delete this record?')) return;
    if (isBonus) setStore(STORAGE_KEYS.BONUSES, getStore(STORAGE_KEYS.BONUSES).filter(b => b.id !== id));
    else setStore(STORAGE_KEYS.DEDUCTIONS, getStore(STORAGE_KEYS.DEDUCTIONS).filter(d => d.id !== id));
    forceUpdate(n => n + 1);
  }

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const types = tab === 'bonus' ? BONUS_TYPES : DEDUCTION_TYPES;
  const rows = tab === 'bonus' ? filteredBonuses : filteredDeductions;
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  // Build month options
  const monthOptions = [];
  for (let y = now.getFullYear() - 1; y <= now.getFullYear() + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      monthOptions.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bonuses & Deductions</h1>
        <button className="btn-primary btn" onClick={openModal}><Plus size={16} /> Add {tab === 'bonus' ? 'Bonus' : 'Deduction'}</button>
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setTab('bonus')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${tab === 'bonus' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <Gift size={14} /> Bonuses
          </button>
          <button onClick={() => setTab('deduction')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${tab === 'deduction' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <Minus size={14} /> Deductions
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {monthOptions.map(m => <option key={m}>{m}</option>)}
          </select>
          {rows.length > 0 && (
            <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${tab === 'bonus' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              Total: {fmt(total)}
            </div>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee','Type','Amount','Reason','Payroll Month','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-8">No {tab === 'bonus' ? 'bonuses' : 'deductions'} found.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{r.employeeName}</td>
                  <td className="table-td">{r.type}</td>
                  <td className={`table-td font-semibold ${tab === 'bonus' ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(r.amount)}</td>
                  <td className="table-td max-w-xs truncate">{r.reason}</td>
                  <td className="table-td">{r.payrollMonth}</td>
                  <td className="table-td">
                    <button className="btn btn-sm btn-danger" onClick={() => remove(r.id, tab === 'bonus')}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={`Add ${tab === 'bonus' ? 'Bonus' : 'Deduction'}`} onClose={() => setModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Employee *</label>
              <select className="input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="">Select Type</option>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount *</label>
              <input type="number" min="0" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Reason *</label>
              <textarea className="input resize-none" rows={2} value={form.reason} onChange={e => set('reason', e.target.value)} />
            </div>
            <div>
              <label className="label">Payroll Month *</label>
              <select className="input" value={form.payrollMonth} onChange={e => set('payrollMonth', e.target.value)}>
                {monthOptions.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary btn" onClick={save}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
