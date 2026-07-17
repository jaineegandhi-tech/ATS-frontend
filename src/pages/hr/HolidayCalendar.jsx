import { useState } from 'react';
import { getStore, setStore, STORAGE_KEYS, addHolidayNotification } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import Modal from '../../components/shared/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import StatusBadge from '../../components/shared/StatusBadge';
import { CalendarDays, Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, List, Calendar } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOLIDAY_TYPES = ['National Holiday','Company Holiday','Regional Holiday','Optional Holiday'];
const TYPE_COLORS = {
  'National Holiday':  { chip: 'bg-blue-50 border-blue-200 text-blue-800',   dot: 'bg-blue-500',   bar: 'bg-blue-500'   },
  'Company Holiday':   { chip: 'bg-violet-50 border-violet-200 text-violet-800', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  'Regional Holiday':  { chip: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500',  bar: 'bg-amber-500'  },
  'Optional Holiday':  { chip: 'bg-teal-50 border-teal-200 text-teal-800',   dot: 'bg-teal-500',   bar: 'bg-teal-500'   },
};

function typeStyle(type) { return TYPE_COLORS[type] || TYPE_COLORS['Optional Holiday']; }

const EMPTY = { name: '', date: '', type: 'National Holiday', description: '', repeatEveryYear: false, status: 'active' };

function dayName(dateStr) {
  if (!dateStr) return '';
  return DAYS_SHORT[new Date(dateStr + 'T00:00:00').getDay()];
}

export default function HolidayCalendar() {
  useStorageSync();
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [calMonth, setCalMonth] = useState(new Date());
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewHoliday, setViewHoliday] = useState(null);
  const [errors, setErrors] = useState({});

  const holidays = getStore(STORAGE_KEYS.HOLIDAYS);
  const employees = getStore(STORAGE_KEYS.EMPLOYEES);

  const years = [...new Set(holidays.map(h => h.date?.slice(0, 4)))].sort().reverse();
  if (!years.includes(String(new Date().getFullYear()))) years.unshift(String(new Date().getFullYear()));

  const filtered = holidays.filter(h => {
    const matchYear = !yearFilter || h.date?.startsWith(yearFilter);
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.type.toLowerCase().includes(search.toLowerCase());
    return matchYear && matchSearch;
  }).sort((a, b) => a.date?.localeCompare(b.date));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.date) e.date = 'Required';
    if (!form.type) e.type = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function openAdd() { setForm(EMPTY); setEditId(null); setErrors({}); setShowForm(true); }
  function openEdit(h) { setForm({ name: h.name, date: h.date, type: h.type, description: h.description || '', repeatEveryYear: !!h.repeatEveryYear, status: h.status }); setEditId(h.id); setErrors({}); setShowForm(true); }

  function save() {
    if (!validate()) return;
    const list = getStore(STORAGE_KEYS.HOLIDAYS);
    if (editId) {
      const idx = list.findIndex(h => h.id === editId);
      if (idx !== -1) list[idx] = { ...list[idx], ...form };
      setStore(STORAGE_KEYS.HOLIDAYS, list);
    } else {
      const newHol = { id: `HOL${Date.now()}`, ...form };
      list.push(newHol);
      setStore(STORAGE_KEYS.HOLIDAYS, list);
      // Notify all employees
      employees.forEach(emp => {
        addHolidayNotification(emp.id, `New holiday added: ${form.name} on ${form.date}`, newHol.id);
      });
    }
    setShowForm(false);
  }

  function confirmDelete() {
    const list = getStore(STORAGE_KEYS.HOLIDAYS).filter(h => h.id !== deleteId);
    setStore(STORAGE_KEYS.HOLIDAYS, list);
    setDeleteId(null);
  }

  // Calendar helpers
  function buildMonthGrid() {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function getHolidaysForDate(ds) {
    return holidays.filter(h => h.date === ds && h.status === 'active');
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Holiday Calendar</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button onClick={() => setView('list')} className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <List size={13} /> List
            </button>
            <button onClick={() => setView('calendar')} className={`px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              <Calendar size={13} /> Calendar
            </button>
          </div>
          <button onClick={openAdd} className="btn btn-primary gap-1.5">
            <Plus size={15} /> Add Holiday
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search holidays..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-32" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {HOLIDAY_TYPES.map(t => {
          const s = typeStyle(t);
          return (
            <div key={t} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-500 font-medium">{t}</span>
            </div>
          );
        })}
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="table-th">Holiday Name</th>
                <th className="table-th">Date</th>
                <th className="table-th">Day</th>
                <th className="table-th">Type</th>
                <th className="table-th">Description</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No holidays found.</td></tr>
              ) : filtered.map(h => {
                const s = typeStyle(h.type);
                return (
                  <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="table-td font-semibold text-gray-900">{h.name}</td>
                    <td className="table-td text-gray-600">{h.date}</td>
                    <td className="table-td text-gray-500">{dayName(h.date)}</td>
                    <td className="table-td">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{h.type}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 max-w-[200px] truncate">{h.description || '—'}</td>
                    <td className="table-td"><StatusBadge status={h.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewHoliday(h)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="View"><Eye size={14} /></button>
                        <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
          {/* Nav header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-500">
            <button onClick={() => setCalMonth(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 text-white">
              <CalendarDays size={16} className="opacity-80" />
              <h2 className="text-sm font-bold tracking-tight">{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</h2>
            </div>
            <button onClick={() => setCalMonth(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_SHORT.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/80">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {buildMonthGrid().map((d, i) => {
              const ds = d ? toDateStr(calMonth.getFullYear(), calMonth.getMonth(), d) : null;
              const dayHols = ds ? getHolidaysForDate(ds) : [];
              const isToday = ds === today;
              const isWeekend = i % 7 === 0 || i % 7 === 6;
              return (
                <div key={i} className={`min-h-[110px] p-2 border-b border-r border-gray-100 transition-colors ${!d ? 'bg-gray-50/60' : isWeekend ? 'bg-slate-50/40' : 'bg-white hover:bg-indigo-50/20'}`}>
                  {d && (
                    <>
                      <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1.5 ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'}`}>{d}</span>
                      <div className="space-y-1">
                        {dayHols.map(h => {
                          const s = typeStyle(h.type);
                          return (
                            <button key={h.id} onClick={() => setViewHoliday(h)}
                              className={`w-full text-left rounded-lg border overflow-hidden hover:shadow-md transition-all duration-150 ${s.chip}`}>
                              <div className="flex">
                                <div className={`w-1 flex-shrink-0 rounded-l-lg ${s.bar}`} />
                                <div className="px-2 py-1 min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold leading-tight truncate">{h.name}</p>
                                  <p className="text-[10px] opacity-70 truncate">{h.type.split(' ')[0]}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <Modal title={editId ? 'Edit Holiday' : 'Add Holiday'} onClose={() => setShowForm(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Holiday Name <span className="text-red-500">*</span></label>
              <input className={`input ${errors.name ? 'border-red-400' : ''}`} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. New Year's Day" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Holiday Date <span className="text-red-500">*</span></label>
              <input type="date" className={`input ${errors.date ? 'border-red-400' : ''}`} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="label">Holiday Type <span className="text-red-500">*</span></label>
              <select className={`input ${errors.type ? 'border-red-400' : ''}`} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="repeat" checked={form.repeatEveryYear} onChange={e => setForm(f => ({ ...f, repeatEveryYear: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
              <label htmlFor="repeat" className="text-sm text-gray-700 cursor-pointer">Repeat Every Year</label>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={save}>{editId ? 'Save Changes' : 'Save Holiday'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {viewHoliday && (() => {
        const s = typeStyle(viewHoliday.type);
        return (
          <Modal title="Holiday Details" onClose={() => setViewHoliday(null)} size="sm">
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${s.chip} flex items-center gap-3`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bar} text-white flex-shrink-0`}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base">{viewHoliday.name}</p>
                  <p className="text-xs font-medium opacity-80">{viewHoliday.type}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  ['Date', viewHoliday.date],
                  ['Day', dayName(viewHoliday.date)],
                  ['Type', viewHoliday.type],
                  ['Description', viewHoliday.description || '—'],
                  ['Repeats Yearly', viewHoliday.repeatEveryYear ? 'Yes' : 'No'],
                  ['Status', viewHoliday.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
                    <span className="text-xs font-semibold text-gray-800 flex-1">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button className="btn btn-secondary flex-1" onClick={() => setViewHoliday(null)}>Close</button>
                <button className="btn btn-primary flex-1" onClick={() => { setViewHoliday(null); openEdit(viewHoliday); }}>Edit</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Holiday"
          message="Are you sure you want to delete this holiday? This action cannot be undone."
          confirmLabel="Delete"
          confirmClass="btn-danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
