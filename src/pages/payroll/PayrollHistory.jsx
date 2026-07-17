import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { Search, Eye, FileText } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function monthLabel(m) { if (!m) return ''; const [y, mo] = m.split('-'); return `${MONTHS[parseInt(mo) - 1]} ${y}`; }

export default function PayrollHistory() {
  useStorageSync();
  const navigate = useNavigate();
  const now = new Date();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const payrolls  = getStore(STORAGE_KEYS.PAYROLLS);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const allMonths = [...new Set(payrolls.map(p => p.month))].sort().reverse();

  const filtered = payrolls.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
    const q = search.toLowerCase();
    return (!q || name.includes(q) || p.employeeId.toLowerCase().includes(q)) &&
      (!filterDept || emp?.department === filterDept) &&
      (!filterMonth || p.month === filterMonth) &&
      (!filterStatus || p.status === filterStatus);
  }).sort((a, b) => b.month?.localeCompare(a.month) || b.createdAt?.localeCompare(a.createdAt));

  const totalNet = filtered.reduce((s, p) => s + (p.netSalary || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Payroll History</h1>
        {filtered.length > 0 && (
          <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
            Total: {fmt(totalNet)}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {allMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee','ID','Department','Month','Gross','Deductions','Net','Status','Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No payroll records found.</td></tr>
              ) : filtered.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{emp ? `${emp.firstName} ${emp.lastName}` : p.employeeId}</td>
                    <td className="table-td text-xs text-gray-400">{p.employeeId}</td>
                    <td className="table-td">{emp?.department || '—'}</td>
                    <td className="table-td">{monthLabel(p.month)}</td>
                    <td className="table-td">{fmt(p.grossSalary)}</td>
                    <td className="table-td text-red-600">{fmt(p.totalDeductions)}</td>
                    <td className="table-td font-bold text-emerald-700">{fmt(p.netSalary)}</td>
                    <td className="table-td">
                      <span className={`badge ${p.status === 'approved' ? 'badge-green' : 'badge-yellow'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="table-td">
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/payroll/payslip/${p.id}`)}>
                        <FileText size={13} /> Payslip
                      </button>
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
