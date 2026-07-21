import { useState } from 'react';
import { STORAGE_KEYS, addLog, getStore, setStore } from '../../utils/store';
import { useAuth } from '../../context/AuthContext';
import { ALL_MODULES, PERMISSION_KEYS, ROLE_LABELS, ROLES, fullName, isHeadHR } from '../../utils/roles';
import { Shield, UserPlus, KeyRound, UserX, Plus, X, Check, Pencil, Trash2, Eye, FilePlus, SquarePen, Eraser, SlidersHorizontal } from 'lucide-react';

const PERM_META = [
  { key: 'view',   label: 'View',   icon: Eye,        color: 'text-blue-500' },
  { key: 'add',    label: 'Add',    icon: FilePlus,   color: 'text-emerald-500' },
  { key: 'edit',   label: 'Edit',   icon: SquarePen,  color: 'text-amber-500' },
  { key: 'delete', label: 'Delete', icon: Eraser,     color: 'text-red-500' },
];

function emptyPerms() {
  const p = {};
  ALL_MODULES.forEach(m => { p[m.key] = { view: false, add: false, edit: false, delete: false }; });
  return p;
}

function migrateRole(role) {
  // Support old flat modules[] format
  if (!role.permissions && role.modules) {
    const p = {};
    ALL_MODULES.forEach(m => {
      p[m.key] = { view: role.modules.includes(m.key), add: false, edit: false, delete: false };
    });
    return { ...role, permissions: p };
  }
  // Ensure all modules exist in permissions
  const p = { ...role.permissions };
  ALL_MODULES.forEach(m => {
    if (!p[m.key]) p[m.key] = { view: false, add: false, edit: false, delete: false };
  });
  return { ...role, permissions: p };
}

