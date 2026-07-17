import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../utils/store';
import Avatar from '../components/shared/Avatar';
import { Search, Mail, Phone } from 'lucide-react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function EmployeeDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDesig, setFilterDesig] = useState('');
  const [filterAlpha, setFilterAlpha] = useState('');

  const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.status === 'active');
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const designations = [...new Set(employees.map(e => e.designation).filter(Boolean))];

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    return (
      (!q || name.includes(q) || e.department?.toLowerCase().includes(q)) &&
      (!filterDept || e.department === filterDept) &&
      (!filterDesig || e.designation === filterDesig) &&
      (!filterAlpha || e.firstName?.toUpperCase().startsWith(filterAlpha))
    );
  });

  function handleView(emp) {
    const views = getStore(STORAGE_KEYS.PROFILE_VIEWS);
    views.unshift({ id: Date.now(), viewerId: user.id, viewerName: `${user.firstName} ${user.lastName}`, viewedId: emp.id, viewedName: `${emp.firstName} ${emp.lastName}`, department: emp.department, timestamp: new Date().toISOString() });
    setStore(STORAGE_KEYS.PROFILE_VIEWS, views);
    addLog('Profile View', user.id, `${user.firstName} viewed ${emp.firstName} ${emp.lastName}'s profile`);
    navigate(`/directory/${emp.id}`);
  }

  return (
    <div className="space-y-5">
      <h1 className="page-title">Employee Directory</h1>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="input w-auto" value={filterDesig} onChange={e => setFilterDesig(e.target.value)}>
            <option value="">All Designations</option>
            {designations.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setFilterAlpha('')} className={`px-2 py-1 text-xs rounded font-medium transition-colors ${!filterAlpha ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {ALPHABET.map(l => (
            <button key={l} onClick={() => setFilterAlpha(filterAlpha === l ? '' : l)}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${filterAlpha === l ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} employee{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="card hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar employee={emp} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-500">{emp.designation}</p>
                <p className="text-xs text-blue-600 font-medium">{emp.department}</p>
              </div>
              <div className="w-full space-y-1 text-xs text-gray-500">
                {emp.email && <div className="flex items-center gap-1.5 justify-center"><Mail size={11} />{emp.email}</div>}
                {emp.mobile && <div className="flex items-center gap-1.5 justify-center"><Phone size={11} />{emp.mobile}</div>}
              </div>
              <button className="btn-primary btn btn-sm w-full justify-center" onClick={() => handleView(emp)}>
                View Profile
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">No employees found.</div>
        )}
      </div>
    </div>
  );
}
