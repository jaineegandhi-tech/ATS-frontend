import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import Modal from '../../components/shared/Modal';
import { Pencil, Eye, Search } from 'lucide-react';

function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function EmployeeSalaries() {
  useStorageSync();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modal, setModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState({});
  const [, forceUpdate] = useState(0);

  const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active' && e.role !== 'hr');
  const structures = getStore(STORAGE_KEYS.SALARY_STRUCTURES);
  const empSalaries = getStore(STORAGE_KEYS.EMPLOYEE_SALARIES);
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (!q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)) &&
      (!filterDept || e.department === filterDept);
  });

  function getSalary(empId) { return empSalaries.find(s => s.employeeId === empId); }

  function openEdit(emp) {
    const sal = getSalary(emp.id);
    setForm({ employeeId: emp.id, structureId: sal?.structureId || '', effectiveDate: sal?.effectiveDate || '', customGross: sal?.customGross || '', customNet: sal?.customNet || '' });
    setModal(emp);
  }

  function save() {
    if (!form.structureId) return alert('Please select a salary structure.');
    const structure = structures.find(s => s.id === form.structureId);
    const all = getStore(STORAGE_KEYS.EMPLOYEE_SALARIES);
    const record = {
      employeeId: form.employeeId,
      structureId: form.structureId,
      structureName: structure?.name,
      grossSalary: structure?.grossSalary,
      totalDeductions: structure?.totalDeductions,
      netSalary: structure?.netSalary,
      effectiveDate: form.effectiveDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    const idx = all.findIndex(s => s.employeeId === form.employeeId);
    if (idx >= 0) all[idx] = record; else all.push(record);
    setStore(STORAGE_KEYS.EMPLOYEE_SALARIES, all);
    addLog('Salary Updated', user.id, `Salary structure assigned to ${modal.firstName} ${modal.lastName}`);
    setModal(null);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title">Employee Salaries</h1>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee','ID','Department','Designation','Structure','Gross','Net','Effective Date','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No employees found.</td></tr>
              ) : filtered.map(emp => {
                const sal = getSalary(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{emp.firstName} {emp.lastName}</td>
                    <td className="table-td text-xs text-gray-400">{emp.id}</td>
                    <td className="table-td">{emp.department}</td>
                    <td className="table-td">{emp.designation}</td>
                    <td className="table-td">{sal?.structureName || <span className="text-amber-500 text-xs font-medium">Not Assigned</span>}</td>
                    <td className="table-td">{sal ? fmt(sal.grossSalary) : '—'}</td>
                    <td className="table-td font-semibold text-emerald-700">{sal ? fmt(sal.netSalary) : '—'}</td>
                    <td className="table-td">{sal?.effectiveDate || '—'}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        {sal && <button className="btn btn-sm btn-secondary" onClick={() => setViewModal({ emp, sal })}><Eye size={13} /></button>}
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(emp)}><Pencil size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign/Edit Modal */}
      {modal && (
        <Modal title={`Assign Salary — ${modal.firstName} ${modal.lastName}`} onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Salary Structure *</label>
              <select className="input" value={form.structureId} onChange={e => setForm(f => ({ ...f, structureId: e.target.value }))}>
                <option value="">Select Structure</option>
                {structures.map(s => <option key={s.id} value={s.id}>{s.name} — Net {fmt(s.netSalary)}</option>)}
              </select>
            </div>
            {form.structureId && (() => {
              const s = structures.find(x => x.id === form.structureId);
              return s ? (
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><p className="text-gray-400">Gross</p><p className="font-bold text-emerald-700">{fmt(s.grossSalary)}</p></div>
                  <div><p className="text-gray-400">Deductions</p><p className="font-bold text-red-600">{fmt(s.totalDeductions)}</p></div>
                  <div><p className="text-gray-400">Net</p><p className="font-bold text-blue-700">{fmt(s.netSalary)}</p></div>
                </div>
              ) : null;
            })()}
            <div>
              <label className="label">Effective Date</label>
              <input type="date" className="input" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary btn" onClick={save}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModal && (
        <Modal title="Salary Details" onClose={() => setViewModal(null)} size="sm">
          <div className="space-y-3 text-sm">
            {[
              ['Employee', `${viewModal.emp.firstName} ${viewModal.emp.lastName}`],
              ['Employee ID', viewModal.emp.id],
              ['Department', viewModal.emp.department],
              ['Designation', viewModal.emp.designation],
              ['Structure', viewModal.sal.structureName],
              ['Gross Salary', fmt(viewModal.sal.grossSalary)],
              ['Total Deductions', fmt(viewModal.sal.totalDeductions)],
              ['Net Salary', fmt(viewModal.sal.netSalary)],
              ['Effective Date', viewModal.sal.effectiveDate],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                <span className="text-gray-400">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
