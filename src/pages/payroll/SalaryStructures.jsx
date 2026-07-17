import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import Modal from '../../components/shared/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY = {
  name: '', description: '',
  basicSalary: '', hra: '', medicalAllowance: '', travelAllowance: '', specialAllowance: '', otherAllowances: '',
  pf: '', professionalTax: '', incomeTax: '', esi: '', loanDeduction: '', otherDeductions: '',
};

function num(v) { return Number(v) || 0; }
function fmt(n) { return `$${Number(n || 0).toLocaleString()}`; }

export default function SalaryStructures() {
  useStorageSync();
  const { user } = useAuth();
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [, forceUpdate] = useState(0);

  const structures = getStore(STORAGE_KEYS.SALARY_STRUCTURES);

  function openAdd() { setForm(EMPTY); setEditId(null); setModal('add'); }
  function openEdit(s) { setForm(s); setEditId(s.id); setModal('edit'); }

  function save() {
    if (!form.name.trim()) return alert('Structure name is required.');
    const all = getStore(STORAGE_KEYS.SALARY_STRUCTURES);
    const gross = num(form.basicSalary) + num(form.hra) + num(form.medicalAllowance) + num(form.travelAllowance) + num(form.specialAllowance) + num(form.otherAllowances);
    const totalDed = num(form.pf) + num(form.professionalTax) + num(form.incomeTax) + num(form.esi) + num(form.loanDeduction) + num(form.otherDeductions);
    const record = { ...form, grossSalary: gross, totalDeductions: totalDed, netSalary: gross - totalDed };
    if (editId) {
      setStore(STORAGE_KEYS.SALARY_STRUCTURES, all.map(s => s.id === editId ? { ...record, id: editId } : s));
      addLog('Salary Structure Updated', user.id, `Structure "${form.name}" updated`);
    } else {
      setStore(STORAGE_KEYS.SALARY_STRUCTURES, [...all, { ...record, id: `SS${Date.now()}`, createdAt: new Date().toISOString() }]);
      addLog('Salary Structure Created', user.id, `Structure "${form.name}" created`);
    }
    setModal(null);
    forceUpdate(n => n + 1);
  }

  function remove(id, name) {
    if (!window.confirm(`Delete structure "${name}"?`)) return;
    setStore(STORAGE_KEYS.SALARY_STRUCTURES, getStore(STORAGE_KEYS.SALARY_STRUCTURES).filter(s => s.id !== id));
    forceUpdate(n => n + 1);
  }

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const EarningField = ({ label, field }) => (
    <div>
      <label className="label">{label}</label>
      <input type="number" min="0" className="input" value={form[field]} onChange={e => set(field, e.target.value)} placeholder="0" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Salary Structures</h1>
        <button className="btn-primary btn" onClick={openAdd}><Plus size={16} /> Create Structure</button>
      </div>

      {structures.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm mb-3">No salary structures yet.</p>
          <button className="btn-primary btn" onClick={openAdd}><Plus size={15} /> Create First Structure</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {structures.map(s => (
            <div key={s.id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(s.id, s.name)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Gross</p>
                  <p className="text-sm font-bold text-emerald-700">{fmt(s.grossSalary)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Deductions</p>
                  <p className="text-sm font-bold text-red-600">{fmt(s.totalDeductions)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Net</p>
                  <p className="text-sm font-bold text-blue-700">{fmt(s.netSalary)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Basic: <strong className="text-gray-700">{fmt(s.basicSalary)}</strong></span>
                <span>HRA: <strong className="text-gray-700">{fmt(s.hra)}</strong></span>
                <span>PF: <strong className="text-gray-700">{fmt(s.pf)}</strong></span>
                <span>Tax: <strong className="text-gray-700">{fmt(s.incomeTax)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Salary Structure' : 'Create Salary Structure'} onClose={() => setModal(null)} size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Structure Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Junior Engineer" /></div>
              <div className="col-span-2"><label className="label">Description</label><input className="input" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            </div>

            <div>
              <p className="form-section-title">Earnings</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <EarningField label="Basic Salary" field="basicSalary" />
                <EarningField label="HRA" field="hra" />
                <EarningField label="Medical Allowance" field="medicalAllowance" />
                <EarningField label="Travel Allowance" field="travelAllowance" />
                <EarningField label="Special Allowance" field="specialAllowance" />
                <EarningField label="Other Allowances" field="otherAllowances" />
              </div>
            </div>

            <div>
              <p className="form-section-title">Deductions</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <EarningField label="Provident Fund (PF)" field="pf" />
                <EarningField label="Professional Tax" field="professionalTax" />
                <EarningField label="Income Tax" field="incomeTax" />
                <EarningField label="ESI" field="esi" />
                <EarningField label="Loan Deduction" field="loanDeduction" />
                <EarningField label="Other Deductions" field="otherDeductions" />
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
              {[
                ['Gross Salary', num(form.basicSalary)+num(form.hra)+num(form.medicalAllowance)+num(form.travelAllowance)+num(form.specialAllowance)+num(form.otherAllowances), 'text-emerald-700'],
                ['Total Deductions', num(form.pf)+num(form.professionalTax)+num(form.incomeTax)+num(form.esi)+num(form.loanDeduction)+num(form.otherDeductions), 'text-red-600'],
                ['Net Salary', (num(form.basicSalary)+num(form.hra)+num(form.medicalAllowance)+num(form.travelAllowance)+num(form.specialAllowance)+num(form.otherAllowances))-(num(form.pf)+num(form.professionalTax)+num(form.incomeTax)+num(form.esi)+num(form.loanDeduction)+num(form.otherDeductions)), 'text-blue-700'],
              ].map(([label, val, cls]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold ${cls}`}>{fmt(val)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary btn" onClick={save}>Save Structure</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
