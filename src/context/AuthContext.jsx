import { createContext, useContext, useState } from 'react';
import { STORAGE_KEYS, getStore } from '../utils/store';
import { saveTokens, clearTokens } from '../utils/api';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)); } catch { return null; }
  });

  async function login(username, password) {
    // Try backend with a short timeout, fall back to localStorage immediately
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed.' };
      saveTokens(data.accessToken, data.refreshToken);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch {
      // Backend unreachable or timed out — fall back to localStorage
      const { getStore, addLog } = await import('../utils/store');
      const employees = getStore(STORAGE_KEYS.EMPLOYEES);
      const emp = employees.find(e => e.username === username && e.password === password);
      if (!emp) return { error: 'Invalid username or password.' };
      if (emp.status === 'inactive') return { error: 'Your account has been deactivated. Please contact HR.' };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(emp));
      setUser(emp);
      addLog('Login', emp.id, `${emp.firstName} ${emp.lastName} logged in`);
      return { success: true };
    }
  }

  async function logout() {
    clearTokens();
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
