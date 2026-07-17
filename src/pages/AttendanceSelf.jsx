import { useAuth } from '../context/AuthContext';
import { getStore, STORAGE_KEYS } from '../utils/store';
import { useStorageSync } from '../utils/useStorageSync';
import { formatTime, minutesToHHMM, diffMinutes, todayStr } from '../utils/helpers';
import CheckInWidget from '../components/shared/CheckInWidget';

function calcBreakMins(breaks = []) {
  return breaks.reduce((sum, b) => b.start && b.end ? sum + diffMinutes(b.start, b.end) : sum, 0);
}

const STATUS_STYLES = {
  Working:        'badge badge-green',
  'On Break':     'badge badge-yellow',
  'Checked Out':  'badge badge-gray',
  Absent:         'badge badge-red',
};

function getStatus(rec) {
  if (!rec?.checkIn) return 'Absent';
  if (rec.checkOut) return 'Checked Out';
  if (rec.breaks?.some(b => b.start && !b.end)) return 'On Break';
  return 'Working';
}

export default function AttendanceSelf() {
  const { user } = useAuth();
  useStorageSync();

  const history = getStore(STORAGE_KEYS.ATTENDANCE)
    .filter(a => a.employeeId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const today = todayStr();
  const monthStr = today.slice(0, 7);
  const monthRecords = history.filter(a => a.date.startsWith(monthStr));
  const presentDays = monthRecords.filter(a => a.checkIn).length;
  const totalHours = monthRecords.reduce((sum, a) => {
    if (!a.checkIn || !a.checkOut) return sum;
    return sum + diffMinutes(a.checkIn, a.checkOut) - calcBreakMins(a.breaks);
  }, 0);

  return (
    <div className="space-y-6">
      <h1 className="page-title">My Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CheckInWidget attendancePath="/my-attendance" />

        <div className="lg:col-span-2 grid grid-cols-3 gap-4 content-start">
          {[
            ['Days Present', presentDays, 'This Month'],
            ['Total Hours', minutesToHHMM(totalHours), 'This Month'],
            ['Days Absent', monthRecords.filter(a => !a.checkIn).length, 'This Month'],
          ].map(([label, val, sub]) => (
            <div key={label} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs font-semibold text-gray-700 mt-1">{label}</p>
              <p className="text-[11px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title mb-0">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Check In', 'Check Out', 'Break', 'Working Hours', 'Status'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.length === 0 ? (
                <tr><td colSpan={6} className="table-td text-center text-gray-400 py-10">No attendance records yet.</td></tr>
              ) : history.map(r => {
                const status = getStatus(r);
                return (
                  <tr key={r.date} className="hover:bg-gray-50/60 transition-colors">
                    <td className="table-td font-medium text-gray-900">{r.date}</td>
                    <td className="table-td">{r.checkIn  ? formatTime(r.checkIn)  : '—'}</td>
                    <td className="table-td">{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                    <td className="table-td">{minutesToHHMM(calcBreakMins(r.breaks))}</td>
                    <td className="table-td font-semibold">{r.workingHours || '—'}</td>
                    <td className="table-td"><span className={STATUS_STYLES[status] || 'badge badge-gray'}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
