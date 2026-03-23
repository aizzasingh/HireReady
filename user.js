// shared helpers — load this before auth.js and dashboard.js

const USER_KEY = 'riq_user';
const RESUMES_KEY = 'riq_resumes';
const ANALYSIS_KEY = 'riq_last_analysis';

function saveUser(data) {
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

function getResumes() {
  try { return JSON.parse(localStorage.getItem(RESUMES_KEY)) || []; }
  catch { return []; }
}

function addResume(entry) {
  const list = getResumes();
  list.unshift(entry); // newest first
  if (list.length > 10) list.length = 10;
  localStorage.setItem(RESUMES_KEY, JSON.stringify(list));
}

function saveAnalysis(data) {
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data));
}

function getAnalysis() {
  try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY)); }
  catch { return null; }
}

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

// redirect if no session
function requireAuth(redirectTo = '../pages/login.html') {
  if (!getUser()) window.location.href = redirectTo;
}

function logout(redirectTo = 'login.html') {
  clearUser();
  window.location.href = redirectTo;
}
