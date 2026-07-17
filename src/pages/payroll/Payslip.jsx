import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { Printer, Download, ArrowLeft } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function monthLabel(m) { if (!m) return ''; const [y, mo] = m.split('-'); return `${MONTHS[parseInt(mo) - 1]} ${y}`; }

export default function Payslip() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const payroll = getStore(STORAGE_KEYS.PAYROLLS).find(p => p.id === id);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const structures = getStore(STORAGE_KEYS.SALARY_STRUCTURES);

  if (!payroll) return <div className="card text-center py-10 text-gray-400">Payslip not found.</div>;

  const emp = employees.find(e => e.id === payroll.employeeId);
  const structure = structures.find(s => s.id === payroll.structureId);
  const totalBonus = payroll.bonuses?.reduce((s, b) => s + Number(b.amount), 0) || 0;
  const manualDed  = payroll.deductions?.reduce((s, d) => s + Number(d.amount), 0) || 0;

  const earnings = [
    ['Basic Salary',       structure?.basicSalary || 0],
    ['HRA',                structure?.hra || 0],
    ['Medical Allowance',  structure?.medicalAllowance || 0],
    ['Travel Allowance',   structure?.travelAllowance || 0],
    ['Special Allowance',  structure?.specialAllowance || 0],
    ['Other Allowances',   structure?.otherAllowances || 0],
    ...(payroll.bonuses?.map(b => [b.type, b.amount]) || []),
  ].filter(([, v]) => Number(v) > 0);

  const deductionRows = [
    ['Provident Fund (PF)', structure?.pf || 0],
    ['Professional Tax',    structure?.professionalTax || 0],
    ['Income Tax',          structure?.incomeTax || 0],
    ['ESI',                 structure?.esi || 0],
    ['Loan Deduction',      structure?.loanDeduction || 0],
    ['Other Deductions',    structure?.otherDeductions || 0],
    ...(payroll.deductions?.map(d => [d.type, d.amount]) || []),
  ].filter(([, v]) => Number(v) > 0);

  function print() {
    addLog('Payslip Printed', user.id, `Payslip printed for ${emp?.firstName} ${emp?.lastName} — ${payroll.month}`);
    window.print();
  }

  function download() {
    addLog('Payslip Downloaded', user.id, `Payslip downloaded for ${emp?.firstName} ${emp?.lastName} — ${payroll.month}`);
    window.print();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Actions — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <button className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex gap-2">
          <button className="btn-secondary btn btn-sm" onClick={print}><Printer size={14} /> Print</button>
          <button className="btn-primary btn btn-sm" onClick={download}><Download size={14} /> Download</button>
        </div>
      </div>

      {/* Payslip */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden" id="payslip">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">ATS</h1>
              <p className="text-indigo-200 text-xs mt-0.5">Applicant Tracking System</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">PAYSLIP</p>
              <p className="text-indigo-200 text-sm">{monthLabel(payroll.month)}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-6 pb-5 border-b border-gray-100">
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Details</p>
              {[
                ['Name',        `${emp?.firstName || ''} ${emp?.lastName || ''}`],
                ['Employee ID', emp?.id],
                ['Department',  emp?.department],
                ['Designation', emp?.designation],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-gray-400 w-28 flex-shrink-0">{k}</span>
                  <span className="font-medium text-gray-800">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payroll Details</p>
              {[
                ['Payroll Month', monthLabel(payroll.month)],
                ['Pay Date',      payroll.approvedAt ? new Date(payroll.approvedAt).toLocaleDateString() : '—'],
                ['Structure',     payroll.structureName],
                ['Status',        payroll.status],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-gray-400 w-28 flex-shrink-0">{k}</span>
                  <span className={`font-medium ${k === 'Status' ? (payroll.status === 'approved' ? 'text-emerald-600' : 'text-amber-600') : 'text-gray-800'} capitalize`}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Earnings</p>
              <div className="space-y-2">
                {earnings.map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Deductions</p>
              <div className="space-y-2">
                {deductionRows.map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-red-600">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-1">Gross Salary</p>
              <p className="text-xl font-bold text-gray-900">{fmt(payroll.grossSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Deductions</p>
              <p className="text-xl font-bold text-red-600">{fmt(payroll.totalDeductions)}</p>
            </div>
            <div className="bg-indigo-600 rounded-xl p-3">
              <p className="text-xs text-indigo-200 mb-1">Net Salary</p>
              <p className="text-xl font-bold text-white">{fmt(payroll.netSalary)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">This is a computer-generated payslip and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}
