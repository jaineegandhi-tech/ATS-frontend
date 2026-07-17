import { useState } from 'react';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { formatDate, formatTime, todayStr, diffMinutes, minutesToHHMM } from '../../utils/helpers';
import Modal from '../../components/shared/Modal';
import { Search, Pencil, Plus } from 'lucide-react';

export default function HRAttendance() {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDate, setFilterDate] = useState(todayStr());
  const [editRecord, setEditRecord] = useState(null);
  const [manualForm, setManualForm] = useState(null);
  const [, forceUpdate] = useState(0);
  useStorageSync();

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE);
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const dateRecords = attendance.filter(a => !filterDate || a.date === filterDate);

  const rows = employees.filter(e => {
    const q = search.toLowerCase();
    return (!q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)) &&
      (!filterDept || e.department === filterDept);
  }).map(emp => {
    const rec = dateRecords.find(a => a.employeeId === emp.id);
    return { emp, rec };
  });

  function saveEdit() {
    const all = getStore(STORAGE_KEYS.ATTENDANCE);
    const idx = all.findIndex(a => a.employeeId === editRecord.employeeId && a.date === editRecord.date);
    const updated = { ...editRecord };
    if (updated.checkIn && updated.checkOut) {
      const breakMins = (updated.breaks || []).reduce((s, b) => b.start && b.end ? s + diffMinutes(b.start, b.end) : s, 0);
      updated.workingHours = minutesToHHMM(diffMinutes(updated.checkIn, updated.checkOut) - breakMins);
    }
    if (idx >= 0) all[idx] = updated; else all.push(updated);
    setStore(STORAGE_KEYS.ATTENDANCE, all);
    addLog('Attendance Edit', updated.employeeId, `HR edited attendance for ${updated.employeeName}`);
    setEditRecord(null);
    forceUpdate(n => n + 1);
  }

  function saveManual() {
    const all = getStore(STORAGE_KEYS.ATTENDANCE);
    const emp = employees.find(e => e.id === manualForm.employeeId);
    const checkInISO = manualForm.date && manualForm.checkInTime ? `${manualForm.date}T${manualForm.checkInTime}:00` : null;
    const checkOutISO = manualForm.date && manualForm.checkOutTime ? `${manualForm.date}T${manualForm.checkOutTime}:00` : null;
    const workingHours = checkInISO && checkOutISO ? minutesToHHMM(diffMinutes(checkInISO, checkOutISO)) : null;
    const record = { employeeId: manualForm.employeeId, employeeName: `${emp.firstName} ${emp.lastName}`, department: emp.department, date: manualForm.date, checkIn: checkInISO, checkOut: checkOutISO, breaks: [], workingHours };
    const idx = all.findIndex(a => a.employeeId === manualForm.employeeId && a.date === manualForm.date);
    if (idx >= 0) all[idx] = record; else all.push(record);
    setStore(STORAGE_KEYS.ATTENDANCE, all);
    addLog('Manual Attendance', manualForm.employeeId, `HR added manual attendance for ${emp.firstName} ${emp.lastName}`);
    setManualForm(null);
    forceUpdate(n => n + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Attendance Management</h1>
        <button className="btn-primary btn" onClick={() => setManualForm({ employeeId: '', date: todayStr(), checkInTime: '', checkOutTime: '' })}>
          <Plus size={16} /> Manual Entry
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <input type="date" className="input w-auto" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Employee', 'Department', 'Check In', 'Check Out', 'Break', 'Working Hours', 'Status', 'Actions'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(({ emp, rec }) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{emp.firstName} {emp.lastName}</td>
                  <td className="table-td">{emp.department}</td>
                  <td className="table-td">{rec?.checkIn ? formatTime(rec.checkIn) : '—'}</td>
                  <td className="table-td">{rec?.checkOut ? formatTime(rec.checkOut) : '—'}</td>
                  <td className="table-td">{rec?.breaks ? minutesToHHMM(rec.breaks.reduce((s, b) => b.start && b.end ? s + diffMinutes(b.start, b.end) : s, 0)) : '—'}</td>
                  <td className="table-td">{rec?.workingHours || '—'}</td>
                  <td className="table-td">
                    <span className={`badge ${rec?.checkIn ? (rec.checkOut ? 'badge-gray' : 'badge-green') : 'badge-red'}`}>
                      {rec?.checkIn ? (rec.checkOut ? 'Checked Out' : 'Present') : 'Absent'}
                    </span>
                  </td>
                  <td className="table-td">
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditRecord(rec || { employeeId: emp.id, employeeName: `${emp.firstName} ${emp.lastName}`, department: emp.department, date: filterDate || todayStr(), checkIn: null, checkOut: null, breaks: [] })}>
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editRecord && (
        <Modal title="Edit Attendance" onClose={() => setEditRecord(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Editing: <strong>{editRecord.employeeName}</strong> — {editRecord.date}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Check In Time</label>
                <input type="time" className="input" value={editRecord.checkIn ? new Date(editRecord.checkIn).toTimeString().slice(0, 5) : ''}
                  onChange={e => setEditRecord(r => ({ ...r, checkIn: e.target.value ? `${r.date}T${e.target.value}:00` : null }))} />
              </div>
              <div>
                <label className="label">Check Out Time</label>
                <input type="time" className="input" value={editRecord.checkOut ? new Date(editRecord.checkOut).toTimeString().slice(0, 5) : ''}
                  onChange={e => setEditRecord(r => ({ ...r, checkOut: e.target.value ? `${r.date}T${e.target.value}:00` : null }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setEditRecord(null)}>Cancel</button>
              <button className="btn-primary btn" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </Modal>
      )}

      {manualForm && (
        <Modal title="Manual Attendance Entry" onClose={() => setManualForm(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Employee</label>
              <select className="input" value={manualForm.employeeId} onChange={e => setManualForm(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Check In</label><input type="time" className="input" value={manualForm.checkInTime} onChange={e => setManualForm(f => ({ ...f, checkInTime: e.target.value }))} /></div>
              <div><label className="label">Check Out</label><input type="time" className="input" value={manualForm.checkOutTime} onChange={e => setManualForm(f => ({ ...f, checkOutTime: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary btn" onClick={() => setManualForm(null)}>Cancel</button>
              <button className="btn-primary btn" onClick={saveManual} disabled={!manualForm.employeeId || !manualForm.date}>Save Entry</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
