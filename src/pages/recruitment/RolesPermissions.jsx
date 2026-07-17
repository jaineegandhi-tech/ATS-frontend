import { useState } from 'react';
import { STORAGE_KEYS, addLog, getStore, setStore } from '../../utils/store';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES, fullName } from '../../utils/roles';
import { Shield, KeyRound, UserPlus, UserX } from 'lucide-react';

const MODULES = ['Dashboard', 'Job Openings', 'Candidates', 'Interview Calendar', 'Interview Schedule', 'Approvals', 'Reports', 'Pipeline', 'Roles & Permissions'];
const PERMS = ['View', 'Create', 'Edit', 'Delete', 'Approve'];

export default function RolesPermissions() {
  const { user } = useAuth();
  const [users, setUsers] = useState(() => getStore(STORAGE_KEYS.EMPLOYEES));
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: 'password123', role: ROLES.HR, department: 'Human Resources', status: 'active' });

  function saveUsers(next, action, details) {
    setUsers(next);
    setStore(STORAGE_KEYS.EMPLOYEES, next);
    addLog(action, user.id, details);
  }

  function addUser(e) {
    e.preventDefault();
    const id = `EMP${String(Date.now()).slice(-6)}`;
    saveUsers([{ ...form, id, designation: ROLE_LABELS[form.role], profileCompleted: true }, ...users], 'User Added', `${fullName(user)} added ${form.firstName} ${form.lastName}`);
    setForm(f => ({ ...f, firstName: '', lastName: '', email: '', username: '' }));
  }

  function setStatus(id, status) {
    saveUsers(users.map(u => u.id === id ? { ...u, status } : u), status === 'inactive' ? 'User Deactivated' : 'User Activated', `${id} set to ${status}`);
  }

  function resetPassword(id) {
    saveUsers(users.map(u => u.id === id ? { ...u, password: 'password123' } : u), 'Password Reset', `${id} password reset`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Roles & Permissions</h1>
        <p className="text-xs text-gray-400 mt-1">Head HR manages user accounts and the ATS permission model.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-primary" /><h2 className="section-title mb-0">Permission Matrix</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th">Role</th>{MODULES.map(m => <th key={m} className="table-th">{m}</th>)}</tr></thead>
              <tbody>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <tr key={role}>
                    <td className="table-td font-medium">{label}</td>
                    {MODULES.map(m => {
                      const allowed =
                        role === ROLES.HEAD_HR ||
                        (role === ROLES.HR && !['Roles & Permissions'].includes(m)) ||
                        (role === ROLES.INTERVIEWER && ['Dashboard', 'Candidates', 'Interview Calendar', 'Interview Schedule', 'Pipeline'].includes(m)) ||
                        (role === ROLES.RECEPTIONIST && ['Dashboard', 'Approvals', 'Pipeline'].includes(m)) ||
                        (role === ROLES.IT && ['Dashboard', 'Candidates', 'Pipeline'].includes(m));
                      return <td key={m} className="table-td">{allowed ? <span className="badge badge-green">{role === ROLES.HEAD_HR ? 'Full' : 'View/Action'}</span> : <span className="text-gray-300">-</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4">Permission dimensions: {PERMS.join(', ')}.</p>
        </div>

        <form onSubmit={addUser} className="card space-y-3">
          <div className="flex items-center gap-2"><UserPlus size={16} className="text-primary" /><h2 className="section-title mb-0">Add User</h2></div>
          <input className="input" placeholder="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
          <input className="input" placeholder="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
          <input className="input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <input className="input" placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="btn-primary btn w-full" type="submit">Add User</button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['Name', 'Email', 'Username', 'Assigned Role', 'Department', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="table-td font-medium">{fullName(u)}</td>
                <td className="table-td">{u.email}</td>
                <td className="table-td">{u.username}</td>
                <td className="table-td">{ROLE_LABELS[u.role] || u.role}</td>
                <td className="table-td">{u.department}</td>
                <td className="table-td"><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => resetPassword(u.id)}><KeyRound size={13} /> Reset</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => setStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}><UserX size={13} /> {u.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
