import { getStore, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { useAuth } from '../../context/AuthContext';
import { ROLES, fullName } from '../../utils/roles';
import { BarChart3, Download, Filter, Funnel, TrendingUp } from 'lucide-react';

export default function Reports() {
  useStorageSync();
  const { user } = useAuth();
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const hrs = employees.filter(e => [ROLES.HEAD_HR, ROLES.HR].includes(e.role));
  const visibleHrs = user.role === ROLES.HR ? hrs.filter(hr => hr.id === user.id) : hrs;
  const stages = ['New Candidate', 'Interview Scheduled', 'Passed', 'Selected', 'Offer Sent', 'Joined', 'Rejected'];

  const rows = visibleHrs.map(hr => {
    const owned = candidates.filter(c => c.createdBy === hr.id || (!c.createdBy && hr.role === ROLES.HEAD_HR));
    const offered = owned.filter(c => ['Offer Sent', 'Offer Accepted', 'Offered', 'Joined'].includes(c.status)).length;
    const joined = owned.filter(c => c.status === 'Joined').length;
    const selected = owned.filter(c => ['Selected', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(c.status)).length;
    return {
      hr,
      added: owned.length,
      scheduled: interviews.filter(iv => owned.some(c => c.id === iv.candidateId)).length,
      selected,
      offered,
      joined,
      conversion: owned.length ? Math.round((offered / owned.length) * 100) : 0,
      tth: joined ? 18 : 0,
    };
  });

  const maxOffered = Math.max(1, ...rows.map(r => r.offered));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-xs text-gray-400 mt-1">{user.role === ROLES.HR ? 'Your recruitment performance' : 'Organization-wide recruitment performance'}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn"><Filter size={14} /> Apply Filters</button>
          <button className="btn-secondary btn"><Download size={14} /> Export to Excel</button>
          <button className="btn-primary btn"><Download size={14} /> Export to PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-primary" /><h2 className="section-title mb-0">HR-wise Candidates Offered</h2></div>
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.hr.id}>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-600">{fullName(r.hr)}</span><span>{r.offered}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(r.offered / maxOffered) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><Funnel size={16} className="text-primary" /><h2 className="section-title mb-0">Recruitment Funnel</h2></div>
          <div className="grid grid-cols-2 gap-2">
            {stages.map(stage => (
              <div key={stage} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">{stage}</p>
                <p className="text-xl font-bold text-gray-900">{candidates.filter(c => c.status === stage).length}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>{['HR Name', 'Candidates Added', 'Interviews Scheduled', 'Candidates Selected', 'Candidates Offered', 'Candidates Joined', 'Conversion Rate', 'Avg. Time-to-Hire'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.hr.id}>
                <td className="table-td font-medium">{fullName(r.hr)}</td>
                <td className="table-td">{r.added}</td>
                <td className="table-td">{r.scheduled}</td>
                <td className="table-td">{r.selected}</td>
                <td className="table-td">{r.offered}</td>
                <td className="table-td">{r.joined}</td>
                <td className="table-td"><span className="badge badge-blue"><TrendingUp size={12} /> {r.conversion}%</span></td>
                <td className="table-td">{r.tth || '-'} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
