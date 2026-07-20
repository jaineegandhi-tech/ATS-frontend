import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, markRecruitmentNotificationRead, STORAGE_KEYS } from '../../utils/store';
import { useStorageSync } from '../../utils/useStorageSync';
import { ROLE_LABELS } from '../../utils/roles';
import Avatar from '../shared/Avatar';
import ConfirmDialog from '../shared/ConfirmDialog';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  useStorageSync();

  const recentLogs = getStore(STORAGE_KEYS.ACTIVITY_LOGS).slice(0, 5);
  const recruitmentNotifs = getStore(STORAGE_KEYS.RECRUITMENT_NOTIFICATIONS)
    .filter(n => n.toUserId === user?.id && !n.read)
    .slice(0, 10);
  const latestNotifId = recruitmentNotifs[0]?.id;
  const notifCount = recruitmentNotifs.length;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
        <div />
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifs(v => !v)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Bell size={17} className="text-gray-500" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-modal border border-gray-100 z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Notifications</p>
                    {notifCount > 0 && <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">{notifCount} pending</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recruitmentNotifs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">Recruitment</p>
                        {recruitmentNotifs.map(n => {
                          const isNewest = n.id === latestNotifId;
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                markRecruitmentNotificationRead(n.id);
                                setShowNotifs(false);
                                if (n.type === 'candidate_reassigned' && n.relatedId) navigate(`/candidates/${n.relatedId}`);
                                else navigate('/approvals');
                              }}
                              className={`w-full text-left px-4 py-2.5 transition-colors border-b border-gray-50 last:border-0 ${isNewest ? 'bg-violet-50 border-violet-100' : 'hover:bg-violet-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <p className={`text-sm ${isNewest ? 'text-violet-800 font-semibold' : 'text-gray-700'}`}>{n.message}</p>
                                {isNewest && <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5">NEW</span>}
                              </div>
                              <p className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {recentLogs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">Recent Activity</p>
                        {recentLogs.map(log => (
                          <div key={log.id} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
                            <p className="text-sm text-gray-700">{log.action}</p>
                            <p className="text-xs text-gray-400">{log.details} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {recruitmentNotifs.length === 0 && recentLogs.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Avatar employee={user} size="sm" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <ChevronDown size={13} className="text-gray-400 ml-0.5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-modal border border-gray-100 py-1.5 z-40">
                  <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                    <p className="text-xs font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[11px] text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/dashboard'); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={13} className="text-gray-400" /> Dashboard
                  </button>
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button
                      onClick={() => { setShowMenu(false); setShowLogout(true); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={13} /> Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showLogout && (
        <ConfirmDialog
          title="Confirm Logout"
          message="Are you sure you want to logout from ATS?"
          confirmLabel="Logout"
          confirmClass="btn-danger"
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}
