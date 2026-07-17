import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { Play, CheckCircle, Eye, Unlock } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function PayrollProcessing() {
  useStorageSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear]   = useState(String(now.getFullYear()));
  const [generated, setGenerated] = useState([]);
  const [, forceUpdate] = useState(0);

  const payrollMonth = `${year}-${month}`;
  const employees    = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active');
  const empSalaries  = getStore(STORAGE_KEYS.EMPLOYEE_SALARIES);
  const bonuses      = getStore(STORAGE_KEYS.BONUSES).filter(b => b.payrollMonth === payrollMonth);
  const deductions   = getStore(STORAGE_KEYS.DEDUCTIONS).filter(d => d.payrollMonth === payrollMonth);
  const existingPayrolls = getStore(STORAGE_KEYS.PAYROLLS).filter(p => p.month === payrollMonth);
  const alreadyGenerated = existingPayrolls.length > 0;

  function generate() {
    const unassigned = employees.filter(e => !empSalaries.find(s => s.employeeId === e.id));
    if (unassigned.length) {
      return alert(`${unassigned.length} employee(s) have no salary structure assigned:\n${unassigned.map(e => `${e.firstName} ${e.lastName}`).join(', ')}`);
    }
    if (alreadyGenerated) return alert('Payroll for this month has already been generated.');

    const records = employees.map(emp => {
      const sal = empSalaries.find(s => s.employeeId === emp.id);
      const empBonuses = bonuses.filter(b => b.employeeId === emp.id);
      const empDeductions = deductions.filter(d => d.employeeId === emp.id);
      const totalBonus = empBonuses.reduce((s, b) => s + Number(b.amount), 0);
      const totalManualDed = empDeductions.reduce((s, d) => s + Number(d.amount), 0);
      const grossSalary = (sal?.grossSalary || 0) + totalBonus;
      const totalDeductions = (sal?.totalDeductions || 0) + totalManualDed;
      const netSalary = grossSalary - totalDeductions;
      return {
        id: `PAY${Date.now()}${emp.id}`,
        employeeId: emp.id,
        month: payrollMonth,
        structureId: sal?.structureId,
        structureName: sal?.structureName,
        basicSalary: sal ? getStore(STORAGE_KEYS.SALARY_STRUCTURES).find(s => s.id === sal.structureId)?.basicSalary || 0 : 0,
        grossSalary,
        totalDeductions,
        netSalary: Math.max(0, netSalary),
        bonuses: empBonuses,
        deductions: empDeductions,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
    });

    const all = getStore(STORAGE_KEYS.PAYROLLS);
    setStore(STORAGE_KEYS.PAYROLLS, [...all, ...records]);
    addLog('Payroll Generated', user.id, `Payroll generated for ${payrollMonth}`);
    forceUpdate(n => n + 1);
  }

  function approve(id) {
    const all = getStore(STORAGE_KEYS.PAYROLLS);
    setStore(STORAGE_KEYS.PAYROLLS, all.map(p => p.id === id ? { ...p, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user.id } : p));
    addLog('Payroll Approved', user.id, `Payroll approved for ${payrollMonth}`);
    forceUpdate(n => n + 1);
  }

  function approveAll() {
    const all = getStore(STORAGE_KEYS.PAYROLLS);
    setStore(STORAGE_KEYS.PAYROLLS, all.map(p => p.month === payrollMonth && p.status === 'draft' ? { ...p, status: 'approved', approvedAt: new Date().toISOString(), approvedBy: user.id } : p));
    addLog('Payroll Approved', user.id, `All payrolls approved for ${payrollMonth}`);
    forceUpdate(n => n + 1);
  }

  function unlock(id) {
    if (!window.confirm('Unlock this payroll for editing?')) return;
    const all = getStore(STORAGE_KEYS.PAYROLLS);
    setStore(STORAGE_KEYS.PAYROLLS, all.map(p => p.id === id ? { ...p, status: 'draft' } : p));
    forceUpdate(n => n + 1);
  }

  const currentPayrolls = getStore(STORAGE_KEYS.PAYROLLS).filter(p => p.month === payrollMonth);
  const allApproved = currentPayrolls.length > 0 && currentPayrolls.every(p => p.status === 'approved');
  const hasDraft = currentPayrolls.some(p => p.status === 'draft');
  const totalNet = currentPayrolls.reduce((s, p) => s + (p.netSalary || 0), 0);

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

  return (
    <div className="space-y-5">
      <h1 className="page-title">Monthly Payroll Processing</h1>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Payroll Month</label>
            <select className="input w-40" value={month} onChange={e => setMonth(e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input w-28" value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn-primary btn" onClick={generate} disabled={alreadyGenerated}>
            <Play size={15} /> Generate Payroll
          </button>
          {hasDraft && (
            <button className="btn-success btn" onClick={approveAll}>
              <CheckCircle size={15} /> Approve All
            </button>
          )}
        </div>
        {alreadyGenerated && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Payroll for {MONTHS[parseInt(month) - 1]} {year} has already been generated.
            {allApproved ? ' All records are approved.' : ' Some records are pending approval.'}
          </p>
        )}
      </div>

      {/* Summary */}
      {currentPayrolls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Total Employees', currentPayrolls.length, 'text-gray-900'],
            ['Total Payroll', fmt(totalNet), 'text-emerald-700'],
            ['Approved', `${currentPayrolls.filter(p => p.status === 'approved').length} / ${currentPayrolls.length}`, 'text-blue-700'],
          ].map(([label, val, cls]) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-xl font-bold ${cls}`}>{val}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payroll Table */}
      {currentPayrolls.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Employee','Department','Structure','Gross','Bonuses','Deductions','Net','Status','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentPayrolls.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  const totalBonus = p.bonuses?.reduce((s, b) => s + Number(b.amount), 0) || 0;
                  const manualDed  = p.deductions?.reduce((s, d) => s + Number(d.amount), 0) || 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{emp ? `${emp.firstName} ${emp.lastName}` : p.employeeId}</td>
                      <td className="table-td">{emp?.department}</td>
                      <td className="table-td text-xs">{p.structureName}</td>
                      <td className="table-td">{fmt(p.grossSalary)}</td>
                      <td className="table-td text-emerald-600">{totalBonus > 0 ? fmt(totalBonus) : '—'}</td>
                      <td className="table-td text-red-600">{fmt(p.totalDeductions)}</td>
                      <td className="table-td font-bold text-emerald-700">{fmt(p.netSalary)}</td>
                      <td className="table-td">
                        <span className={`badge ${p.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex gap-1">
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/payroll/payslip/${p.id}`)}><Eye size={13} /></button>
                          {p.status === 'draft' && <button className="btn btn-sm btn-success" onClick={() => approve(p.id)}><CheckCircle size={13} /></button>}
                          {p.status === 'approved' && <button className="btn btn-sm btn-secondary" title="Unlock" onClick={() => unlock(p.id)}><Unlock size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
