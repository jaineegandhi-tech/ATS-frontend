const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAccessToken() {
  return localStorage.getItem('ats_access_token');
}

function getRefreshToken() {
  return localStorage.getItem('ats_refresh_token');
}

function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('ats_access_token', accessToken);
  if (refreshToken) localStorage.setItem('ats_refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('ats_access_token');
  localStorage.removeItem('ats_refresh_token');
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, { ...options, headers });

  // If token expired, try refresh once
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }
  }

  return res;
}

export { saveTokens, clearTokens, getAccessToken };
