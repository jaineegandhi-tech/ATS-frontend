import { useAuth } from '../context/AuthContext';
import { getStore, STORAGE_KEYS } from '../utils/store';
import { useStorageSync } from '../utils/useStorageSync';
import { formatDate, todayStr } from '../utils/helpers';
import { Users, ClipboardCheck, CalendarDays, UserCheck, ArrowUpRight, Palmtree } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CheckInWidget from '../components/shared/CheckInWidget';

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TYPE_COLORS = {
  'National Holiday':  { chip: 'bg-blue-50 border-blue-200 text-blue-800',       dot: 'bg-blue-500'   },
  'Company Holiday':   { chip: 'bg-violet-50 border-violet-200 text-violet-800', dot: 'bg-violet-500' },
  'Regional Holiday':  { chip: 'bg-amber-50 border-amber-200 text-amber-800',    dot: 'bg-amber-500'  },
  'Optional Holiday':  { chip: 'bg-teal-50 border-teal-200 text-teal-800',       dot: 'bg-teal-500'   },
};
function typeStyle(type) { return TYPE_COLORS[type] || TYPE_COLORS['Optional Holiday']; }
function dayName(ds) { return DAYS_SHORT[new Date(ds + 'T00:00:00').getDay()]; }
function daysLeft(ds, today) { return Math.ceil((new Date(ds + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000); }

function StatCard({ icon: Icon, label, value, iconBg, iconColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card group ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        {onClick && <ArrowUpRight size={15} className="text-gray-300 group-hover:text-primary transition-colors" />}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function UpcomingHolidays({ upcomingHolidays, today, navigate }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">Upcoming Holidays</h2>
        <button onClick={() => navigate('/holidays')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          View all <ArrowUpRight size={12} />
        </button>
      </div>
      {upcomingHolidays.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No upcoming holidays.</p>
      ) : (
        <div className="space-y-2">
          {upcomingHolidays.map(h => {
            const s = typeStyle(h.type);
            const dl = daysLeft(h.date, today);
            return (
              <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border ${s.chip}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.dot} text-white`}>
                  <Palmtree size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{h.name}</p>
                  <p className="text-xs opacity-70">{h.date} · {dayName(h.date)} · {h.type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{dl === 0 ? 'Today' : `${dl}d`}</p>
                  <p className="text-[10px] opacity-60">{dl > 0 ? 'away' : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHR = user?.role === 'hr';
  useStorageSync();

  const employees = getStore(STORAGE_KEYS.EMPLOYEES).filter(e => e.role !== 'hr');
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE);
  const leaves = getStore(STORAGE_KEYS.LEAVES);
  const today = todayStr();

  const presentToday = attendance.filter(a => a.date === today && a.checkIn).length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  const myLeaves = leaves.filter(l => l.employeeId === user?.id);
  const myBalances = getStore(STORAGE_KEYS.LEAVE_BALANCES)[user?.id] || {};
  const logs = getStore(STORAGE_KEYS.ACTIVITY_LOGS).slice(0, 8);

  const monthStr = today.slice(0, 7);
  const monthPresent = getStore(STORAGE_KEYS.ATTENDANCE).filter(a => a.employeeId === user?.id && a.date?.startsWith(monthStr)).length;

  const upcomingHolidays = getStore(STORAGE_KEYS.HOLIDAYS)
    .filter(h => h.status === 'active' && h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(new Date().toISOString())} · {user?.role === 'hr' ? 'HR / Management' : user?.designation}</p>
        </div>
      </div>

      {isHR ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}          label="Total Employees"  value={employees.length}  iconBg="bg-violet-50"  iconColor="text-violet-600" onClick={() => navigate('/employees')} />
            <StatCard icon={ClipboardCheck} label="Present Today"    value={presentToday}      iconBg="bg-emerald-50" iconColor="text-emerald-600" onClick={() => navigate('/attendance')} />
            <StatCard icon={CalendarDays}   label="Pending Leaves"   value={pendingLeaves}     iconBg="bg-amber-50"   iconColor="text-amber-600"  onClick={() => navigate('/leave-management')} />
            <StatCard icon={UserCheck}      label="Active Employees" value={activeEmployees}   iconBg="bg-blue-50"    iconColor="text-blue-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Recent Activity</h2>
                <span className="text-xs text-gray-400">{logs.length} events</span>
              </div>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet.</p>
              ) : (
                <div className="space-y-0">
                  {logs.map((log, i) => (
                    <div key={log.id} className={`flex items-center justify-between py-3 ${i < logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/40 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{log.action}</p>
                          <p className="text-xs text-gray-400">{log.details}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <CheckInWidget attendancePath="/attendance" />
              <UpcomingHolidays upcomingHolidays={upcomingHolidays} today={today} navigate={navigate} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={ClipboardCheck} label="Days Present (Month)" value={monthPresent}                                     iconBg="bg-emerald-50" iconColor="text-emerald-600" onClick={() => navigate('/attendance')} />
            <StatCard icon={CalendarDays}   label="Pending Leaves"       value={myLeaves.filter(l => l.status === 'pending').length} iconBg="bg-amber-50"   iconColor="text-amber-600"  onClick={() => navigate('/leave')} />
            <StatCard icon={UserCheck}      label="Annual Leave Balance"  value={myBalances['Annual'] ?? 0}                          iconBg="bg-blue-50"    iconColor="text-blue-600"   onClick={() => navigate('/leave')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <CheckInWidget attendancePath="/my-attendance" />

            <div className="card">
              <h2 className="section-title">Leave Balances</h2>
              {Object.keys(myBalances).length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No leave balance assigned yet.</p>
              ) : (
                <div className="space-y-0">
                  {Object.entries(myBalances).map(([type, days], i, arr) => (
                    <div key={type} className={`flex justify-between items-center py-2.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <span className="text-xs text-gray-500 font-medium">{type} Leave</span>
                      <span className="text-sm font-bold text-gray-900">{days} <span className="font-normal text-gray-400">days</span></span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn-primary btn btn-sm mt-4" onClick={() => navigate('/leave')}>
                Apply Leave <ArrowUpRight size={13} />
              </button>
            </div>

            <UpcomingHolidays upcomingHolidays={upcomingHolidays} today={today} navigate={navigate} />
          </div>
        </>
      )}
    </div>
  );
}