export default function RolesPermissions() {
  const { user } = useAuth();
  const headHR = isHeadHR(user);

  const [users, setUsers] = useState(() => getStore(STORAGE_KEYS.EMPLOYEES));
  const [customRoles, setCustomRoles] = useState(() =>
    getStore(STORAGE_KEYS.CUSTOM_ROLES).map(migrateRole)
  );

  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: 'password123', role: ROLES.HR, department: 'Human Resources', status: 'active' });

  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newRolePerms, setNewRolePerms] = useState(emptyPerms);

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editPerms, setEditPerms] = useState({});

  // Per-user permission override modal
  const [permUser, setPermUser] = useState(null); // the user being edited
  const [userPerms, setUserPerms] = useState({});

  function saveUsers(next, action, details) {
    setUsers(next);
    setStore(STORAGE_KEYS.EMPLOYEES, next);
    addLog(action, user.id, details);
  }

  function saveRoles(next) {
    setCustomRoles(next);
    setStore(STORAGE_KEYS.CUSTOM_ROLES, next);
    window.dispatchEvent(new Event('hrms-data-updated'));
  }

  function addUser(e) {
    e.preventDefault();
    const id = `EMP${String(Date.now()).slice(-6)}`;
    const roleLabel = customRoles.find(r => r.id === userForm.role)?.label || ROLE_LABELS[userForm.role] || userForm.role;
    saveUsers([{ ...userForm, id, designation: roleLabel, profileCompleted: true }, ...users], 'User Added', `${fullName(user)} added ${userForm.firstName} ${userForm.lastName}`);
    setUserForm({ firstName: '', lastName: '', email: '', username: '', password: 'password123', role: ROLES.HR, department: 'Human Resources', status: 'active' });
    setShowAddUser(false);
  }

  function setStatus(id, status) {
    saveUsers(users.map(u => u.id === id ? { ...u, status } : u), status === 'inactive' ? 'User Deactivated' : 'User Activated', `${id} set to ${status}`);
  }

  function resetPassword(id) {
    saveUsers(users.map(u => u.id === id ? { ...u, password: 'password123' } : u), 'Password Reset', `${id} password reset`);
  }

  function updateUserRole(userId, newRole) {
    const roleLabel = customRoles.find(r => r.id === newRole)?.label || ROLE_LABELS[newRole] || newRole;
    saveUsers(users.map(u => u.id === userId ? { ...u, role: newRole, designation: roleLabel } : u), 'Role Updated', `${userId} role changed to ${newRole}`);
  }

  function togglePerm(perms, setPerms, moduleKey, permKey) {
    // If unchecking view, also uncheck add/edit/delete
    if (permKey === 'view' && perms[moduleKey].view) {
      setPerms(p => ({ ...p, [moduleKey]: { view: false, add: false, edit: false, delete: false } }));
    } else {
      // If checking add/edit/delete, auto-check view
      const autoView = ['add', 'edit', 'delete'].includes(permKey) && !perms[moduleKey].view;
      setPerms(p => ({ ...p, [moduleKey]: { ...p[moduleKey], ...(autoView ? { view: true } : {}), [permKey]: !p[moduleKey][permKey] } }));
    }
  }

  function createRole() {
    if (!newRoleLabel.trim()) return;
    const id = `role_${Date.now()}`;
    saveRoles([...customRoles, { id, label: newRoleLabel.trim(), permissions: newRolePerms, isSystem: false }]);
    setNewRoleLabel('');
    setNewRolePerms(emptyPerms());
    setShowNewRole(false);
  }

  function deleteRole(id) {
    if (!window.confirm('Delete this role? Users assigned to it will lose access.')) return;
    saveRoles(customRoles.filter(r => r.id !== id));
  }

  function startEdit(role) {
    setEditingRoleId(role.id);
    setEditPerms(JSON.parse(JSON.stringify(role.permissions)));
  }

  function saveEdit(roleId) {
    saveRoles(customRoles.map(r => r.id === roleId ? { ...r, permissions: editPerms } : r));
    setEditingRoleId(null);
  }

  function openUserPerms(u) {
    // Start from user's override if exists, else from their role permissions
    if (u.permissionOverrides) {
      setUserPerms(JSON.parse(JSON.stringify(u.permissionOverrides)));
    } else {
      const roleConfig = customRoles.find(r => r.id === u.role);
      const base = roleConfig?.permissions || {};
      const p = {};
      ALL_MODULES.forEach(m => {
        p[m.key] = { view: !!base[m.key]?.view, add: !!base[m.key]?.add, edit: !!base[m.key]?.edit, delete: !!base[m.key]?.delete };
      });
      setUserPerms(p);
    }
    setPermUser(u);
  }

  function saveUserPerms() {
    const next = users.map(u => u.id === permUser.id ? { ...u, permissionOverrides: userPerms } : u);
    saveUsers(next, 'User Permissions Updated', `${permUser.firstName} ${permUser.lastName} permissions updated`);
    // Update current user in localStorage if it's them
    const current = JSON.parse(localStorage.getItem('hrms_current_user'));
    if (current?.id === permUser.id) {
      localStorage.setItem('hrms_current_user', JSON.stringify({ ...current, permissionOverrides: userPerms }));
      window.dispatchEvent(new Event('hrms-data-updated'));
    }
    setPermUser(null);
  }

  function resetUserPerms(userId) {
    const next = users.map(u => u.id === userId ? { ...u, permissionOverrides: null } : u);
    saveUsers(next, 'User Permissions Reset', `${userId} permissions reset to role default`);
    setPermUser(null);
  }

  // Check if any permission is granted for a module in given perms
  function hasAnyPerm(perms, moduleKey) {
    return Object.values(perms[moduleKey] || {}).some(Boolean);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="text-xs text-body mt-1">Head HR manages roles, module access, and user accounts.</p>
        </div>
        {headHR && (
          <button className="btn btn-primary" onClick={() => { setShowAddUser(v => !v); setShowNewRole(false); }}>
            <UserPlus size={15} /> {showAddUser ? 'Cancel' : 'Add User'}
          </button>
        )}
      </div>

      {/* Add User inline form */}
      {showAddUser && headHR && (
        <div className="card border border-primary/20">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0 flex items-center gap-2"><UserPlus size={15} className="text-primary" /> New User</h2>
            <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <form onSubmit={addUser}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
              <div><label className="label">First Name</label><input className="input" value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
              <div><label className="label">Last Name</label><input className="input" value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="label">Username</label><input className="input" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} required /></div>
              <div><label className="label">Department</label><input className="input" value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} /></div>
              <div>
                <label className="label">Assign Role</label>
                <select className="input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  {customRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Check size={14} /> Create User</button>
            </div>
          </form>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0 flex items-center gap-2"><Shield size={15} className="text-primary" /> Permission Matrix</h2>
          {headHR && (
            <button className="btn btn-primary btn-sm" onClick={() => { setShowNewRole(v => !v); setShowAddUser(false); }}>
              {showNewRole ? 'Cancel' : <><Plus size={13} /> Create New Role</>}
            </button>
          )}
        </div>

        {/* New Role Form */}
        {showNewRole && headHR && (
          <div className="px-6 py-5 border-b border-gray-100 bg-surface">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 max-w-xs">
                <label className="label">Role Name</label>
                <input className="input" placeholder="e.g. Talent Sourcer" value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-5">
                <button className="btn btn-primary btn-sm" onClick={createRole} disabled={!newRoleLabel.trim()}>
                  <Check size={13} /> Create Role
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowNewRole(false); setNewRoleLabel(''); setNewRolePerms(emptyPerms()); }}>
                  Cancel
                </button>
              </div>
            </div>

            {/* New role permission grid */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th w-48">Module</th>
                    {PERM_META.map(p => (
                      <th key={p.key} className="table-th text-center w-20">
                        <span className={`flex items-center justify-center gap-1 ${p.color}`}>
                          <p.icon size={12} /> {p.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map(m => (
                    <tr key={m.key} className={hasAnyPerm(newRolePerms, m.key) ? 'bg-primary-light/20' : ''}>
                      <td className="table-td font-medium text-heading text-sm">{m.label}</td>
                      {PERM_META.map(p => (
                        <td key={p.key} className="table-td text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            checked={!!newRolePerms[m.key]?.[p.key]}
                            onChange={() => togglePerm(newRolePerms, setNewRolePerms, m.key, p.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing Roles Matrix — hidden when creating new role */}
        {!showNewRole && (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th w-40 sticky left-0 bg-surface z-10">Module</th>
                {customRoles.map(role => (
                  <th key={role.id} className="table-th text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-1.5">
                        {role.label}
                      </span>
                      {headHR && (
                        <div className="flex gap-1">
                          {editingRoleId === role.id ? (
                            <>
                              <button className="btn btn-xs btn-primary" onClick={() => saveEdit(role.id)}><Check size={10} /> Save</button>
                              <button className="btn btn-xs btn-secondary" onClick={() => setEditingRoleId(null)}><X size={10} /></button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-xs btn-secondary" onClick={() => startEdit(role)}><Pencil size={10} /></button>
                              {!role.isSystem && <button className="btn btn-xs btn-danger" onClick={() => deleteRole(role.id)}><Trash2 size={10} /></button>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((m, idx) => (
                <tr key={m.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface/50'}>
                  <td className="table-td font-medium text-heading text-sm sticky left-0 bg-inherit z-10 border-r border-gray-100">{m.label}</td>
                  {customRoles.map(role => {
                    const isEditing = editingRoleId === role.id;
                    const perms = isEditing ? editPerms : role.permissions;
                    const locked = role.id === ROLES.HEAD_HR;
                    const hasView = !!perms?.[m.key]?.view;
                    return (
                      <td key={role.id} className="px-2 py-3 text-center border-b border-gray-50">
                        {isEditing && !locked ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            checked={hasView}
                            onChange={() => togglePerm(editPerms, setEditPerms, m.key, 'view')}
                          />
                        ) : (
                          hasView
                            ? <Check size={13} className="text-primary mx-auto" />
                            : <span className="text-gray-200 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Users Table — hidden when creating new role */}
      {!showNewRole && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="section-title mb-0">User Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{['Name', 'Email', 'Username', 'Assigned Role', 'Department', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-td font-medium text-heading">{fullName(u)}</td>
                    <td className="table-td">{u.email}</td>
                    <td className="table-td text-xs font-mono">{u.username}</td>
                    <td className="table-td">
                      {headHR && u.id !== user.id ? (
                        <select className="input h-8 text-xs py-0 w-auto min-w-[120px]" value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}>
                          {customRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className="badge badge-blue">{customRoles.find(r => r.id === u.role)?.label || ROLE_LABELS[u.role] || u.role}</span>
                      )}
                    </td>
                    <td className="table-td">{u.department}</td>
                    <td className="table-td"><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                    <td className="table-td">
                      {headHR && (
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openUserPerms(u)}><SlidersHorizontal size={12} /> Permissions</button>
                          {u.id !== user.id && (
                            <button type="button" className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => setStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}>
                              <UserX size={12} /> {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-user Permissions Modal */}
      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-heading">User Permissions — {permUser.firstName} {permUser.lastName}</h2>
                <p className="text-xs text-body mt-0.5">These permissions apply only to this user and override their role defaults.</p>
              </div>
              <button onClick={() => setPermUser(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th w-48">Module</th>
                    {PERM_META.map(p => (
                      <th key={p.key} className="table-th text-center w-20">
                        <span className={`flex items-center justify-center gap-1 ${p.color}`}>
                          <p.icon size={12} /> {p.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map(m => (
                    <tr key={m.key} className={hasAnyPerm(userPerms, m.key) ? 'bg-primary-light/20' : ''}>
                      <td className="table-td font-medium text-heading text-sm">{m.label}</td>
                      {PERM_META.map(p => (
                        <td key={p.key} className="table-td text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            checked={!!userPerms[m.key]?.[p.key]}
                            onChange={() => togglePerm(userPerms, setUserPerms, m.key, p.key)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <button className="btn btn-secondary btn-sm" onClick={() => resetUserPerms(permUser.id)}>
                <KeyRound size={12} /> Reset to Role Default
              </button>
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={() => setPermUser(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveUserPerms}><Check size={14} /> Save Permissions</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
