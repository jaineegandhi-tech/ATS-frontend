import { useState } from 'react';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import { formatDate, formatTime } from '../../utils/helpers';
import { Eye, TrendingUp } from 'lucide-react';

export default function ProfileVisitors() {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const views = getStore(STORAGE_KEYS.PROFILE_VIEWS);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filtered = views.filter(v => {
    const q = search.toLowerCase();
    const dateStr = v.timestamp?.split('T')[0];
    return (!q || v.viewerName?.toLowerCase().includes(q) || v.viewedName?.toLowerCase().includes(q)) &&
      (!filterDept || v.department === filterDept) &&
      (!filterDate || dateStr === filterDate);
  });

  const mostViewed = employees.map(emp => ({
    emp,
    count: views.filter(v => v.viewedId === emp.id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Profile Visitors</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary">{views.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Profile Views</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{new Set(views.map(v => v.viewedId)).size}</p>
          <p className="text-sm text-gray-500 mt-1">Profiles Viewed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{new Set(views.map(v => v.viewerId)).size}</p>
          <p className="text-sm text-gray-500 mt-1">Unique Visitors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="section-title mb-0">Visitor Log</h2>
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-3">
              <input className="input flex-1 min-w-40" placeholder="Search visitor or profile..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
              <input type="date" className="input w-auto" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Viewer', 'Viewed Profile', 'Department', 'Date', 'Time'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="table-td text-center text-gray-400 py-8">No profile views recorded.</td></tr>
                ) : filtered.slice(0, 50).map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{v.viewerName}</td>
                    <td className="table-td">{v.viewedName}</td>
                    <td className="table-td">{v.department}</td>
                    <td className="table-td">{formatDate(v.timestamp)}</td>
                    <td className="table-td">{formatTime(v.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="section-title mb-0">Most Viewed</h2>
          </div>
          <div className="space-y-3">
            {mostViewed.filter(m => m.count > 0).map(({ emp, count }, i) => (
              <div key={emp.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500">{emp.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Eye size={13} />{count}
                </div>
              </div>
            ))}
            {mostViewed.every(m => m.count === 0) && <p className="text-sm text-gray-400">No views yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
