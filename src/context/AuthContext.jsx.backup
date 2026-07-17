import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, getStore, setStore, addLog } from '../utils/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)); } catch { return null; }
  });

  function login(username, password) {
    const employees = getStore(STORAGE_KEYS.EMPLOYEES);
    const emp = employees.find(e => e.username === username && e.password === password);
    if (!emp) return { error: 'Invalid username or password.' };
    if (emp.status === 'inactive') return { error: 'Your account has been deactivated. Please contact HR.' };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(emp));
    setUser(emp);
    addLog('Login', emp.id, `${emp.firstName} ${emp.lastName} logged in`);
    return { success: true, needsProfile: !emp.profileCompleted };
  }

  function logout() {
    if (user) addLog('Logout', user.id, `${user.firstName} ${user.lastName} logged out`);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setUser(null);
  }

  function refreshUser() {
    const employees = getStore(STORAGE_KEYS.EMPLOYEES);
    const updated = employees.find(e => e.id === user?.id);
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      setUser(updated);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
