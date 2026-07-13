// shared helpers — load this before auth.js and dashboard.js

// Point this at your Render backend URL in production
const API_BASE = 'http://localhost:8000';

const USER_KEY     = 'riq_user';
const TOKEN_KEY    = 'riq_token';
const RESUMES_KEY  = 'riq_resumes';
const ANALYSIS_KEY = 'riq_last_analysis';

// ── token ────────────────────────────────────────────────
function getToken()         { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)        { localStorage.setItem(TOKEN_KEY, t); }
function clearToken()       { localStorage.removeItem(TOKEN_KEY); }

// ── user ─────────────────────────────────────────────────
function saveUser(data) { localStorage.setItem(USER_KEY, JSON.stringify(data)); }
function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}
function clearUser() { localStorage.removeItem(USER_KEY); }

// ── local resume cache (client-side history fallback) ────
function getResumes() {
  try { return JSON.parse(localStorage.getItem(RESUMES_KEY)) || []; }
  catch { return []; }
}
function addResume(entry) {
  const list = getResumes();
  list.unshift(entry);
  if (list.length > 10) list.length = 10;
  localStorage.setItem(RESUMES_KEY, JSON.stringify(list));
}

function saveAnalysis(data) { localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data)); }
function getAnalysis() {
  try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY)); }
  catch { return null; }
}

// ── authenticated fetch ──────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    logout('login.html');
    throw new Error('Session expired');
  }
  return res;
}

// ── auth ─────────────────────────────────────────────────
function requireAuth(redirectTo = 'login.html') {
  if (!getToken() || !getUser()) window.location.href = redirectTo;
}

function logout(redirectTo = 'login.html') {
  clearToken();
  clearUser();
  localStorage.removeItem(ANALYSIS_KEY);
  localStorage.removeItem(RESUMES_KEY);
  window.location.href = redirectTo;
}

// ── ui helpers ───────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
}

function injectUserUI() {
  const user = getUser();
  if (!user) return;
  const avatar = document.getElementById('userAvatar');
  if (avatar) avatar.textContent = getInitials(user.firstName, user.lastName);
  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName) welcomeName.textContent = `${getGreeting()}, ${user.firstName} 👋`;
}
