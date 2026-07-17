import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { todayStr, formatTime, minutesToHHMM, diffMinutes } from '../../utils/helpers';
import { LogIn, LogOut, Coffee, Clock, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function calcBreakMins(breaks = []) {
  return breaks.reduce((sum, b) => b.start && b.end ? sum + diffMinutes(b.start, b.end) : sum, 0);
}

function getStatus(record) {
  if (!record?.checkIn) return 'Not Checked In';
  if (record.checkOut) return 'Checked Out';
  if (record.breaks?.some(b => b.start && !b.end)) return 'On Break';
  return 'Working';
}

const STATUS_STYLES = {
  'Working':        'text-emerald-700 bg-emerald-50 border-emerald-200',
  'On Break':       'text-amber-700 bg-amber-50 border-amber-200',
  'Checked Out':    'text-gray-600 bg-gray-50 border-gray-200',
  'Not Checked In': 'text-red-600 bg-red-50 border-red-200',
};

export default function CheckInWidget({ attendancePath = '/attendance' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  const today = todayStr();
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE);
  const record = attendance.find(a => a.employeeId === user.id && a.date === today);
  const status = getStatus(record);
  const activeBreak = record?.breaks?.find(b => b.start && !b.end);
  const breakMins = calcBreakMins(record?.breaks);

  function save(updated) {
    const all = getStore(STORAGE_KEYS.ATTENDANCE);
    const idx = all.findIndex(a => a.employeeId === user.id && a.date === today);
    if (idx >= 0) all[idx] = updated; else all.push(updated);
    setStore(STORAGE_KEYS.ATTENDANCE, all);
    forceUpdate(n => n + 1);
  }

  function checkIn() {
    if (record?.checkIn) return;
    const now = new Date().toISOString();
    save({ employeeId: user.id, employeeName: `${user.firstName} ${user.lastName}`, department: user.department, date: today, checkIn: now, checkOut: null, breaks: [], workingHours: null });
    addLog('Attendance Check In', user.id, `${user.firstName} checked in`);
  }

  function checkOut() {
    if (!record?.checkIn || record.checkOut || activeBreak) return;
    const now = new Date().toISOString();
    const totalMins = diffMinutes(record.checkIn, now) - breakMins;
    save({ ...record, checkOut: now, workingHours: minutesToHHMM(totalMins) });
    addLog('Attendance Check Out', user.id, `${user.firstName} checked out`);
  }

  function breakIn() {
    if (!record?.checkIn || record.checkOut || activeBreak) return;
    const breaks = [...(record.breaks || []), { start: new Date().toISOString(), end: null }];
    save({ ...record, breaks });
    addLog('Break In', user.id, `${user.firstName} started break`);
  }

  function breakOut() {
    if (!activeBreak) return;
    const breaks = record.breaks.map(b => b.start === activeBreak.start ? { ...b, end: new Date().toISOString() } : b);
    save({ ...record, breaks });
    addLog('Break Out', user.id, `${user.firstName} ended break`);
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">Today's Attendance</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>{status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          ['Check In',      record?.checkIn  ? formatTime(record.checkIn)  : '—'],
          ['Check Out',     record?.checkOut ? formatTime(record.checkOut) : '—'],
          ['Break',         minutesToHHMM(breakMins)],
          ['Working Hours', record?.workingHours || '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[11px] text-gray-400 font-medium">{label}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={checkIn}
          disabled={!!record?.checkIn}
          className="btn btn-primary justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn size={14} /> Check In
        </button>
        <button
          onClick={checkOut}
          disabled={!record?.checkIn || !!record?.checkOut || !!activeBreak}
          className="btn btn-danger justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogOut size={14} /> Check Out
        </button>
        <button
          onClick={breakIn}
          disabled={!record?.checkIn || !!record?.checkOut || !!activeBreak}
          className="btn btn-secondary justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Coffee size={14} /> Break In
        </button>
        <button
          onClick={breakOut}
          disabled={!activeBreak}
          className="btn btn-secondary justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Clock size={14} /> Break Out
        </button>
      </div>

      <button
        onClick={() => navigate(attendancePath)}
        className="btn btn-secondary w-full gap-1.5 justify-center text-xs"
      >
        View Full Attendance <ArrowUpRight size={13} />
      </button>
    </div>
  );
}
