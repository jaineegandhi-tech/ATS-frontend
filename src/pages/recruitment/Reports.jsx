import { useState } from 'react';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { useAuth } from '../../context/AuthContext';
import { ROLES, fullName } from '../../utils/roles';
import { BarChart3, Download, Funnel, TrendingUp, Users, ChevronDown } from 'lucide-react';

const PIE_COLORS = ['#0B5ED7','#10b981','#f59e0b','#ef4444','#6366f1','#ec4899','#14b8a6','#f97316'];

function PieChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-body text-center py-8">No data available.</p>;

  const cx = 120, cy = 120, r = 90, ir = 50;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + ir * Math.cos(angle);
    const iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + sweep);
    const iy2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const midAngle = angle + sweep / 2;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    const slice = { path, color: PIE_COLORS[i % PIE_COLORS.length], midAngle, ...d };
    angle += sweep;
    return slice;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="240" height="240" viewBox="0 0 240 240">
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === i ? 1 : 0.4}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center label */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs" fill="#1A1A1A" fontSize="13" fontWeight="700">
            {hovered !== null ? slices[hovered].value : total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#5F6B7A" fontSize="10">
            {hovered !== null ? slices[hovered].label : 'Total'}
          </text>
        </svg>
        {/* Tooltip */}
        {hovered !== null && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-heading text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap pointer-events-none shadow-lg">
            {slices[hovered].label}: <strong>{slices[hovered].value}</strong> candidates
            <span className="ml-1 opacity-60">({Math.round((slices[hovered].value / total) * 100)}%)</span>
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-body">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  useStorageSync();
  const { user } = useAuth();
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const interviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const hrs = employees.filter(e => [ROLES.HEAD_HR, ROLES.HR].includes(e.role));
  const visibleHrs = user.role === ROLES.HR ? hrs.filter(hr => hr.id === user.id) : hrs;
  const stages = ['New Candidate', 'Interview Scheduled', 'Passed', 'Selected', 'Offer Sent', 'Joined', 'Rejected'];

  // Build pie data directly from all candidates grouped by assignedTo or createdBy
  const pieData = (() => {
    const map = {};
    candidates.filter(c => c.status !== 'archived').forEach(c => {
      const ownerId = c.assignedTo || c.createdBy;
      if (!ownerId) return;
      const emp = employees.find(e => e.id === ownerId);
      if (!emp || ![ROLES.HEAD_HR, ROLES.HR].includes(emp.role)) return;
      const name = fullName(emp);
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  })();

  const rows = visibleHrs.map(hr => {
    const owned = candidates.filter(c => c.createdBy === hr.id || c.assignedTo === hr.id);
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

  const [exportOpen, setExportOpen] = useState(false);

  const maxOffered = Math.max(1, ...rows.map(r => r.offered));

  function exportExcel() {
    const headers = ['HR Name','Candidates Added','Interviews Scheduled','Candidates Selected','Candidates Offered','Candidates Joined','Conversion Rate'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        fullName(r.hr), r.added, r.scheduled, r.selected, r.offered, r.joined, `${r.conversion}%`
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recruitment_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function exportPDF() {
    const win = window.open('', '_blank');
    const tableRows = rows.map(r => `
      <tr>
        <td>${fullName(r.hr)}</td><td>${r.added}</td><td>${r.scheduled}</td>
        <td>${r.selected}</td><td>${r.offered}</td><td>${r.joined}</td><td>${r.conversion}%</td>
      </tr>`).join('');
    win.document.write(`
      <html><head><title>Recruitment Report</title>
      <style>
        body { font-family: Inter, sans-serif; padding: 32px; color: #1A1A1A; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { font-size: 12px; color: #5F6B7A; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #F5F8FC; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #5F6B7A; border-bottom: 1px solid #E8EDF3; }
        td { padding: 10px 12px; border-bottom: 1px solid #F0F4F8; }
      </style></head>
      <body>
        <h1>Recruitment Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <table>
          <thead><tr><th>HR Name</th><th>Added</th><th>Scheduled</th><th>Selected</th><th>Offered</th><th>Joined</th><th>Conversion</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body></html>`);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-xs text-gray-400 mt-1">{user.role === ROLES.HR ? 'Your recruitment performance' : 'Organization-wide recruitment performance'}</p>
        </div>
        <div className="relative">
          <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setExportOpen(o => !o)}>
            <Download size={13} /> Export <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-modal z-50 py-1" onMouseLeave={() => setExportOpen(false)}>
              <button className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface flex items-center gap-2" onClick={() => { exportExcel(); setExportOpen(false); }}>
                <Download size={13} /> Excel (.csv)
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface flex items-center gap-2" onClick={() => { exportPDF(); setExportOpen(false); }}>
                <Download size={13} /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie Chart — Candidates by HR */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-primary" /><h2 className="section-title mb-0">Candidates by HR</h2></div>
          <PieChart data={pieData} />
        </div>

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
