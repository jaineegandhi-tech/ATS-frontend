import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { isRecruiter } from '../../utils/roles';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import { ChevronLeft, ChevronRight, CalendarDays, User, Clock, MapPin, Video, Star, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const DAYS_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HOUR_SLOTS  = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM – 7 PM

/* ── colour scheme per status ── */
function eventStyle(ivStatus, candStatus) {
  const s = candStatus?.toLowerCase();
  if (ivStatus === 'cancelled')                              return { bar: 'bg-gray-400',    chip: 'bg-gray-50  border-gray-200  text-gray-600',  dot: 'bg-gray-400'    };
  if (s === 'passed'  || s === 'selected')                  return { bar: 'bg-emerald-500', chip: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' };
  if (s === 'failed'  || s === 'rejected')                  return { bar: 'bg-red-500',     chip: 'bg-red-50   border-red-200   text-red-800',    dot: 'bg-red-500'     };
  if (s === 'next round scheduled')                         return { bar: 'bg-orange-500',  chip: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-500'  };
  if (ivStatus === 'completed')                             return { bar: 'bg-slate-400',   chip: 'bg-slate-50 border-slate-200 text-slate-700',   dot: 'bg-slate-400'   };
  return                                                           { bar: 'bg-indigo-500',  chip: 'bg-indigo-50 border-indigo-200 text-indigo-800', dot: 'bg-indigo-500'  };
}

function initials(c) {
  return `${c?.firstName?.[0] ?? ''}${c?.lastName?.[0] ?? ''}`.toUpperCase();
}

function avatarColor(id) {
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-orange-500','bg-pink-500','bg-teal-500'];
  return colors[(id?.charCodeAt(4) ?? 0) % colors.length];
}

/* ── small event chip used in month + week grid ── */
function EventChip({ iv, cand, interviewers, onClick }) {
  const style = eventStyle(iv.status, cand?.status);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border overflow-hidden hover:shadow-md transition-all duration-150 group ${style.chip}`}
    >
      <div className="flex">
        {/* accent bar */}
        <div className={`w-1 flex-shrink-0 rounded-l-lg ${style.bar}`} />
        <div className="px-2 py-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Clock size={9} className="flex-shrink-0 opacity-60" />
            <span className="text-[10px] font-bold tracking-tight">{iv.time}</span>
            <span className="text-[9px] opacity-60 ml-auto">{iv.round?.split(' ')[0]}</span>
          </div>
          <p className="text-[11px] font-semibold leading-tight truncate">
            {cand?.firstName} {cand?.lastName}
          </p>
          <p className="text-[10px] opacity-75 truncate leading-tight">{cand?.appliedPosition}</p>
          <p className="text-[10px] opacity-60 truncate leading-tight">
            <User size={8} className="inline mr-0.5" />{interviewers}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function InterviewCalendar() {
  useStorageSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView]       = useState('month');
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [overflow, setOverflow] = useState(null); // { ds, ivs } for "+N more"

  const allInterviews = getStore(STORAGE_KEYS.INTERVIEWS);
  const interviews = isRecruiter(user) ? allInterviews : allInterviews.filter(i => i.interviewerIds?.includes(user?.id));
  const candidates = getStore(STORAGE_KEYS.CANDIDATES);
  const employees  = getStore(STORAGE_KEYS.EMPLOYEES);

  const today = new Date().toISOString().split('T')[0];

  function getCandidate(cid)  { return candidates.find(c => c.id === cid); }
  function getEmpName(eid)    { const e = employees.find(x => x.id === eid); return e ? `${e.firstName} ${e.lastName}` : eid; }
  function getIvsForDate(ds)  { return interviews.filter(i => i.date === ds); }

  function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  /* navigation */
  function prev() {
    setCurrent(c => {
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() - 1, 1);
      if (view === 'week')  return new Date(c.getFullYear(), c.getMonth(), c.getDate() - 7);
      return new Date(c.getFullYear(), c.getMonth(), c.getDate() - 1);
    });
  }
  function next() {
    setCurrent(c => {
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() + 1, 1);
      if (view === 'week')  return new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7);
      return new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1);
    });
  }
  function goToday() { setCurrent(new Date()); }

  /* header label */
  function headerLabel() {
    if (view === 'month') return `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
    if (view === 'day')   return formatDate(current.toISOString());
    // week: show range
    const start = new Date(current);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start); end.setDate(end.getDate() + 6);
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${start.getMonth() !== end.getMonth() ? MONTHS[end.getMonth()] + ' ' : ''}${end.getDate()}, ${end.getFullYear()}`;
  }

  /* ── MONTH VIEW ── */
  function buildMonthGrid() {
    const y = current.getFullYear(), m = current.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  /* ── WEEK VIEW ── */
  function buildWeekDays() {
    const start = new Date(current);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(d.getDate() + i);
      return d;
    });
  }

  const LEGEND = [
    { color: 'bg-indigo-500',  label: 'Scheduled'   },
    { color: 'bg-emerald-500', label: 'Passed'       },
    { color: 'bg-red-500',     label: 'Rejected'     },
    { color: 'bg-orange-500',  label: 'Next Round'   },
    { color: 'bg-slate-400',   label: 'Completed'    },
    { color: 'bg-gray-400',    label: 'Cancelled'    },
  ];

  return (
    <div className="space-y-4">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Interview Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn btn-sm btn-secondary">Today</button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {['month','week','day'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Calendar card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">

        {/* Navigation header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-500">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-white">
            <CalendarDays size={16} className="opacity-80" />
            <h2 className="text-sm font-bold tracking-tight">{headerLabel()}</h2>
          </div>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── MONTH GRID ── */}
        {view === 'month' && (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/80">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {buildMonthGrid().map((d, i) => {
                const ds  = d ? toDateStr(current.getFullYear(), current.getMonth(), d) : null;
                const ivs = ds ? getIvsForDate(ds) : [];
                const isToday   = ds === today;
                const isWeekend = i % 7 === 0 || i % 7 === 6;
                return (
                  <div key={i}
                    className={`min-h-[130px] p-2 border-b border-r border-gray-100 transition-colors
                      ${!d ? 'bg-gray-50/60' : isWeekend ? 'bg-slate-50/40' : 'bg-white hover:bg-indigo-50/20'}`}>
                    {d && (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                            ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                            {d}
                          </span>
                          {ivs.length > 0 && (
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                              {ivs.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {ivs.slice(0, 2).map(iv => {
                            const cand = getCandidate(iv.candidateId);
                            const interviewers = iv.interviewerIds?.map(getEmpName).join(', ') || '—';
                            return (
                              <EventChip key={iv.id} iv={iv} cand={cand} interviewers={interviewers} onClick={() => setSelected(iv)} />
                            );
                          })}
                          {ivs.length > 2 && (
                            <button
                              onClick={() => setOverflow({ ds, ivs })}
                              className="text-[10px] text-indigo-500 font-semibold pl-1 hover:underline w-full text-left">
                              +{ivs.length - 2} more
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── WEEK GRID ── */}
        {view === 'week' && (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {buildWeekDays().map((d, i) => {
                const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                const isToday = ds === today;
                return (
                  <div key={i} className={`py-3 text-center border-r border-gray-100 last:border-0 ${isToday ? 'bg-indigo-50' : 'bg-gray-50/80'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{DAYS_SHORT[d.getDay()]}</p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>
            {/* Events row */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {buildWeekDays().map((d, i) => {
                const ds  = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                const ivs = getIvsForDate(ds);
                const isToday = ds === today;
                return (
                  <div key={i} className={`p-2 border-r border-gray-100 last:border-0 space-y-1.5 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                    {ivs.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] text-gray-300 font-medium">—</p>
                      </div>
                    ) : ivs.map(iv => {
                      const cand = getCandidate(iv.candidateId);
                      const interviewers = iv.interviewerIds?.map(getEmpName).join(', ') || '—';
                      return <EventChip key={iv.id} iv={iv} cand={cand} interviewers={interviewers} onClick={() => setSelected(iv)} />;
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── DAY VIEW ── */}
        {view === 'day' && (() => {
          const ds  = toDateStr(current.getFullYear(), current.getMonth(), current.getDate());
          const ivs = getIvsForDate(ds).sort((a, b) => a.time?.localeCompare(b.time));
          const isToday = ds === today;
          return (
            <div>
              {/* Day banner */}
              <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${isToday ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{DAYS_SHORT[current.getDay()]}</span>
                  <span className="text-xl leading-none">{current.getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{DAYS_FULL[current.getDay()]}, {MONTHS[current.getMonth()]} {current.getDate()}</p>
                  <p className="text-xs text-gray-400">{ivs.length} interview{ivs.length !== 1 ? 's' : ''} scheduled</p>
                </div>
              </div>

              {ivs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <CalendarDays size={40} className="mb-3" />
                  <p className="text-sm font-medium">No interviews scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {ivs.map(iv => {
                    const cand = getCandidate(iv.candidateId);
                    const interviewers = iv.interviewerIds?.map(getEmpName).join(', ') || '—';
                    const style = eventStyle(iv.status, cand?.status);
                    return (
                      <button key={iv.id} onClick={() => setSelected(iv)}
                        className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start gap-4">
                          {/* Time column */}
                          <div className="w-16 flex-shrink-0 text-right">
                            <p className="text-sm font-bold text-indigo-600">{iv.time}</p>
                            <p className="text-[10px] text-gray-400">{iv.duration}m</p>
                          </div>
                          {/* Accent line */}
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${style.bar}`} />
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(cand?.id)}`}>
                            {initials(cand)}
                          </div>
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{cand?.firstName} {cand?.lastName}</p>
                                <p className="text-xs text-indigo-600 font-medium">{cand?.appliedPosition}</p>
                              </div>
                              <StatusBadge status={iv.status} />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <User size={11} />{interviewers}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                {iv.mode === 'Online' ? <Video size={11} /> : <MapPin size={11} />}
                                {iv.mode}{iv.mode === 'Offline' && iv.location ? ` · ${iv.location}` : ''}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{iv.round}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Overflow Modal (+N more) ── */}
      {overflow && (
        <Modal
          title={`All Interviews — ${formatDate(overflow.ds)}`}
          onClose={() => setOverflow(null)}
          size="sm"
        >
          <div className="space-y-2">
            {overflow.ivs.map(iv => {
              const cand = getCandidate(iv.candidateId);
              const interviewers = iv.interviewerIds?.map(getEmpName).join(', ') || '—';
              return (
                <EventChip
                  key={iv.id}
                  iv={iv}
                  cand={cand}
                  interviewers={interviewers}
                  onClick={() => { setOverflow(null); setSelected(iv); }}
                />
              );
            })}
          </div>
        </Modal>
      )}

      {/* ── Event Detail Modal ── */}
      {selected && (() => {
        const cand  = getCandidate(selected.candidateId);
        const style = eventStyle(selected.status, cand?.status);
        const interviewers = selected.interviewerIds?.map(getEmpName).join(', ') || '—';
        return (
          <Modal title="Interview Details" onClose={() => setSelected(null)} size="sm">
            <div className="space-y-4">
              {/* Candidate header */}
              <div className={`rounded-xl p-4 border ${style.chip} flex items-center gap-3`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(cand?.id)}`}>
                  {initials(cand)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{cand?.firstName} {cand?.lastName}</p>
                  <p className="text-xs font-medium opacity-80">{cand?.appliedPosition}</p>
                  <div className="mt-1"><StatusBadge status={selected.status} /></div>
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-2.5">
                {[
                  [<Clock size={13} />,    'Time',          `${selected.time} · ${selected.duration} min`],
                  [<CalendarDays size={13} />, 'Date',      formatDate(selected.date)],
                  [<Star size={13} />,     'Round',         selected.round],
                  [<User size={13} />,     'Interviewer(s)', interviewers],
                  [selected.mode === 'Online' ? <Video size={13} /> : <MapPin size={13} />, 'Mode',
                    selected.mode === 'Online'
                      ? selected.meetingLink ? `Online · ${selected.meetingLink}` : 'Online'
                      : selected.location   ? `Offline · ${selected.location}`   : 'Offline'],
                ].map(([icon, label, value]) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</span>
                    <span className="text-xs font-semibold text-gray-800 flex-1">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button className="btn-secondary btn btn-sm flex-1 gap-1.5"
                  onClick={() => { setSelected(null); navigate(`/candidates/${selected.candidateId}`); }}>
                  <ExternalLink size={13} /> Open Candidate
                </button>
                <button className="btn-primary btn btn-sm flex-1 gap-1.5"
                  onClick={() => { setSelected(null); navigate(`/interview-feedback/${selected.id}`); }}>
                  <Star size={13} /> Add Feedback
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
