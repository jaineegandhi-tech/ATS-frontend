import { useNavigate } from 'react-router-dom';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { Users, DollarSign, CheckCircle, Clock, Gift, Minus, FileText, ArrowUpRight } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, onClick }) {
  return (
    <div onClick={onClick} className={`card group ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${iconBg}`}><Icon size={18} className={iconColor} /></div>
        {onClick && <ArrowUpRight size={15} className="text-gray-300 group-hover:text-primary transition-colors" />}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PayrollDashboard() {
  useStorageSync();
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active');
  const payrolls  = getStore(STORAGE_KEYS.PAYROLLS);
  const bonuses   = getStore(STORAGE_KEYS.BONUSES);
  const deductions = getStore(STORAGE_KEYS.DEDUCTIONS);
  const empSalaries = getStore(STORAGE_KEYS.EMPLOYEE_SALARIES);

  const thisMonthPayrolls = payrolls.filter(p => p.month === currentMonth);
  const processed = thisMonthPayrolls.filter(p => p.status === 'approved');
  const pending   = thisMonthPayrolls.filter(p => p.status !== 'approved');
  const totalPayroll = processed.reduce((s, p) => s + (p.netSalary || 0), 0);
  const totalBonuses = bonuses.filter(b => b.payrollMonth === currentMonth).reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalDeductions = deductions.filter(d => d.payrollMonth === currentMonth).reduce((s, d) => s + Number(d.amount || 0), 0);

  const recentPayrolls = [...payrolls].sort((a, b) => b.createdAt?.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Payroll Dashboard</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">{monthLabel}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Employees"    value={employees.length}       iconBg="bg-violet-50"  iconColor="text-violet-600" onClick={() => navigate('/payroll/salaries')} />
        <StatCard icon={DollarSign}  label="Total Payroll"      value={fmt(totalPayroll)}       iconBg="bg-emerald-50" iconColor="text-emerald-600" sub={monthLabel} />
        <StatCard icon={CheckCircle} label="Payroll Processed"  value={processed.length}        iconBg="bg-blue-50"    iconColor="text-blue-600"   onClick={() => navigate('/payroll/history')} />
        <StatCard icon={Clock}       label="Pending Payroll"    value={pending.length}          iconBg="bg-amber-50"   iconColor="text-amber-600"  onClick={() => navigate('/payroll/process')} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Gift}        label="Total Bonuses"      value={fmt(totalBonuses)}       iconBg="bg-pink-50"    iconColor="text-pink-600"   sub={monthLabel} onClick={() => navigate('/payroll/bonuses')} />
        <StatCard icon={Minus}       label="Total Deductions"   value={fmt(totalDeductions)}    iconBg="bg-red-50"     iconColor="text-red-600"    sub={monthLabel} onClick={() => navigate('/payroll/bonuses')} />
        <StatCard icon={FileText}    label="Salary Structures"  value={getStore(STORAGE_KEYS.SALARY_STRUCTURES).length} iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={() => navigate('/payroll/structures')} />
      </div>

      {/* Recent Payroll */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Payroll Records</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/payroll/history')}>View All</button>
        </div>
        {recentPayrolls.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No payroll records yet. <button className="text-primary hover:underline" onClick={() => navigate('/payroll/process')}>Generate payroll</button></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">{['Employee','Department','Month','Gross','Deductions','Net','Status'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayrolls.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{emp ? `${emp.firstName} ${emp.lastName}` : p.employeeId}</td>
                      <td className="table-td">{emp?.department || '—'}</td>
                      <td className="table-td">{p.month}</td>
                      <td className="table-td">{fmt(p.grossSalary)}</td>
                      <td className="table-td text-red-600">{fmt(p.totalDeductions)}</td>
                      <td className="table-td font-semibold text-emerald-700">{fmt(p.netSalary)}</td>
                      <td className="table-td">
                        <span className={`badge ${p.status === 'approved' ? 'badge-green' : p.status === 'draft' ? 'badge-yellow' : 'badge-gray'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'approved' ? 'bg-emerald-500' : p.status === 'draft' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
