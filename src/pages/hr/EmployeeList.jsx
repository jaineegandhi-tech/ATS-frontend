import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { formatDate } from '../../utils/helpers';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { Plus, Search, Eye, Pencil, UserX, UserCheck, SlidersHorizontal } from 'lucide-react';

export default function EmployeeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [, forceUpdate] = useState(0);

  const allEmployees = getStore(STORAGE_KEYS.EMPLOYEES);
  const departments = [...new Set(allEmployees.map(e => e.department).filter(Boolean))];

  const filtered = allEmployees.filter(e => {
    const q = search.toLowerCase();
    return (
      (!q || `${e.firstName} ${e.lastName} ${e.username} ${e.department} ${e.designation}`.toLowerCase().includes(q)) &&
      (!filterDept || e.department === filterDept) &&
      (!filterStatus || e.status === filterStatus)
    );
  });

  function handleDeactivate() {
    const all = getStore(STORAGE_KEYS.EMPLOYEES);
    const updated = all.map(e => e.id === deactivateTarget.id
      ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e);
    setStore(STORAGE_KEYS.EMPLOYEES, updated);
    addLog('Employee Status Changed', deactivateTarget.id, `${deactivateTarget.firstName} ${deactivateTarget.lastName} status changed`);
    setDeactivateTarget(null);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {allEmployees.length} employees</p>
        </div>
        <button className="btn-primary btn" onClick={() => navigate('/employees/add')}>
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 input-sm" placeholder="Search by name, username, department…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select className="input w-auto input-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="input w-auto input-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Employee', 'Username', 'Department', 'Designation', 'Role', 'Status', 'Joining Date', 'Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-td text-center text-gray-400 py-12">
                    <Search size={28} className="mx-auto mb-2 text-gray-200" />
                    No employees found.
                  </td>
                </tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <Avatar employee={emp} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-400">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-gray-500">{emp.username}</td>
                  <td className="table-td">{emp.department || '—'}</td>
                  <td className="table-td">{emp.designation || '—'}</td>
                  <td className="table-td">
                    <span className="badge badge-purple capitalize">{emp.role}</span>
                  </td>
                  <td className="table-td"><StatusBadge status={emp.status} /></td>
                  <td className="table-td text-gray-500">{formatDate(emp.joiningDate)}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <button className="btn btn-xs btn-secondary" title="View" onClick={() => navigate(`/employees/${emp.id}`)}>
                        <Eye size={12} />
                      </button>
                      <button className="btn btn-xs btn-secondary" title="Edit" onClick={() => navigate(`/employees/${emp.id}/edit`)}>
                        <Pencil size={12} />
                      </button>
                      <button
                        className={`btn btn-xs ${emp.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => setDeactivateTarget(emp)}
                      >
                        {emp.status === 'active' ? <UserX size={12} /> : <UserCheck size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deactivateTarget && (
        <ConfirmDialog
          title={deactivateTarget.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
          message={`Are you sure you want to ${deactivateTarget.status === 'active' ? 'deactivate' : 'activate'} ${deactivateTarget.firstName} ${deactivateTarget.lastName}?`}
          confirmLabel={deactivateTarget.status === 'active' ? 'Deactivate' : 'Activate'}
          confirmClass={deactivateTarget.status === 'active' ? 'btn-danger' : 'btn-success'}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
