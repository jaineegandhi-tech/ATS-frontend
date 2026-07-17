import { useState } from 'react';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate } from '../../utils/helpers';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import { Check, X, Eye } from 'lucide-react';

export default function HRLeaveManagement() {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [approveForm, setApproveForm] = useState({ approvedDays: '', remarks: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [, forceUpdate] = useState(0);
  useStorageSync();

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const leaves = getStore(STORAGE_KEYS.LEAVES).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = leaves.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.employeeName?.toLowerCase().includes(q)) &&
      (!filterDept || l.department === filterDept) &&
      (!filterType || l.leaveType === filterType) &&
      (!filterStatus || l.status === filterStatus);
  });

  function handleApprove() {
    const all = getStore(STORAGE_KEYS.LEAVES);
    const updated = all.map(l => l.id === approveModal.id ? { ...l, status: 'approved', approvedDays: approveForm.approvedDays || l.days, remarks: approveForm.remarks } : l);
    setStore(STORAGE_KEYS.LEAVES, updated);
    addLog('Leave Approval', approveModal.employeeId, `Leave approved for ${approveModal.employeeName}`);
    setApproveModal(null);
    setApproveForm({ approvedDays: '', remarks: '' });
    forceUpdate(n => n + 1);
  }

  function handleReject() {
    if (!rejectReason.trim()) return alert('Please provide a rejection reason.');
    const all = getStore(STORAGE_KEYS.LEAVES);
    const updated = all.map(l => l.id === rejectModal.id ? { ...l, status: 'rejected', rejectionReason: rejectReason } : l);
    setStore(STORAGE_KEYS.LEAVES, updated);
    addLog('Leave Rejection', rejectModal.employeeId, `Leave rejected for ${rejectModal.employeeName}`);
    setRejectModal(null);
    setRejectReason('');
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title">Leave Management</h1>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <input className="input flex-1 min-w-48" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {['Annual Leave', 'Sick Leave', 'Casual Leave', 'Other'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {['pending', 'approved', 'rejected'].map(s => <option key={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee', 'Department', 'Leave Type', 'From', 'To', 'Days', 'Applied On', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-td text-center text-gray-400 py-8">No leave applications found.</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{l.employeeName}</td>
                  <td className="table-td">{l.department}</td>
                  <td className="table-td">{l.leaveType}</td>
                  <td className="table-td">{formatDate(l.fromDate)}</td>
                  <td className="table-td">{formatDate(l.toDate)}</td>
                  <td className="table-td">{l.days}</td>
                  <td className="table-td">{formatDate(l.appliedOn)}</td>
                  <td className="table-td"><StatusBadge status={l.status} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => setViewModal(l)} title="View"><Eye size={13} /></button>
                      {l.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => { setApproveModal(l); setApproveForm({ approvedDays: l.days, remarks: '' }); }} title="Approve"><Check size={13} /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => { setRejectModal(l); setRejectReason(''); }} title="Reject"><X size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewModal && (
        <Modal title="Leave Details" onClose={() => setViewModal(null)} size="sm">
          <div className="space-y-3 text-sm">
            {[['Employee', viewModal.employeeName], ['Department', viewModal.department], ['Leave Type', viewModal.leaveType], ['From', formatDate(viewModal.fromDate)], ['To', formatDate(viewModal.toDate)], ['Days', viewModal.days], ['Reason', viewModal.reason], ['Status', viewModal.status], ['Applied On', formatDate(viewModal.appliedOn)], viewModal.remarks && ['Remarks', viewModal.remarks], viewModal.rejectionReason && ['Rejection Reason', viewModal.rejectionReason]].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800 capitalize">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {approveModal && (
        <Modal title="Approve Leave" onClose={() => setApproveModal(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Approving leave for <strong>{approveModal.employeeName}</strong> ({approveModal.days} days requested)</p>
            <div>
              <label className="label">Approved Days</label>
              <input type="number" className="input" value={approveForm.approvedDays} onChange={e => setApproveForm(f => ({ ...f, approvedDays: e.target.value }))} min={1} max={approveModal.days} />
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea className="input resize-none" rows={2} value={approveForm.remarks} onChange={e => setApproveForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setApproveModal(null)}>Cancel</button>
              <button className="btn-success btn" onClick={handleApprove}>Approve</button>
            </div>
          </div>
        </Modal>
      )}

      {rejectModal && (
        <Modal title="Reject Leave" onClose={() => setRejectModal(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Rejecting leave for <strong>{rejectModal.employeeName}</strong></p>
            <div>
              <label className="label">Rejection Reason *</label>
              <textarea className="input resize-none" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason for rejection..." />
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn-danger btn" onClick={handleReject}>Reject</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
